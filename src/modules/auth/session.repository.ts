import { and, eq, gt, isNull } from 'drizzle-orm';
import type { Database } from '../../db';
import { sessions } from '../../db/schema/auth/session';
import { BaseRepository } from '../../common/repositories/base.repository';

// Only database queries live here. Rules about sessions live in SessionService.
export class SessionRepository extends BaseRepository<typeof sessions> {
    constructor({ db }: { db: Database }) {
        super(db, sessions);
    }

    // The session that currently owns this refresh token (if any).
    findByRefreshTokenHash(hash: string) {
        return this.findOne(eq(sessions.refreshTokenHash, hash));
    }

    // The session that USED to own this refresh token (reuse detection).
    findByPreviousRefreshTokenHash(hash: string) {
        return this.findOne(eq(sessions.previousRefreshTokenHash, hash));
    }

    // A session that works right now: belongs to this user, not revoked, not expired.
    async findActive(sessionId: string, userId: string) {
        const rows = await this.db
            .select()
            .from(sessions)
            .where(
                and(
                    eq(sessions.id, sessionId),
                    eq(sessions.userId, userId),
                    isNull(sessions.revokedAt),
                    gt(sessions.expiresAt, new Date()),
                ),
            )
            .limit(1);
        return rows[0];
    }

    // All sessions of one user that still work (the "my devices" list).
    listActiveForUser(userId: string) {
        return this.findMany(
            and(
                eq(sessions.userId, userId),
                isNull(sessions.revokedAt),
                gt(sessions.expiresAt, new Date()),
            ),
        );
    }

    // Logs the user out of every device at once.
    async revokeAllForUser(userId: string): Promise<void> {
        await this.db
            .update(sessions)
            .set({ revokedAt: new Date() })
            .where(
                and(eq(sessions.userId, userId), isNull(sessions.revokedAt)),
            );
    }
}
