const crypto = require('crypto');

// The original app hashed at 1000 iterations. That is far below anything
// current guidance calls acceptable for PBKDF2-HMAC-SHA512, so new hashes are
// written at CURRENT_ITERATIONS. Old records keep working because the count
// they were written with is stored on the record and used to verify.
const CURRENT_ITERATIONS = 210000;
const LEGACY_ITERATIONS = 1000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

function makeSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password, salt, iterations = CURRENT_ITERATIONS) {
  return crypto
    .pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST)
    .toString('hex');
}

// Constant time compare. A plain === on hex strings leaks how many leading
// characters matched through timing.
function verifyPassword(password, salt, iterations, expectedHash) {
  if (!salt || !expectedHash) return false;
  const count = iterations || LEGACY_ITERATIONS;
  const candidate = Buffer.from(hashPassword(password, salt, count), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

// True when a record was written at a weaker count and should be upgraded the
// next time we hold the plaintext, which is at login.
function needsRehash(iterations) {
  return (iterations || LEGACY_ITERATIONS) < CURRENT_ITERATIONS;
}

module.exports = {
  CURRENT_ITERATIONS,
  LEGACY_ITERATIONS,
  makeSalt,
  hashPassword,
  verifyPassword,
  needsRehash,
};
