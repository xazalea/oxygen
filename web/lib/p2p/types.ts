export interface PeerInfo {
  sessionId: string;
  prekey: AdvertisedPrekey;
  timestamp: number;
  capabilities: string[];
  signalHint?: string;
  transportId: string;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'candidate' | 'handshake-init' | 'handshake-accept';
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

export interface AdvertisedPrekey {
  sessionId: string;
  identityKey: string;
  sigPub: string;
  signedPrekey: string;
  kyberPub: string;
  signature: string;
}

export interface Frame {
  header: string;
  ciphertext: string;
  nonce: string;
  paddingLength: number;
}

