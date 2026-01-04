import SimplePeer, { Instance } from 'simple-peer';
import { signaling } from './signaling';
import { discovery } from './dht';
import { SignalingMessage, ChatMessage } from './types';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export class ChatManager extends EventEmitter {
  private peers: Map<string, Instance> = new Map();
  private initialized = false;

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    // Initialize discovery
    await discovery.init();

    // Initialize signaling
    signaling.init((msg) => this.handleSignal(msg));
  }

  // Start a chat with a peer
  connectToPeer(peerId: string) {
    if (this.peers.has(peerId)) return;

    const p = new SimplePeer({
      initiator: true,
      trickle: false, // Simple implementation without trickle ICE for now
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
    });

    this.setupPeer(peerId, p);
  }

  sendMessage(peerId: string, text: string) {
    const p = this.peers.get(peerId);
    if (p) {
      const msg: ChatMessage = {
        id: uuidv4(),
        text,
        sender: discovery.libp2pNode?.peerId.toString() || 'me',
        timestamp: Date.now()
      };
      p.send(JSON.stringify(msg));
      // Emit so UI shows our own message
      this.emit('message', { peerId, message: msg });
    }
  }

  private handleSignal(msg: SignalingMessage) {
    const { from, type, payload } = msg;

    let p = this.peers.get(from);

    if (!p) {
      // Incoming connection
      if (type === 'offer') {
        p = new SimplePeer({
          initiator: false,
          trickle: false,
          config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
        });
        this.setupPeer(from, p);
        p.signal(payload);
      }
    } else {
      p.signal(payload);
    }
  }

  private setupPeer(peerId: string, p: Instance) {
    this.peers.set(peerId, p);

    p.on('signal', (data) => {
      // Determine type based on data (SimplePeer data includes type)
      signaling.sendSignal(peerId, data.type || 'signal', data);
    });

    p.on('connect', () => {
      console.log(`Connected to ${peerId}`);
      this.emit('connected', peerId);
    });

    p.on('data', (data) => {
      try {
        const msg = JSON.parse(data.toString()) as ChatMessage;
        this.emit('message', { peerId, message: msg });
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

