import { randomUUID } from 'crypto';
import { hashPassword, verifyPassword } from '../../common/password';
import { UnauthorizedError } from '../../errors/unauthorized-error';
import type { UserRepository } from '../users/user.repository';
import { toPublicUser } from '../users/user.service';
import type { DeviceInfo, SessionService } from './session.service';
import type { TokenService } from './token.service';
import { NotFoundError } from '../../errors/not-found-error';

// A real password hash of a random value, computed once when the app starts.
// For an unknown email we still run the same slow check, so an attacker
// can't tell from the response time whether an email has an account.
const dummyHashPromise = hashPassword(randomUUID());

export class AuthService {
    private readonly userRepository: UserRepository;
    private readonly sessionService: SessionService;
    private readonly tokenService: TokenService;

    constructor({
        userRepository,
        sessionService,
        tokenService,
    }: {
        userRepository: UserRepository;
        sessionService: SessionService;
        tokenService: TokenService;
    }) {
        this.userRepository = userRepository;
        this.sessionService = sessionService;
        this.tokenService = tokenService;
    }

    // Builds a new access token for a session. The roles are copied in for
    // display; permission checks always read the database.
    private async issueAccessToken(userId: string, sessionId: string) {
        const withRoles = await this.userRepository.findWithRoles(userId);
        if (!withRoles) {
            throw new UnauthorizedError('User no longer exists');
        }
        const accessToken = await this.tokenService.signAccessToken({
            sub: userId,
            sid: sessionId,
            roles: withRoles.roles.map((role) => role.name),
        });
        return { accessToken, user: toPublicUser(withRoles) };
    }

    // LOGIN
    async login(email: string, password: string, device: DeviceInfo) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Always run the password check, even when the user doesn't exist.
        const storedHash = user ? user.passwordHash : await dummyHashPromise;
        const passwordMatches = await verifyPassword(password, storedHash);

        if (!user || !passwordMatches) {
            // Same message for "no such email" and "wrong password"
            throw new UnauthorizedError('Invalid email or password');
        }

        // One login = one new session (one device).
        const { session, refreshToken } =
            await this.sessionService.createSession(user.id, device);
        const { accessToken, user: publicUser } = await this.issueAccessToken(
            user.id,
            session.id,
        );

        return { user: publicUser, accessToken, refreshToken };
    }

    // REFRESH: rotate the refresh token and issue a new access token.
    async refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }> {
        const rotated = await this.sessionService.rotate(refreshToken);
        const issued = await this.issueAccessToken(
            rotated.session.userId,
            rotated.session.id,
        );
        return {
            accessToken: issued.accessToken,
            refreshToken: rotated.refreshToken,
        };
    }

    // LOGOUT this device
    logout(refreshToken: string): Promise<void> {
        return this.sessionService.revokeByRefreshToken(refreshToken);
    }

    // LOGOUT all devices
    logoutAll(userId: string): Promise<void> {
        return this.sessionService.revokeAllForUser(userId);
    }

    // The "my devices" list
    listSessions(userId: string) {
        return this.sessionService.listActive(userId);
    }

    // LOGOUT one device from the list
    revokeSession(userId: string, sessionId: string): Promise<void> {
        return this.sessionService.revokeOwned(userId, sessionId);
    }
}
