export interface PeerInfo {
  peerId: string;
  signalHint?: string;
  timestamp: number;
  capabilities: string[];
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'candidate';
  payload: any;
  from: string;
  to: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
}

