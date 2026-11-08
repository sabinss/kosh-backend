import { asClass, asValue, createContainer, InjectionMode } from 'awilix';
import { db, type Database } from './db';
import { UserRepository } from './modules/users/user.repository';
import { UserService } from './modules/users/user.service';
import { PermissionRepository } from './modules/permissions/permission.repository';
import { PermissionService } from './modules/permissions/permission.service';
import logger from './config/logger';
import type { Logger } from 'winston';
// Everything that can be resolved, so container.resolve('userService') is typed.
export interface Cradle {
    db: Database;
    userRepository: UserRepository;
    userService: UserService;
    permissionRepository: PermissionRepository;
    permissionService: PermissionService;
    logger: Logger;
}

// The composition root: the only place that decides how objects are built.
export const container = createContainer<Cradle>({
    // Constructors receive one object with named dependencies
    injectionMode: InjectionMode.PROXY,
    // Unknown or missing registrations throw immediately
    strict: true,
});

container.register({
    // One shared database pool for the whole app
    db: asValue(db),
    // New instances per request; disposed when the request scope ends
    userRepository: asClass(UserRepository).scoped(),
    userService: asClass(UserService).scoped(),
    permissionRepository: asClass(PermissionRepository).scoped(),
    permissionService: asClass(PermissionService).scoped(),
    logger: asValue(logger),
});
