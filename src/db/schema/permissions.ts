import { pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { primaryId, timestamps } from './helpers';

// Mirror of the code registry (src/common/permissions/registry.ts).
// Rows are created by `npm run db:seed`, not typed in by hand.
export const permissions = pgTable('permissions', {
    id: primaryId(),
    // e.g. "loan:approve"
    code: varchar('code', { length: 100 }).notNull().unique(),
    // e.g. "loan", so admins can group permissions by feature
    feature: varchar('feature', { length: 50 }).notNull(),
    description: text('description'),
    ...timestamps,
});

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
