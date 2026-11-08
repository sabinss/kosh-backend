import { asClass, asValue, createContainer, InjectionMode } from 'awilix';
import { Config } from './config';
import { db, type Database } from './db';
import { UserRepository } from './modules/users/user.repository';
import { UserService } from './modules/users/user.service';
import { PermissionRepository } from './modules/permissions/permission.repository';
import { PermissionService } from './modules/permissions/permission.service';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';
import { SessionRepository } from './modules/auth/session.repository';
import { SessionService } from './modules/auth/session.service';
import { TokenService, type TokenOptions } from './modules/auth/token.service';
import logger from './config/logger';
import type { Logger } from 'winston';

// Fail at startup, not on the first login, if the signing key is missing.
if (!Config.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set. Add it to your .env file.');
}

// Everything that can be resolved, so container.resolve('userService') is typed.
export interface Cradle {
    db: Database;
    userRepository: UserRepository;
    userService: UserService;
    permissionRepository: PermissionRepository;
    permissionService: PermissionService;
    tokenOptions: TokenOptions;
    tokenService: TokenService;
    sessionRepository: SessionRepository;
    sessionService: SessionService;
    authService: AuthService;
    authController: AuthController;
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
    // Temporary: move these lifetimes into config later
    tokenOptions: asValue({
        jwtSecret: Config.JWT_SECRET,
        accessTokenTtlSeconds: 15 * 60, // 15 minutes
        refreshTokenTtlSeconds: 7 * 24 * 60 * 60, // 7 days
    }),
    // Stateless (no per-request data), so one shared instance is enough
    tokenService: asClass(TokenService).singleton(),
    // Talks to the database, so it's per request like the other repositories
    sessionRepository: asClass(SessionRepository).scoped(),
    sessionService: asClass(SessionService).scoped(),
    // Depends on scoped services, so it must be scoped too (a singleton can't use them)
    authService: asClass(AuthService).scoped(),
    authController: asClass(AuthController).scoped(),
    logger: asValue(logger),
});
