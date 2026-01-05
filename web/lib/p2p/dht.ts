import { createLibp2p, Libp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@libp2p/noise';
import { mplex } from '@libp2p/mplex';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { bootstrap } from '@libp2p/bootstrap';
import { PeerInfo } from './types';
import { EventEmitter } from 'events';
import { createPrekeyBundle } from '../crypto/handshake';
import { sessionManager } from '../crypto/session';

// Public bootstrap nodes (examples, might need reliable ones for production)
const BOOTSTRAP_NODES = [
  '/dns4/node0.preload.ipfs.io/tcp/443/wss/p2p/QmZMxNdpzrT47bCxZTehF234fCC6z1tU9I33nP86gWd8t',
  '/dns4/node1.preload.ipfs.io/tcp/443/wss/p2p/Qmbut9Ywz9YEDrz8ySBSgWyJk41Uvm2QJPhwDJzJyGFsD6'
];

export class P2PDiscovery extends EventEmitter {
  private node: Libp2p | null = null;
  private topic: string = 'oxygen-global-discovery';
  private peers: Map<string, PeerInfo> = new Map();
  private interval: NodeJS.Timeout | null = null;

  public get libp2pNode() {
    return this.node;
  }

  async joinRoom(room: string, secret: string) {
    const topic = await this.hashTopic(`${room}:${secret}`);
    this.topic = topic;
    this.peers.clear();
    // regenerate local prekeys
    const { bundle, advertised } = createPrekeyBundle();
    sessionManager.setLocal({ bundle, advertised });
    // resubscribe
    if (this.node) {
      await this.node.services.pubsub.unsubscribe(this.topic);
      this.node.services.pubsub.subscribe(topic);
      this.node.services.pubsub.subscribe('oxygen-signaling');
      this.startAdvertising();
    }
  }

  private async hashTopic(input: string) {
    const buf = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Buffer.from(hash).toString('hex');
  }

  async init() {
    if (this.node) return;

    this.node = await createLibp2p({
      transports: [webSockets()],
      connectionEncryption: [noise()],
      streamMuxers: [mplex()],
      peerDiscovery: [
        bootstrap({
          list: BOOTSTRAP_NODES
        })
      ],
      services: {
        pubsub: gossipsub({ allowPublishToZeroPeers: true })
      }
    });

    await this.node.start();
    console.log('P2P Node started with ID:', this.node.peerId.toString());

    // Subscribe to discovery topic
    this.node.services.pubsub.subscribe(this.topic);
    this.node.services.pubsub.subscribe('oxygen-signaling');

    this.node.services.pubsub.addEventListener('message', (evt) => {
      if (evt.detail.topic === this.topic) {
        this.handleDiscoveryMessage(evt.detail.data);
      } else if (evt.detail.topic === 'oxygen-signaling') {
        this.emit('signaling:message', evt.detail.data);
      }
    });

    // Start advertising self
    this.startAdvertising();
  }

  private startAdvertising() {
    this.interval = setInterval(() => {
      this.advertise();
    }, 10000); // Advertise every 10 seconds
    this.advertise(); // Immediate
  }

  private async advertise() {
    if (!this.node) return;
    if (!sessionManager.getLocal()) {
      const { bundle, advertised } = createPrekeyBundle();
      sessionManager.setLocal({ bundle, advertised });
    }
    const local = sessionManager.getLocal();
    if (!local) return;

    const info: PeerInfo = {
      sessionId: local.advertised.sessionId,
      prekey: local.advertised,
      timestamp: Date.now(),
      capabilities: ['webrtc', 'relay'],
      signalHint: 'libp2p-gossip',
      transportId: this.node.peerId.toString(),
    };

    const data = new TextEncoder().encode(JSON.stringify(info));
    await this.node.services.pubsub.publish(this.topic, data);
  }

  private handleDiscoveryMessage(data: Uint8Array) {
    try {
      const info = JSON.parse(new TextDecoder().decode(data)) as PeerInfo;
      // Filter out stale peers (older than 1 minute)
      if (Date.now() - info.timestamp > 60000) return;

      if (!this.peers.has(info.sessionId)) {
        console.log('Discovered new peer:', info.sessionId);
        this.emit('peer:discovered', info);
      }
      this.peers.set(info.sessionId, info);
    } catch (e) {
      console.error('Failed to parse peer info', e);
    }
  }

  getPeers(): PeerInfo[] {
    return Array.from(this.peers.values());
  }

  async stop() {
    if (this.interval) clearInterval(this.interval);
    if (this.node) await this.node.stop();
  }
}

export const discovery = new P2PDiscovery();

