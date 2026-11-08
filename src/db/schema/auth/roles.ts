import { pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { primaryId, timestamps } from '../helpers';

export const roles = pgTable('roles', {
    id: primaryId(),
    // Machine-friendly name, e.g. "admin", "editor"
    name: varchar('name', { length: 50 }).notNull().unique(),
    description: text('description'),
    ...timestamps,
});

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
