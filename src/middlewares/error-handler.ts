import type { NextFunction, Request, Response } from 'express';
import { isHttpError } from 'http-errors';
import logger from '../config/logger';
import { CustomError, type SerializedError } from '../errors/custom-error';

export interface ErrorResponseBody {
    errors: SerializedError[];
}

const GENERIC_MESSAGE = 'Something went wrong';

interface NormalizedError {
    status: number;
    kind: string;
    errors: SerializedError[];
    message: string;
    stack?: string | undefined;
}

// Turns any thrown value into { status, errors } - the only shape clients see.
const normalize = (err: unknown): NormalizedError => {
    // 1. Errors we raised ourselves (validation, not found, conflict, ...)
    if (err instanceof CustomError) {
        return {
            status: err.statusCode,
            kind: err.constructor.name,
            errors: err.serializeErrors(),
            message: err.message,
            stack: err.stack,
        };
    }

    // 2. Errors from Express / body-parser (e.g. malformed JSON -> 400)
    if (isHttpError(err)) {
        return {
            status: err.status,
            kind: err.name,
            errors: [{ message: err.expose ? err.message : GENERIC_MESSAGE }],
            message: err.message,
            stack: err.stack,
        };
    }

    // 3. Anything else is an unexpected failure: never leak details
    const isError = err instanceof Error;
    return {
        status: 500,
        kind: isError ? err.name : 'NonErrorThrown',
        errors: [{ message: GENERIC_MESSAGE }],
        message: isError ? err.message : String(err),
        stack: isError ? err.stack : undefined,
    };
};

// Single place that decides what the client receives for any error.
export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response<ErrorResponseBody>,
    next: NextFunction,
) => {
    if (res.headersSent) {
        return next(err);
    }

    const { status, kind, errors, message, stack } = normalize(err);
    const line = `${req.method} ${req.originalUrl} -> ${status} ${kind}`;

    if (status >= 500) {
        logger.error(line, { message, stack });
    } else {
        logger.warn(line, { message });
    }

    return res.status(status).json({ errors });
};
