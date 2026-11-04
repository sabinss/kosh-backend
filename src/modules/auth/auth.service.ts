import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'crypto';
import { UnauthorizedError } from '../../errors/unauthorized-error';

/*
 * FAKE auth service for learning the request flow.
 * Users live in memory and are gone on restart. Replace the Map with a
 * real database lookup when the real user table exists.
 */

export interface AuthUser {
    id: string;
    email: string;
    name: string;
}

interface UserRecord extends AuthUser {
    salt: Buffer;
    passwordHash: Buffer;
}

const KEY_LENGTH = 64;

const hashPassword = (password: string, salt: Buffer): Promise<Buffer> =>
    new Promise((resolve, reject) => {
        scrypt(password, salt, KEY_LENGTH, (err, key) =>
            err ? reject(err) : resolve(key),
        );
    });

// Used when the email is unknown, so unknown users cost the same time as
// wrong passwords (prevents guessing which emails exist).
const DUMMY_SALT = Buffer.alloc(16);
const DUMMY_HASH = Buffer.alloc(KEY_LENGTH);

const users = new Map<string, UserRecord>();

const seedFakeUsers = async (): Promise<void> => {
    const salt = randomBytes(16);
    users.set('demo@kosh.dev', {
        id: randomUUID(),
        email: 'demo@kosh.dev',
        name: 'Demo User',
        salt,
        passwordHash: await hashPassword('Password123', salt),
    });
};

const seeded = seedFakeUsers();

export const login = async (
    email: string,
    password: string,
): Promise<{ token: string; user: AuthUser }> => {
    await seeded;

    const user = users.get(email);
    const candidate = await hashPassword(password, user?.salt ?? DUMMY_SALT);
    const passwordMatches = timingSafeEqual(
        candidate,
        user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !passwordMatches) {
        // Same message for "no such user" and "wrong password"
        throw new UnauthorizedError('Invalid email or password');
    }

    return {
        token: `fake-${randomUUID()}`,
        user: { id: user.id, email: user.email, name: user.name },
    };
};
