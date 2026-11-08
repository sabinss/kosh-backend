import { createHash, randomBytes } from 'crypto';
import { jwtVerify, SignJWT, type JWTPayload } from 'jose';
import { UnauthorizedError } from '../../errors/unauthorized-error';

// Settings the token service needs. Registered as a value in container.ts.
export interface TokenOptions {
    // Signing key for access tokens. Comes from JWT_SECRET in .env.
    jwtSecret: string;
    // How long an access token lives, in seconds. 900 = 15 minutes.
    accessTokenTtlSeconds: number;
    // How long a refresh token (session) lives, in seconds. 604800 = 7 days.
    refreshTokenTtlSeconds: number;
}

// What goes inside an access token. Keep it minimal: no password, no personal data.
export interface AccessTokenPayload extends JWTPayload {
    // Standard JWT claim: the user's id
    sub: string;
    // Which session (device) this token belongs to. Lets us check revocation.
    sid: string;
    roles: string[];
}

// A refresh token has two halves: the client gets the raw token (in a cookie),
// and the database stores only the hash.
export interface RefreshTokenPair {
    token: string;
    tokenHash: string;
}

export class TokenService {
    private readonly options: TokenOptions;

    // Dependencies arrive from the container, by name.
    constructor({ tokenOptions }: { tokenOptions: TokenOptions }) {
        this.options = tokenOptions;
    }

    // jose wants the secret as bytes, not as a plain string.
    private get secretKey(): Uint8Array {
        return new TextEncoder().encode(this.options.jwtSecret);
    }

    // Creates a signed JWT. The signature is what stops anyone from editing it.
    async signAccessToken(payload: AccessTokenPayload): Promise<string> {
        const nowSeconds = Math.floor(Date.now() / 1000);
        return new SignJWT({ roles: payload.roles, sid: payload.sid })
            .setProtectedHeader({ alg: 'HS256' })
            .setSubject(payload.sub)
            .setIssuedAt(nowSeconds)
            .setExpirationTime(nowSeconds + this.options.accessTokenTtlSeconds)
            .sign(this.secretKey);
    }

    // Checks the signature and the expiry. Any failure becomes a 401.
    async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
        try {
            const { payload } = await jwtVerify(token, this.secretKey, {
                algorithms: ['HS256'],
            });
            if (
                typeof payload.sub !== 'string' ||
                typeof payload.sid !== 'string' ||
                !Array.isArray(payload.roles)
            ) {
                throw new UnauthorizedError('Invalid access token');
            }
            return {
                ...payload,
                sub: payload.sub,
                sid: payload.sid,
                roles: payload.roles as string[],
            };
        } catch {
            throw new UnauthorizedError('Invalid or expired access token');
        }
    }

    // A refresh token is just random bytes. It has no meaning on its own,
    // so it doesn't need to be a JWT: the database lookup is the check.
    generateRefreshToken(): RefreshTokenPair {
        const token = randomBytes(32).toString('base64url');
        return { token, tokenHash: this.hashRefreshToken(token) };
    }

    // One-way hash. Random 32-byte tokens are too unguessable to brute-force,
    // so a plain SHA-256 is enough (no salt or slow hash needed).
    hashRefreshToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }
}
