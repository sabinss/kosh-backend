import {
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';
import { primaryId, timestamps } from '../helpers';
import { users } from './users';

// One row per login: a browser, a phone, or any other device.
// Revoking a row logs that device out.
export const sessions = pgTable(
    'sessions',
    {
        id: primaryId(),

        // Owner of the session. Deleting the user deletes their sessions.
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        // Hash of the current refresh token. Never store the raw token.
        refreshTokenHash: text('refresh_token_hash').notNull(),

        // Hash of the refresh token that was replaced by the current one.
        // If this old token is presented again, someone stole it: revoke the session.
        previousRefreshTokenHash: text('previous_refresh_token_hash'),

        // Shown in the session list, e.g. "Chrome on Windows" or "iPhone 15"
        deviceName: varchar('device_name', { length: 100 }),
        userAgent: text('user_agent'),
        ipAddress: varchar('ip_address', { length: 45 }), // long enough for IPv6

        // Updated on every refresh, for "last active" in the list
        lastUsedAt: timestamp('last_used_at', { withTimezone: true })
            .defaultNow()
            .notNull(),

        // Session stops being valid after this time
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

        // Set when the session is ended (logout, admin action, or reuse detected).
        // Null means the session is still active.
        revokedAt: timestamp('revoked_at', { withTimezone: true }),

        ...timestamps,
    },
    (table) => [
        // Look up all sessions of one user (session list, logout all)
        index('sessions_user_id_idx').on(table.userId),
        // Look up a session by its refresh token hash (refresh endpoint).
        // Unique, because one refresh token belongs to exactly one session.
        uniqueIndex('sessions_refresh_token_hash_idx').on(
            table.refreshTokenHash,
        ),
        // Look up a session by its previous hash (reuse detection)
        index('sessions_previous_refresh_token_hash_idx').on(
            table.previousRefreshTokenHash,
        ),
    ],
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
