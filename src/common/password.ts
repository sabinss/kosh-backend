import { randomBytes, scrypt, timingSafeEqual } from 'crypto';

// Password hashing with Node's built-in scrypt (no extra dependency).
// Stored format: "<salt hex>:<hash hex>". The salt is random per password,
// so two users with the same password get different hashes.

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

const deriveKey = (password: string, salt: Buffer): Promise<Buffer> =>
    new Promise((resolve, reject) => {
        scrypt(password, salt, KEY_LENGTH, (err, key) =>
            err ? reject(err) : resolve(key),
        );
    });

export const hashPassword = async (password: string): Promise<string> => {
    const salt = randomBytes(SALT_LENGTH);
    const hash = await deriveKey(password, salt);
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
};

export const verifyPassword = async (
    password: string,
    stored: string,
): Promise<boolean> => {
    const [saltHex, hashHex] = stored.split(':');
    if (!saltHex || !hashHex) {
        return false;
    }
    const expected = Buffer.from(hashHex, 'hex');
    const candidate = await deriveKey(password, Buffer.from(saltHex, 'hex'));
    return (
        expected.length === candidate.length &&
        timingSafeEqual(candidate, expected)
    );
};
