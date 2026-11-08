import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/unauthorized-error';

// Checks the access token on a request, then sets req.user.
// Usage: router.get('/sessions', authenticate, controller.listSessions);
//
// Two checks, in order:
//   1. The token is genuine and not expired (signature check, no database).
//   2. The session it belongs to is still active (one indexed database lookup).
// Check 2 is what makes "logout all devices" take effect immediately.
export const authenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction,
) => {
    // Expected header: "Authorization: Bearer <token>"
    const [scheme, token] = (req.header('authorization') ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
        throw new UnauthorizedError('Missing access token');
    }

    const payload = await req.scope
        .resolve('tokenService')
        .verifyAccessToken(token);

    const session = await req.scope
        .resolve('sessionService')
        .findActive(payload.sid, payload.sub);
    if (!session) {
        throw new UnauthorizedError('Session has ended. Please log in again.');
    }

    req.user = { id: payload.sub, sid: payload.sid };
    next();
};
