import express, {
    type Request,
    type Response,
    type NextFunction,
} from 'express';
import { errorHandler } from './middlewares/error-handler';
import { NotFoundError } from './errors/not-found-error';
import authRouter from './modules/auth/auth.routes';

const app = express();

// Parses JSON bodies; malformed JSON becomes a 400 handled by errorHandler
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World');
});
app.use('/auth', authRouter);

// Anything that reaches here matched no route
app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError());
});

// Must be registered last: every error ends up here
app.use(errorHandler);

export default app;
