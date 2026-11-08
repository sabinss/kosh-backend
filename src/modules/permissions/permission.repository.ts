import { eq } from 'drizzle-orm';
import type { Database } from '../../db';
import { permissions } from '../../db/schema/permissions';
import { rolePermissions } from '../../db/schema/role-permissions';
import { userRoles } from '../../db/schema/user-roles';
import { BaseRepository } from '../../common/repositories/base.repository';

export class PermissionRepository extends BaseRepository<typeof permissions> {
    constructor({ db }: { db: Database }) {
        super(db, permissions);
    }

    // Every permission code the user has, through any of their roles.
    // Distinct, because two roles can grant the same permission.
    async findCodesForUser(userId: string): Promise<string[]> {
        const rows = await this.db
            .selectDistinct({ code: permissions.code })
            .from(userRoles)
            .innerJoin(
                rolePermissions,
                eq(rolePermissions.roleId, userRoles.roleId),
            )
            .innerJoin(
                permissions,
                eq(permissions.id, rolePermissions.permissionId),
            )
            .where(eq(userRoles.userId, userId));

        return rows.map((row) => row.code);
    }
}
