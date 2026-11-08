import type { Session } from '../../db/schema/auth/session';
import { NotFoundError } from '../../errors/not-found-error';
import { UnauthorizedError } from '../../errors/unauthorized-error';
import type { SessionRepository } from './session.repository';
import type { TokenOptions, TokenService } from './token.service';

// What we record about the device at login. Shown in the "my devices" list.
export interface DeviceInfo {
    deviceName: string | null;
    userAgent: string | null;
    ipAddress: string | null;
}

// The rules for sessions. The repository only reads and writes rows.
export class SessionService {
    private readonly sessionRepository: SessionRepository;
    private readonly tokenService: TokenService;
    private readonly tokenOptions: TokenOptions;

    constructor({
        sessionRepository,
        tokenService,
        tokenOptions,
    }: {
        sessionRepository: SessionRepository;
        tokenService: TokenService;
        tokenOptions: TokenOptions;
    }) {
        this.sessionRepository = sessionRepository;
        this.tokenService = tokenService;
        this.tokenOptions = tokenOptions;
    }

    // Each refresh pushes the expiry forward ("sliding" expiry), so an active
    // user stays logged in. A user idle for longer than the TTL is logged out.
    private newExpiry(): Date {
        return new Date(
            Date.now() + this.tokenOptions.refreshTokenTtlSeconds * 1000,
        );
    }

    // LOGIN: a new device gets a new session.
    async createSession(
        userId: string,
        device: DeviceInfo,
    ): Promise<{ session: Session; refreshToken: string }> {
        const { token, tokenHash } = this.tokenService.generateRefreshToken();

        const session = await this.sessionRepository.create({
            userId,
            refreshTokenHash: tokenHash,
            deviceName: device.deviceName,
            userAgent: device.userAgent,
            ipAddress: device.ipAddress,
            expiresAt: this.newExpiry(),
        });

        // Only the raw token goes back to the client. The database has the hash.
        return { session, refreshToken: token };
    }

    // REFRESH: swap the old refresh token for a new one (rotation).
    async rotate(
        refreshToken: string,
    ): Promise<{ session: Session; refreshToken: string }> {
        const hash = this.tokenService.hashRefreshToken(refreshToken);

        const current =
            await this.sessionRepository.findByRefreshTokenHash(hash);
        if (!current) {
            // Not the current token. Was it an OLD token we already rotated?
            const reused =
                await this.sessionRepository.findByPreviousRefreshTokenHash(
                    hash,
                );
            if (reused) {
                // Someone has a copy of an old token. Kill the session so the
                // thief's copy and the real user's new token both stop working.
                await this.sessionRepository.updateById(reused.id, {
                    revokedAt: new Date(),
                });
                throw new UnauthorizedError(
                    'Refresh token reuse detected. Please log in again.',
                );
            }
            throw new UnauthorizedError('Invalid refresh token');
        }

        if (current.revokedAt || current.expiresAt <= new Date()) {
            throw new UnauthorizedError(
                'Session has ended. Please log in again.',
            );
        }

        // Rotate: the old hash moves to "previous" so reuse can be detected later.
        const next = this.tokenService.generateRefreshToken();
        const session = await this.sessionRepository.updateById(current.id, {
            previousRefreshTokenHash: current.refreshTokenHash,
            refreshTokenHash: next.tokenHash,
            lastUsedAt: new Date(),
            expiresAt: this.newExpiry(),
        });
        if (!session) {
            throw new UnauthorizedError('Session not found');
        }

        return { session, refreshToken: next.token };
    }

    // LOGOUT (this device): found by the refresh token, so it works even if
    // the access token has already expired. Missing tokens are not an error.
    async revokeByRefreshToken(refreshToken: string): Promise<void> {
        const hash = this.tokenService.hashRefreshToken(refreshToken);
        const session =
            await this.sessionRepository.findByRefreshTokenHash(hash);
        if (session) {
            await this.sessionRepository.updateById(session.id, {
                revokedAt: new Date(),
            });
        }
    }

    // LOGOUT (all devices): every session of this user ends at once.
    async revokeAllForUser(userId: string): Promise<void> {
        await this.sessionRepository.revokeAllForUser(userId);
    }

    // LOGOUT one device from the list. Only the owner can do it.
    async revokeOwned(userId: string, sessionId: string): Promise<void> {
        const session = await this.sessionRepository.findActive(
            sessionId,
            userId,
        );
        if (!session) {
            // Same answer for "not yours" and "does not exist": reveals nothing
            throw new NotFoundError('Session not found');
        }
        await this.sessionRepository.updateById(session.id, {
            revokedAt: new Date(),
        });
    }

    // The "my devices" list.
    listActive(userId: string): Promise<Session[]> {
        return this.sessionRepository.listActiveForUser(userId);
    }

    // Used on every authenticated request: is this session still allowed?
    findActive(
        sessionId: string,
        userId: string,
    ): Promise<Session | undefined> {
        return this.sessionRepository.findActive(sessionId, userId);
    }
}
