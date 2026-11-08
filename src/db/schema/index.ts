// Barrel file: drizzle-kit reads this to find every table, and src/db/relations.ts
// passes it to defineRelations() so relational queries know about all tables.
//
// When you add a table, create src/db/schema/<table>.ts and add one line here.
export * from './auth/users';
export * from './auth/roles';
export * from './auth/user-roles';
export * from './auth/permissions';
export * from './auth/role-permissions';
export * from './auth/session';
