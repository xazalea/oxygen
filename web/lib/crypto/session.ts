import { DoubleRatchet } from './ratchet';
import { PrekeyBundle, AdvertisedBundle, HandshakeResult } from './handshake';

export interface SessionState {
  peerSessionId: string;
  ratchet: DoubleRatchet;
  sas: string;
}

export interface LocalState {
  bundle: PrekeyBundle;
  advertised: AdvertisedBundle;
}

export class SessionManager {
  private local?: LocalState;
  private sessions: Map<string, SessionState> = new Map();

  setLocal(state: LocalState) {
    this.local = state;
  }

  getLocal() {
    return this.local;
  }

  storeSession(peer: string, ratchet: DoubleRatchet, sas: string) {
    this.sessions.set(peer, { peerSessionId: peer, ratchet, sas });
  }

  getSession(peer: string) {
    return this.sessions.get(peer);
  }

  clear() {
    this.sessions.clear();
    this.local = undefined;
  }
}

export const sessionManager = new SessionManager();

