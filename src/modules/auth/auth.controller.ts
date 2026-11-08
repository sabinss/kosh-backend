import type { Request, Response } from 'express';
import { Config } from '../../config';
import ApiResponse from '../../common/responses/api-response';
import { BadRequestError } from '../../errors/bad-request-error';
import { UnauthorizedError } from '../../errors/unauthorized-error';
import type { TokenOptions } from './token.service';
import type { AuthService } from './auth.service';
import type { DeviceInfo } from './session.service';

// Name of the cookie that holds the refresh token on web browsers.
const REFRESH_COOKIE = 'refreshToken';
// The cookie is only sent to paths under /auth (refresh, logout, ...).
// Other API calls never carry it, so it is sent as rarely as possible.
const COOKIE_PATH = '/auth';

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface LoginBody {
    email: string;
    password: string;
}

// Web and mobile clients get the refresh token differently (see deliverRefreshToken).
export class AuthController {
    private readonly authService: AuthService;
    private readonly tokenOptions: TokenOptions;

    // Awilix PROXY mode passes one object of named dependencies.
    constructor({
        authService,
        tokenOptions,
    }: {
        authService: AuthService;
        tokenOptions: TokenOptions;
    }) {
        this.authService = authService;
        this.tokenOptions = tokenOptions;
    }

    // ---- Helpers: small private steps the endpoints share -------------------

    // Mobile apps send the header "X-Client-Type: mobile". They can't rely on
    // browser cookies, so they keep the refresh token in the response body.
    private isMobile(req: Request): boolean {
        return req.header('x-client-type') === 'mobile';
    }

    // Device details recorded on the session, for the "my devices" list.
    private deviceInfo(req: Request): DeviceInfo {
        return {
            deviceName: req.header('x-device-name') ?? null,
            userAgent: req.get('user-agent') ?? null,
            ipAddress: req.ip ?? null,
        };
    }

    private cookieOptions() {
        return {
            httpOnly: true, // JavaScript on the page cannot read it (protects against XSS theft)
            secure: Config.NODE_ENV === 'production', // HTTPS only in production
            sameSite: 'strict' as const, // not sent on cross-site requests (protects against CSRF)
            path: COOKIE_PATH,
            maxAge: this.tokenOptions.refreshTokenTtlSeconds * 1000,
        };
    }

    // Web: put the token in a cookie. Mobile: return it in the body instead.
    private deliverRefreshToken(
        req: Request,
        res: Response,
        refreshToken: string,
    ): { refreshToken?: string } {
        if (this.isMobile(req)) {
            return { refreshToken };
        }
        res.cookie(REFRESH_COOKIE, refreshToken, this.cookieOptions());
        return {};
    }

    // The refresh token can come from the cookie (web) or the body (mobile).
    private readRefreshToken(req: Request): string | undefined {
        const fromCookie: unknown = req.cookies[REFRESH_COOKIE];
        if (typeof fromCookie === 'string' && fromCookie) {
            return fromCookie;
        }
        // req.body is typed as any, so check its shape before reading a field
        const body: unknown = req.body;
        if (body && typeof body === 'object' && 'refreshToken' in body) {
            const fromBody: unknown = body.refreshToken;
            if (typeof fromBody === 'string' && fromBody) {
                return fromBody;
            }
        }
        return undefined;
    }

    private clearRefreshCookie(res: Response) {
        res.clearCookie(REFRESH_COOKIE, { path: COOKIE_PATH });
    }

    // The logged-in user, set by authenticate. Missing means the route was not protected.
    private currentUser(req: Request): { id: string; sid: string } {
        if (!req.user) {
            throw new UnauthorizedError('Not authenticated');
        }
        return req.user;
    }

    // ---- Endpoints ----------------------------------------------------------

    // POST /auth/login. Runs only after validate(LoginDto), so the body is clean.
    async login(req: Request, res: Response) {
        const { email, password } = req.body as LoginBody;
        const result = await this.authService.login(
            email,
            password,
            this.deviceInfo(req),
        );

        const { refreshToken, ...rest } = result;
        const delivered = this.deliverRefreshToken(req, res, refreshToken);

        return ApiResponse.ok(res, 'Login successful', {
            ...rest,
            ...delivered,
        });
    }

    // POST /auth/refresh. Exchanges the refresh token for a new pair.
    async refresh(req: Request, res: Response) {
        const token = this.readRefreshToken(req);
        if (!token) {
            throw new UnauthorizedError('No refresh token provided');
        }

        const result = await this.authService.refresh(token);
        const delivered = this.deliverRefreshToken(
            req,
            res,
            result.refreshToken,
        );

        return ApiResponse.ok(res, 'Token refreshed', {
            accessToken: result.accessToken,
            ...delivered,
        });
    }

    // POST /auth/logout. Ends this device. Works with the refresh token,
    // so it still works after the access token has expired.
    async logout(req: Request, res: Response) {
        const token = this.readRefreshToken(req);
        if (token) {
            await this.authService.logout(token);
        }
        this.clearRefreshCookie(res);
        return ApiResponse.ok(res, 'Logged out', null);
    }

    // POST /auth/logout-all. Ends every device for the current user.
    async logoutAll(req: Request, res: Response) {
        const user = this.currentUser(req);
        await this.authService.logoutAll(user.id);
        this.clearRefreshCookie(res);
        return ApiResponse.ok(res, 'Logged out from all devices', null);
    }

    // GET /auth/sessions. The user's devices. Never includes the token hash.
    async listSessions(req: Request, res: Response) {
        const user = this.currentUser(req);
        const sessions = await this.authService.listSessions(user.id);

        const list = sessions.map((session) => ({
            id: session.id,
            deviceName: session.deviceName,
            ipAddress: session.ipAddress,
            lastUsedAt: session.lastUsedAt,
            createdAt: session.createdAt,
            // Lets the UI mark the device the user is using right now
            current: session.id === user.sid,
        }));

        return ApiResponse.ok(res, 'Sessions fetched', list);
    }

    // DELETE /auth/sessions/:id. Ends one device from the list.
    async revokeSession(req: Request<{ id: string }>, res: Response) {
        const user = this.currentUser(req);
        if (!UUID_PATTERN.test(req.params.id)) {
            throw new BadRequestError('Invalid session id');
        }
        await this.authService.revokeSession(user.id, req.params.id);
        return ApiResponse.ok(res, 'Session ended', null);
    }
}
