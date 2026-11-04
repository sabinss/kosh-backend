import type { Response } from 'express';

// Shape of every successful response that carries a body.
// Errors use a different shape: see src/middlewares/error-handler.ts.
export interface SuccessBody<T> {
    success: true;
    message: string;
    data: T | null;
}

class ApiResponse {
    static ok<T>(res: Response, message: string, data: T | null = null) {
        return ApiResponse.send(res, 200, message, data);
    }

    static created<T>(res: Response, message: string, data: T | null = null) {
        return ApiResponse.send(res, 201, message, data);
    }

    static noContent(res: Response) {
        return res.status(204).end();
    }

    private static send<T>(
        res: Response,
        status: number,
        message: string,
        data: T | null,
    ) {
        const body: SuccessBody<T> = { success: true, message, data };
        return res.status(status).json(body);
    }
}

export default ApiResponse;
