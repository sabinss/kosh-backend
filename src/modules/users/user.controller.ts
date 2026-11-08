import type { Request, Response } from 'express';
import ApiResponse from '../../common/responses/api-response';
import { BadRequestError } from '../../errors/bad-request-error';

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Resolves the service from this request's scope, calls it, and sends the response.
export const getUser = async (req: Request<{ id: string }>, res: Response) => {
    // Reject malformed ids before they reach Postgres (which would return a 500)
    if (!UUID_PATTERN.test(req.params.id)) {
        throw new BadRequestError('Invalid user id');
    }

    const userService = req.scope.resolve('userService');
    const user = await userService.getById(req.params.id);
    return ApiResponse.ok(res, 'User fetched', user);
};
