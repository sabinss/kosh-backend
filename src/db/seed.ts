// Run with: npm run db:seed   (run it on every deploy, after db:migrate)
//
// 1. Syncs permissions and role grants from code (see src/common/permissions).
// 2. Creates the first super_admin user from SYSTEM_ADMIN_* env values.
//
// Safe to run more than once:
// - existing users keep their password (it is never overwritten)
// - existing grants are kept; missing ones are added
//
// Requires the migrations to be applied first (npm run db:migrate).

import { eq } from 'drizzle-orm';
import { Config } from '../config';
import logger from '../config/logger';
import { hashPassword } from '../common/password';
import { syncRbac } from '../common/permissions/sync';
import { SUPER_ADMIN_ROLE } from '../common/permissions/role-defaults';
import { db } from './index';
import { roles } from './schema/auth/roles';
import { userRoles } from './schema/auth/user-roles';
import { users } from './schema/auth/users';

const requireEnv = (value: string | undefined, key: string): string => {
    if (!value) {
        throw new Error(`${key} is not set. Add it to your .env file.`);
    }
    return value;
};

const seed = async (): Promise<void> => {
    const name = requireEnv(Config.SYSTEM_ADMIN_NAME, 'SYSTEM_ADMIN_NAME');
    const email = requireEnv(
        Config.SYSTEM_ADMIN_EMAIL,
        'SYSTEM_ADMIN_EMAIL',
    ).toLowerCase();
    const password = requireEnv(
        Config.SYSTEM_ADMIN_PASSWORD,
        'SYSTEM_ADMIN_PASSWORD',
    );

    // Hash once, up front, so the transaction only does database work.
    const passwordHash = await hashPassword(password);

    await db.transaction(async (tx) => {
        // 1. Permissions, roles and default grants from code
        await syncRbac(tx);

        const [role] = await tx
            .select()
            .from(roles)
            .where(eq(roles.name, SUPER_ADMIN_ROLE))
            .limit(1);
        if (!role) {
            throw new Error(`Role "${SUPER_ADMIN_ROLE}" was not found`);
        }

        // 2. The admin user. Existing emails are left alone (password not overwritten).
        await tx
            .insert(users)
            .values({ name, email, passwordHash })
            .onConflictDoNothing({ target: users.email });

        const [user] = await tx
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        if (!user) {
            throw new Error(`User "${email}" was not found after insert`);
        }

        // 3. Link the admin to the role
        await tx
            .insert(userRoles)
            .values({ userId: user.id, roleId: role.id })
            .onConflictDoNothing();

        logger.info(`Seed complete: ${email} is ${SUPER_ADMIN_ROLE}`);
    });
};

try {
    await seed();
} catch (error) {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
} finally {
    // Close the connection pool so the script exits.
    await db.$client.end();
}
