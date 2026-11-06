// import { defineRelations } from 'drizzle-orm';
// import * as schema from './schema';

// // Relations between tables, used by db.query.<table>.findMany({ with: ... }).
// //
// // Many-to-many (users <-> roles) goes through the user_roles junction table.
// // `.through(...)` says which junction column each side connects to.
// export const relations = defineRelations(schema, (r) => ({
//     users: {
//         roles: r.many.roles({
//             from: r.users.id.through(r.userRoles.userId),
//             to: r.roles.id.through(r.userRoles.roleId),
//         }),
//     },
//     // Inverse of users.roles. Drizzle copies from/to, including the junction.
//     roles: {
//         users: r.many.users(),
//     },
// }));
