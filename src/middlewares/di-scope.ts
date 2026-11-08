import type { AwilixContainer } from 'awilix';
import type { NextFunction, Request, Response } from 'express';
import { container, type Cradle } from '../container';

// Adds `req.scope` so handlers can resolve per-request objects: req.scope.resolve('userService')
declare global {
    // A namespace is the only way to add properties to Express's Request type
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            scope: AwilixContainer<Cradle>;
        }
    }
}

export const diScope = (req: Request, res: Response, next: NextFunction) => {
    req.scope = container.createScope();
    // Dispose the request's objects once the response has been sent
    res.on('finish', () => {
        void req.scope.dispose();
    });
    next();
};
