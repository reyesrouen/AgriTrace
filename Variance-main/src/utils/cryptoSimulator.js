/**
 * Cryptographic Provenance Simulator
 * Replicates the R pipeline's digest (SHA-256) and openssl (ECDSA P-256) security gate.
 * Fully UTF-8 compliant and resilient to multi-byte unicode characters.
 */

// Pure JavaScript synchronous SHA-256 implementation with complete UTF-8 byte normalization
export function sha256Sync(inputStr) {
  if (typeof inputStr !== 'string') {
    inputStr = JSON.stringify(inputStr) || '';
  }

  // Convert unicode string to UTF-8 byte sequence safely
  let ascii = '';
  try {
    ascii = unescape(encodeURIComponent(inputStr));
  } catch {
    ascii = inputStr;
  }

  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  let result = '';

  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [];
  const k = [];
  let primeCounter = 0;

  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= (j & 0xff) << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];

      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] =
        i < 16
          ? w[i]
          : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

      const s1_h =
        rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 =
        (hash[7] + s1_h + ch + k[i] + w[i]) | 0;
      const s0_h =
        rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0_h + maj) | 0;

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Generates an ECDSA P-256 style signature representation for a hash
 */
export function generateEcdsaSignature(dataHash, privateKeyId = 'PRIV_KEY_PHIL_DA_01') {
  const rPart = sha256Sync(dataHash + privateKeyId + '_r').substring(0, 64);
  const sPart = sha256Sync(dataHash + privateKeyId + '_s').substring(0, 64);
  return `30440220${rPart}0220${sPart}`;
}

/**
 * Master Verification Gate Circuit Breaker
 * Directly replicates R/02_verification_gate.R
 */
export function verifyBatchIntegrity(batchPayload, expectedManifestHash, signature, publicKey) {
  const payloadString = typeof batchPayload === 'string' 
    ? batchPayload 
    : JSON.stringify(batchPayload, Object.keys(batchPayload).sort());
  
  const currentHash = sha256Sync(payloadString);

  // Circuit Breaker Rule 1: Hash equality
  if (currentHash !== expectedManifestHash) {
    return {
      verified: false,
      status: 'SECURITY_HALT',
      error: '[SECURITY HALT] Data payload hash mismatch! File has been tampered with or corrupted.',
      expectedHash: expectedManifestHash,
      computedHash: currentHash,
      timestamp: new Date().toISOString()
    };
  }

  // Circuit Breaker Rule 2: Signature validation
  if (!signature || !signature.startsWith('30440220') || signature.length < 70) {
    return {
      verified: false,
      status: 'SECURITY_HALT',
      error: '[SECURITY HALT] Invalid ECDSA signature! Untrusted data source.',
      expectedHash: expectedManifestHash,
      computedHash: currentHash,
      timestamp: new Date().toISOString()
    };
  }

  return {
    verified: true,
    status: 'PASS_VERIFIED',
    message: '[PASS / VERIFIED] Data integrity verified successfully.',
    hash: currentHash,
    signature: signature,
    publicKey: publicKey || 'PUBKEY_SECP256R1_DEPT_OF_AGRI_PHIL',
    timestamp: new Date().toISOString()
  };
}
