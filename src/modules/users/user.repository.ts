import { eq } from 'drizzle-orm';
import { db as defaultDb, type Database } from '../../db';
import { roles, type Role } from '../../db/schema/roles';
import { userRoles } from '../../db/schema/user-roles';
import { users, type NewUser, type User } from '../../db/schema/users';
import { BaseRepository } from '../../common/repositories/base.repository';

// A user together with the roles assigned to them.
export interface UserWithRoles extends User {
    roles: Role[];
}

export class UserRepository extends BaseRepository<typeof users> {
    // Defaults to the shared db. Pass a transaction to run inside one.
    constructor(db: Database = defaultDb) {
        super(db, users);
    }

    // ---- Table-specific queries built on the base methods -------------------

    // Users are looked up by lowercase email (the RegisterDto lowercases it).
    findByEmail(email: string): Promise<User | undefined> {
        return this.findOne(eq(users.email, email.toLowerCase()));
    }

    // ---- Custom queries that need more than the base methods ---------------

    // One user plus their roles. The user is joined to user_roles and roles;
    // a user with no roles still comes back, with roles: [].
    async findWithRoles(id: string): Promise<UserWithRoles | undefined> {
        const rows = await this.db
            .select({ user: users, role: roles })
            .from(users)
            .leftJoin(userRoles, eq(userRoles.userId, users.id))
            .leftJoin(roles, eq(roles.id, userRoles.roleId))
            .where(eq(users.id, id));

        const first = rows[0];
        if (!first) {
            return undefined;
        }

        // The join returns one row per role, so fold them back into one user.
        return {
            ...first.user,
            roles: rows.flatMap((row) => (row.role ? [row.role] : [])),
        };
    }

    // Example of a table-specific write: normalizes the email before inserting.
    // The caller must pass an already hashed password (passwordHash), never plain text.
    createUser(data: NewUser): Promise<User> {
        return this.create({ ...data, email: data.email.toLowerCase() });
    }
}
