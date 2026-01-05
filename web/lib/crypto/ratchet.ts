import sodium from 'libsodium-wrappers';
import {
  KeyPair,
  concat,
  hkdf,
  randomBytes,
  x25519Shared,
  generateX25519,
  zero,
} from './primitives';

export interface RatchetHeader {
  publicKey: Uint8Array; // current DH pub
  counter: number;
}

export interface EncryptedMessage {
  header: RatchetHeader;
  ciphertext: Uint8Array;
  nonce: Uint8Array;
}

export class DoubleRatchet {
  private rootKey: Uint8Array;
  private sendChainKey: Uint8Array;
  private recvChainKey: Uint8Array;
  private myDh: KeyPair;
  private remoteDh: Uint8Array;
  private sendCount = 0;
  private recvCount = 0;

  constructor(rootKey: Uint8Array, myDh: KeyPair, remoteDh: Uint8Array) {
    this.rootKey = rootKey;
    this.myDh = myDh;
    this.remoteDh = remoteDh;
    this.sendChainKey = randomBytes(32);
    this.recvChainKey = randomBytes(32);
  }

  static async initialize(
    rootKey: Uint8Array,
    remoteDh: Uint8Array
  ): Promise<DoubleRatchet> {
    await sodium.ready;
    const myDh = generateX25519();
    return new DoubleRatchet(rootKey, myDh, remoteDh);
  }

  private async kdfRoot(dhOut: Uint8Array) {
    const derived = await hkdf(
      dhOut,
      this.rootKey,
      new Uint8Array([0x01]),
      64
    );
    this.rootKey = derived.slice(0, 32);
    this.recvChainKey = derived.slice(32);
  }

  private async nextSendKey(): Promise<Uint8Array> {
    const mk = await hkdf(this.sendChainKey, this.rootKey, new Uint8Array([0x02]));
    this.sendChainKey = mk;
    return mk;
  }

  private async nextRecvKey(): Promise<Uint8Array> {
    const mk = await hkdf(this.recvChainKey, this.rootKey, new Uint8Array([0x03]));
    this.recvChainKey = mk;
    return mk;
  }

  private async dhRatchet(remotePub: Uint8Array) {
    const dhOut = x25519Shared(this.myDh.privateKey, remotePub);
    await this.kdfRoot(dhOut);
    this.remoteDh = remotePub;
  }

  async encrypt(plaintext: Uint8Array): Promise<EncryptedMessage> {
    const mk = await this.nextSendKey();
    const nonce = randomBytes(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    const ad = concat(this.myDh.publicKey, this.remoteDh);
    const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      plaintext,
      ad,
      null,
      nonce,
      mk
    );
    const header: RatchetHeader = {
      publicKey: this.myDh.publicKey,
      counter: this.sendCount++,
    };
    zero(mk);
    return { header, ciphertext, nonce };
  }

  async decrypt(msg: EncryptedMessage): Promise<Uint8Array> {
    // Ratchet if remote key changed
    if (Buffer.compare(Buffer.from(msg.header.publicKey), Buffer.from(this.remoteDh)) !== 0) {
      await this.dhRatchet(msg.header.publicKey);
      // Reset counters
      this.recvCount = 0;
      this.sendCount = 0;
    }
    const mk = await this.nextRecvKey();
    const ad = concat(this.myDh.publicKey, msg.header.publicKey);
    const plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      msg.ciphertext,
      ad,
      msg.nonce,
      mk
    );
    zero(mk);
    return plaintext;
  }

  exportState() {
    return {
      rootKey: this.rootKey,
      myDh: this.myDh,
      remoteDh: this.remoteDh,
      sendCount: this.sendCount,
      recvCount: this.recvCount,
    };
  }
}

