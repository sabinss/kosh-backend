import express, {
    type Request,
    type Response,
    type NextFunction,
} from 'express';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middlewares/error-handler';
import { diScope } from './middlewares/di-scope';
import { NotFoundError } from './errors/not-found-error';
import authRouter from './modules/auth/auth.routes';
import userRouter from './modules/users/user.routes';

const app = express();

// Parses JSON bodies; malformed JSON becomes a 400 handled by errorHandler
app.use(express.json());

// Parses the Cookie header into req.cookies (used for the refresh token)
app.use(cookieParser());

// Gives every request its own container scope (req.scope)
app.use(diScope);

app.get('/health', (req, res) => {
    res.send('Hello World');
});
app.use('/auth', authRouter);
app.use('/users', userRouter);

// Anything that reaches here matched no route
app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError());
});

// Must be registered last: every error ends up here
app.use(errorHandler);

export default app;
