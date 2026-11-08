import type { NextFunction, Request, Response } from 'express';
import type { PermissionCode } from '../common/permissions/registry';
import { ForbiddenError } from '../errors/forbidden-error';
import { UnauthorizedError } from '../errors/unauthorized-error';

// Set by the authentication middleware once real login is in place.
// Until then, protected routes return 401.
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: { id: string };
        }
    }
}

/**
 * Route guard. Usage:
 *   router.post('/loans/:id/approve', requirePermission('loan:approve'), controller.approve);
 *
 * 401 = not logged in. 403 = logged in but the role lacks the permission.
 * Express 5 forwards errors thrown inside async middleware to errorHandler.
 */
export const requirePermission =
    (code: PermissionCode) =>
    async (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) {
            throw new UnauthorizedError();
        }

        const permissionService = req.scope.resolve('permissionService');
        const allowed = await permissionService.userHas(req.user.id, code);
        if (!allowed) {
            throw new ForbiddenError();
        }

        next();
    };
