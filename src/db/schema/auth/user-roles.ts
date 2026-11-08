import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { roles } from './roles';
import { users } from './users';

// Junction table for the many-to-many link: a user can have many roles,
// and a role can belong to many users.
export const userRoles = pgTable(
    'user_roles',
    {
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        roleId: uuid('role_id')
            .notNull()
            .references(() => roles.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [primaryKey({ columns: [table.userId, table.roleId] })],
);

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
