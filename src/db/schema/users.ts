import { text, pgTable, varchar } from 'drizzle-orm/pg-core';
import { primaryId, timestamps } from './helpers';

export const users = pgTable('users', {
    id: primaryId(),
    name: varchar('name', { length: 50 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    // Store only the output of a password hash (never the plain password)
    passwordHash: text('password_hash').notNull(),
    ...timestamps,
});

// Row shape returned by SELECT, and the shape accepted by INSERT.
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
