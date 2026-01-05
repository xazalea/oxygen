import sodium from 'libsodium-wrappers';
import { kyber } from 'crystals-kyber';
import { Buffer } from 'buffer';

// Utility encoders
export const toBase64 = (buf: Uint8Array) =>
  Buffer.from(buf).toString('base64');
export const fromBase64 = (b64: string) =>
  new Uint8Array(Buffer.from(b64, 'base64'));

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface KyberKeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

let readyPromise: Promise<void> | null = null;

export async function ready() {
  if (!readyPromise) {
    readyPromise = (async () => {
      await sodium.ready;
      // kyber init is synchronous in current impl
    })();
  }
  return readyPromise;
}

export function randomBytes(length = 32): Uint8Array {
  return sodium.randombytes_buf(length);
}

// X25519
export function generateX25519(): KeyPair {
  const kp = sodium.crypto_kx_keypair();
  return { publicKey: kp.publicKey, privateKey: kp.privateKey };
}

export function x25519Shared(priv: Uint8Array, pub: Uint8Array): Uint8Array {
  return sodium.crypto_scalarmult(priv, pub);
}

// Ed25519 (for signing ephemeral bundles)
export function generateEd25519(): KeyPair {
  const kp = sodium.crypto_sign_keypair();
  return { publicKey: kp.publicKey, privateKey: kp.privateKey };
}

export function ed25519Sign(message: Uint8Array, priv: Uint8Array): Uint8Array {
  return sodium.crypto_sign_detached(message, priv);
}

export function ed25519Verify(
  message: Uint8Array,
  sig: Uint8Array,
  pub: Uint8Array
): boolean {
  return sodium.crypto_sign_verify_detached(sig, message, pub);
}

// Kyber-768 (post-quantum KEM)
export function kyberKeypair(): KyberKeyPair {
  const { publicKey, secretKey } = kyber.KeyGen();
  return { publicKey, privateKey: secretKey };
}

export function kyberEncapsulate(pub: Uint8Array) {
  const { cipherText, sharedSecret } = kyber.Enc(pub);
  return { cipherText, sharedSecret };
}

export function kyberDecapsulate(
  cipherText: Uint8Array,
  priv: Uint8Array
): Uint8Array {
  return kyber.Dec(cipherText, priv);
}

// HKDF-SHA256 using WebCrypto (browser/Node 18+)
export async function hkdf(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length = 32
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    ikm,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const prk = new Uint8Array(
    await crypto.subtle.sign({ name: 'HMAC' }, key, salt)
  );

  const okm = new Uint8Array(length);
  let prev = new Uint8Array();
  let offset = 0;
  let counter = 1;
  while (offset < length) {
    const input = new Uint8Array(prev.length + info.length + 1);
    input.set(prev, 0);
    input.set(info, prev.length);
    input[input.length - 1] = counter;

    const hmacKey = await crypto.subtle.importKey(
      'raw',
      prk,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const output = new Uint8Array(
      await crypto.subtle.sign({ name: 'HMAC' }, hmacKey, input)
    );
    const toCopy = Math.min(output.length, length - offset);
    okm.set(output.slice(0, toCopy), offset);
    prev = output;
    offset += toCopy;
    counter++;
  }
  return okm;
}

export function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

export function zero(buf?: Uint8Array) {
  if (!buf) return;
  buf.fill(0);
}

