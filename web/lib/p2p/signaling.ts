import { discovery } from './dht';
import { SignalingMessage } from './types';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export class SignalingChannel extends EventEmitter {
  private topic: string = 'oxygen-signaling';

  constructor() {
    super();
  }

  init(onSignal: (msg: SignalingMessage) => void) {
    discovery.on('signaling:message', (data: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(data)) as SignalingMessage;
        const myId = discovery.libp2pNode?.peerId.toString();
        if (!myId) return;
        if (msg.to === myId) {
          onSignal(msg);
        }
      } catch (e) {
        console.error('Error parsing signaling message', e);
      }
    });
  }

  async sendSignal(
    to: string,
    type: SignalingMessage['type'],
    payload: any
  ) {
    const fromId = discovery.libp2pNode?.peerId.toString() || '';
    if (!fromId) {
      console.warn('Node not initialized, cannot send signal');
      return;
    }
    const msg: SignalingMessage = { type, payload, from: fromId, to };
    const data = new TextEncoder().encode(JSON.stringify(msg));
    await discovery.libp2pNode?.services.pubsub.publish(this.topic, data);
  }
}

export const signaling = new SignalingChannel();

