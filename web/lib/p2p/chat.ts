import SimplePeer, { Instance } from 'simple-peer';
import { signaling } from './signaling';
import { discovery } from './dht';
import { SignalingMessage, ChatMessage, Frame, PeerInfo } from './types';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';
import {
  fromBase64,
  randomBytes,
  ready,
  toBase64,
  generateX25519,
} from '../crypto/primitives';
import {
  AdvertisedBundle,
  HandshakeAccept,
  HandshakeInit,
  createPrekeyBundle,
  initiateHandshake,
  respondHandshake,
} from '../crypto/handshake';
import { DoubleRatchet } from '../crypto/ratchet';
import { sessionManager } from '../crypto/session';

const PAD_SIZE = 4096;

export class ChatManager extends EventEmitter {
  private peers: Map<string, Instance> = new Map(); // key: transportId
  private peerInfos: Map<string, PeerInfo> = new Map();
  private initialized = false;
  private pendingHandshake: Map<string, { rootKey: Uint8Array; sas: string }> =
    new Map();

  async init() {
    if (this.initialized) return;
    this.initialized = true;
    await ready();
    await discovery.init();
    signaling.init((msg) => this.handleSignal(msg));

    discovery.on('peer:discovered', (info: PeerInfo) => {
      this.peerInfos.set(info.transportId, info);
      this.emit('peer:discovered', info);
    });

    // Ensure local prekey exists
    if (!sessionManager.getLocal()) {
      const { bundle, advertised } = createPrekeyBundle();
      sessionManager.setLocal({ bundle, advertised });
    }
  }

  async setRoom(room: string, secret: string) {
    await discovery.joinRoom(room, secret);
  }

  connectToPeer(info: PeerInfo) {
    const peerId = info.transportId;
    if (this.peers.has(peerId)) return;

    const p = new SimplePeer({
      initiator: true,
      trickle: false,
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
    });

    this.setupPeer(peerId, p, info);

    // Kick off PQ-X3DH handshake via signaling
    const local = sessionManager.getLocal();
    if (!local) return;
    const ratchetSeed = generateX25519();
    initiateHandshake(local.bundle, info.prekey as AdvertisedBundle, ratchetSeed.publicKey)
      .then(({ init, result }) => {
        this.pendingHandshake.set(peerId, {
          rootKey: result.rootKey,
          sas: result.sas,
        });
        signaling.sendSignal(peerId, 'handshake-init', init);
      })
      .catch((err) => console.error('Handshake init failed', err));
  }

  sendMessage(peerId: string, text: string) {
    const p = this.peers.get(peerId);
    const sess = sessionManager.getSession(peerId);
    if (p && sess) {
      const msg: ChatMessage = {
        id: uuidv4(),
        text,
        sender: sessionManager.getLocal()?.advertised.sessionId || 'me',
        timestamp: Date.now(),
      };
      this.enqueueEncrypted(peerId, msg);
      // Emit local echo
      this.emit('message', { peerId, message: msg, sas: sess.sas });
    }
  }

  private async enqueueEncrypted(peerId: string, msg: ChatMessage) {
    const sess = sessionManager.getSession(peerId);
    const p = this.peers.get(peerId);
    if (!sess || !p) return;
    const plaintext = new TextEncoder().encode(JSON.stringify(msg));
    const encrypted = await sess.ratchet.encrypt(plaintext);
    const frame: Frame = {
      header: toBase64(
        new Uint8Array([
          ...encrypted.header.publicKey,
          ...new Uint8Array([encrypted.header.counter]),
        ])
      ),
      ciphertext: toBase64(encrypted.ciphertext),
      nonce: toBase64(encrypted.nonce),
      paddingLength: 0,
    };
    const padded = this.padFrame(JSON.stringify(frame));
    const jitter = 150 + Math.random() * 350;
    setTimeout(() => p.send(padded), jitter);
  }

