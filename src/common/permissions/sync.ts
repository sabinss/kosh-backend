import { sql } from 'drizzle-orm';
import type { Database } from '../../db';
import { permissions } from '../../db/schema/permissions';
import { rolePermissions } from '../../db/schema/role-permissions';
import { roles } from '../../db/schema/roles';
import { PERMISSIONS } from './registry';
import { ROLE_DEFAULTS, type RoleName } from './role-defaults';

// Anything that can run queries: the shared db or a transaction.
type Executor = Pick<Database, 'select' | 'insert'>;

/**
 * Makes the database match the code's permission registry and role defaults.
 *
 * Safe to run on every deploy:
 * - new permissions are inserted; existing ones get their description refreshed
 * - missing roles are created; existing roles keep any description an admin set
 * - missing role grants are added; grants are never removed here
 *
 * Removing a permission from the code does NOT delete it from the database.
 * That is deliberate: deleting would silently revoke access. Do it in a
 * migration when you really mean it.
 */
export const syncRbac = async (db: Executor): Promise<void> => {
    const codes = PERMISSIONS.map((p) => p.code);
    if (new Set(codes).size !== codes.length) {
        throw new Error('Duplicate permission codes in registry.ts');
    }

    // 1. Permissions
    await db
        .insert(permissions)
        .values(
            PERMISSIONS.map((p) => ({
                code: p.code,
                feature: p.feature,
                description: p.description,
            })),
        )
        .onConflictDoUpdate({
            target: permissions.code,
            set: {
                feature: sql`excluded.feature`,
                description: sql`excluded.description`,
            },
        });

    // 2. Roles
    const roleNames = Object.keys(ROLE_DEFAULTS) as RoleName[];
    for (const name of roleNames) {
        await db
            .insert(roles)
            .values({ name, description: ROLE_DEFAULTS[name].description })
            .onConflictDoNothing({ target: roles.name });
    }

    // 3. Lookup tables: code -> id, role name -> id
    const permissionRows = await db
        .select({ id: permissions.id, code: permissions.code })
        .from(permissions);
    const permissionIdByCode = new Map(
        permissionRows.map((row) => [row.code, row.id]),
    );

    const roleRows = await db
        .select({ id: roles.id, name: roles.name })
        .from(roles);
    const roleIdByName = new Map(roleRows.map((row) => [row.name, row.id]));

    // 4. Grants
    for (const name of roleNames) {
        const roleId = roleIdByName.get(name);
        if (!roleId) {
            throw new Error(`Role "${name}" missing after insert`);
        }

        const grants = ROLE_DEFAULTS[name].permissions;
        const wanted: readonly string[] = grants === 'ALL' ? codes : grants;

        const rows = wanted.map((code) => {
            const permissionId = permissionIdByCode.get(code);
            if (!permissionId) {
                throw new Error(`Permission "${code}" missing after insert`);
            }
            return { roleId, permissionId };
        });

        if (rows.length > 0) {
            await db.insert(rolePermissions).values(rows).onConflictDoNothing();
        }
    }
};
