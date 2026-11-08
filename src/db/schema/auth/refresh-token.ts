import { pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { primaryId, timestamps } from '../helpers';
import { users } from './users';

export const refreshTokens = pgTable('refresh_tokens', {
    id: primaryId(),
    token: text('token').notNull(),
    userId: varchar('user_id', { length: 255 })
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    ...timestamps,
});

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