  private padFrame(str: string): string {
    const data = new TextEncoder().encode(str);
    const padLen = Math.max(0, PAD_SIZE - data.length);
    const padding = randomBytes(padLen);
    const combined = new Uint8Array(data.length + padding.length);
    combined.set(data, 0);
    combined.set(padding, data.length);
    return Buffer.from(combined).toString('base64');
  }

  private unpadFrame(b64: string): Frame | null {
    try {
      const buf = fromBase64(b64);
      // Remove padding by parsing JSON at start
      const decoder = new TextDecoder();
      const text = decoder.decode(buf).trim();
      const jsonStart = text.indexOf('{');
      const json = text.slice(jsonStart);
      return JSON.parse(json) as Frame;
    } catch (e) {
      console.error('Failed to unpad frame', e);
      return null;
    }
  }

  private async handleSignal(msg: SignalingMessage) {
    const { from, type, payload } = msg;
    let p = this.peers.get(from);

    if (type === 'handshake-init') {
      await this.onHandshakeInit(from, payload as HandshakeInit);
      return;
    }
    if (type === 'handshake-accept') {
      await this.onHandshakeAccept(from, payload as HandshakeAccept);
      return;
    }

    if (!p) {
      if (type === 'offer') {
        p = new SimplePeer({
          initiator: false,
          trickle: false,
          config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
        });
        this.setupPeer(from, p);
        p.signal(payload);
      }
    } else {
      p.signal(payload);
    }
  }

  private async onHandshakeInit(from: string, init: HandshakeInit) {
    const local = sessionManager.getLocal();
    if (!local) return;
    const ratchetSeed = generateX25519();
    const { accept, result } = await respondHandshake(
      local.bundle,
      init,
      ratchetSeed.publicKey
    );

    const ratchet = await DoubleRatchet.initialize(
      result.rootKey,
      result.remoteRatchetPub!
    );
    sessionManager.storeSession(from, ratchet, result.sas);
    signaling.sendSignal(from, 'handshake-accept', accept);
    this.emit('sas', { peerId: from, sas: result.sas });
  }

  private async onHandshakeAccept(from: string, accept: HandshakeAccept) {
    const pending = this.pendingHandshake.get(from);
    if (!pending) return;
    const remoteRatchetPub = fromBase64(accept.ratchetPub);
    const ratchet = await DoubleRatchet.initialize(
      pending.rootKey,
      remoteRatchetPub
    );
    sessionManager.storeSession(from, ratchet, pending.sas);
    this.pendingHandshake.delete(from);
    this.emit('sas', { peerId: from, sas: pending.sas });
  }

  private setupPeer(peerId: string, p: Instance, info?: PeerInfo) {
    if (info) {
      this.peerInfos.set(peerId, info);
    }
    this.peers.set(peerId, p);

    p.on('signal', (data) => {
      signaling.sendSignal(peerId, data.type || 'signal', data);
    });

    p.on('connect', () => {
      this.emit('connected', peerId);
    });

    p.on('data', async (data) => {
      const frame = this.unpadFrame(data.toString());
      if (!frame) return;
      const sess = sessionManager.getSession(peerId);
      if (!sess) return;

      const headerBuf = fromBase64(frame.header);
      const pub = headerBuf.slice(0, headerBuf.length - 1);
      const counter = headerBuf[headerBuf.length - 1];

      const decrypted = await sess.ratchet.decrypt({
        header: { publicKey: pub, counter },
        ciphertext: fromBase64(frame.ciphertext),
        nonce: fromBase64(frame.nonce),
      });
      try {
        const msg = JSON.parse(new TextDecoder().decode(decrypted)) as ChatMessage;
        this.emit('message', { peerId, message: msg, sas: sess.sas });
      } catch (e) {
        console.error('Failed to parse message', e);
      }
    });

    p.on('close', () => {
      this.peers.delete(peerId);
      this.emit('disconnected', peerId);
    });

    p.on('error', (err) => {
      console.error('Peer error:', err);
    });
  }
}

export const chatManager = new ChatManager();

