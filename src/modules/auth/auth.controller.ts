import type { Request, Response } from 'express';
import ApiResponse from '../../common/responses/api-response';
import * as authService from './auth.service';

interface LoginBody {
    email: string;
    password: string;
}

// Runs only after validate(LoginDto) has passed, so the body is clean.
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body as LoginBody;
    const result = await authService.login(email, password);
    return ApiResponse.ok(res, 'Login successful', result);
};
