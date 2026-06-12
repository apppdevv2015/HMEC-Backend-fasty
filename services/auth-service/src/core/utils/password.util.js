const crypto = require('crypto');
const { promisify } = require('util');
const bcrypt = require('bcryptjs');

const scryptAsync = promisify(crypto.scrypt);
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$/;

function getBcryptRounds() {
  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

  if (!Number.isInteger(rounds) || rounds < 10 || rounds > 15) {
    return 12;
  }

  return rounds;
}

function isBcryptHash(storedHash) {
  return BCRYPT_HASH_PATTERN.test(storedHash);
}

async function hashPassword(password) {
  return bcrypt.hash(password, getBcryptRounds());
}

async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') {
    return false;
  }

  if (isBcryptHash(storedHash)) {
    return bcrypt.compare(password, storedHash);
  }

  const [algorithm, salt, expectedHash] = storedHash.split('$');

  if (algorithm !== 'scrypt' || !salt || !expectedHash) {
    return false;
  }

  const derivedKey = await scryptAsync(password, salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (expectedBuffer.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, derivedKey);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
