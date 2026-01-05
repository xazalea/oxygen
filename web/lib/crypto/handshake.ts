import { Buffer } from 'buffer';
import {
  KeyPair,
  KyberKeyPair,
  concat,
  ed25519Sign,
  ed25519Verify,
  fromBase64,
  generateEd25519,
  generateX25519,
  hkdf,
  kyberDecapsulate,
  kyberEncapsulate,
  kyberKeypair,
  randomBytes,
  toBase64,
  x25519Shared,
} from './primitives';

export interface PrekeyBundle {
  sessionId: string;
  identityKey: KeyPair; // X25519
  sigKey: KeyPair; // Ed25519
  signedPrekey: KeyPair; // X25519 signed by sigKey
  kyber: KyberKeyPair;
  signature: Uint8Array;
}

export interface AdvertisedBundle {
  sessionId: string;
  identityKey: string;
  sigPub: string;
  signedPrekey: string;
  kyberPub: string;
  signature: string;
}

export interface HandshakeInit {
  fromSession: string;
  ekPub: string;
  ratchetPub: string;
  kyberCipher: string;
}

export interface HandshakeAccept {
  toSession: string;
  ratchetPub: string;
}

export interface HandshakeResult {
  rootKey: Uint8Array;
  sas: string;
  remoteRatchetPub?: Uint8Array;
}

const WORDS = [
  'acorn','brisk','cable','delta','ember','frost','gamut','harbor',
  'icicle','jazz','krypton','lumen','magma','nylon','onyx','pixel',
  'quartz','rivet','saffron','tango','ultra','velvet','walnut','xenon',
  'yonder','zephyr'
];

export function createPrekeyBundle(): { bundle: PrekeyBundle; advertised: AdvertisedBundle } {
  const identityKey = generateX25519();
  const sigKey = generateEd25519();
  const signedPrekey = generateX25519();
  const kyber = kyberKeypair();

  const spkBytes = concat(
    identityKey.publicKey,
    signedPrekey.publicKey,
    kyber.publicKey
  );
  const signature = ed25519Sign(spkBytes, sigKey.privateKey);

  const sessionId = toBase64(randomBytes(16));

  return {
    bundle: { sessionId, identityKey, sigKey, signedPrekey, kyber, signature },
    advertised: {
      sessionId,
      identityKey: toBase64(identityKey.publicKey),
      sigPub: toBase64(sigKey.publicKey),
      signedPrekey: toBase64(signedPrekey.publicKey),
      kyberPub: toBase64(kyber.publicKey),
      signature: toBase64(signature),
    },
  };
}

export function verifyPrekeyBundle(ad: AdvertisedBundle): boolean {
  const message = concat(
    fromBase64(ad.identityKey),
    fromBase64(ad.signedPrekey),
    fromBase64(ad.kyberPub)
  );
  return ed25519Verify(message, fromBase64(ad.signature), fromBase64(ad.sigPub));
}

export async function initiateHandshake(
  self: PrekeyBundle,
  remote: AdvertisedBundle,
  ratchetPub: Uint8Array
): Promise<{ init: HandshakeInit; result: HandshakeResult }> {
  if (!verifyPrekeyBundle(remote)) {
    throw new Error('Remote prekey verification failed');
  }

  const ek = generateX25519();
  const dh1 = x25519Shared(ek.privateKey, fromBase64(remote.identityKey));
  const dh2 = x25519Shared(ek.privateKey, fromBase64(remote.signedPrekey));
  const dh3 = x25519Shared(self.identityKey.privateKey, fromBase64(remote.signedPrekey));
  const { cipherText, sharedSecret: dh4 } = kyberEncapsulate(fromBase64(remote.kyberPub));

  const ikm = concat(dh1, dh2, dh3, dh4);
  const rootKey = await hkdf(ikm, randomBytes(32), new Uint8Array([0x10]), 32);
  const sas = safetyNumber(rootKey);

  const init: HandshakeInit = {
    fromSession: self.sessionId,
    ekPub: toBase64(ek.publicKey),
    kyberCipher: toBase64(cipherText),
    ratchetPub: toBase64(ratchetPub),
  };

  return {
    init,
    result: {
      rootKey,
      sas,
    },
  };
}

export async function respondHandshake(
  self: PrekeyBundle,
  init: HandshakeInit,
  ratchetPub: Uint8Array
): Promise<{ accept: HandshakeAccept; result: HandshakeResult }> {
  const ekPub = fromBase64(init.ekPub);

  const dh1 = x25519Shared(self.identityKey.privateKey, ekPub);
  const dh2 = x25519Shared(self.signedPrekey.privateKey, ekPub);
  const dh3 = x25519Shared(self.signedPrekey.privateKey, ekPub); // symmetry
  const dh4 = kyberDecapsulate(fromBase64(init.kyberCipher), self.kyber.privateKey);

  const ikm = concat(dh1, dh2, dh3, dh4);
  const rootKey = await hkdf(ikm, randomBytes(32), new Uint8Array([0x11]), 32);
  const sas = safetyNumber(rootKey);

  const accept: HandshakeAccept = {
    toSession: init.fromSession,
    ratchetPub: toBase64(ratchetPub),
  };

  return {
    accept,
    result: {
      rootKey,
      remoteRatchetPub: fromBase64(init.ratchetPub),
      sas,
    },
  };
}

export function safetyNumber(rootKey: Uint8Array): string {
  const nums = [];
  for (let i = 0; i < 4; i++) {
    const idx = rootKey[i] % WORDS.length;
    nums.push(WORDS[idx]);
  }
  return nums.join(' ');
}

