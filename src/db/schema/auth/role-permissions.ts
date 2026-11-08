import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { permissions } from './permissions';
import { roles } from './roles';

// Junction table: which permissions a role has. Changing this table is how
// an admin changes what a role can do, without a code change or redeploy.
export const rolePermissions = pgTable(
    'role_permissions',
    {
        roleId: uuid('role_id')
            .notNull()
            .references(() => roles.id, { onDelete: 'cascade' }),
        permissionId: uuid('permission_id')
            .notNull()
            .references(() => permissions.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
