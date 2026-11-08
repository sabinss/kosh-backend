import { Router, type Request, type Response } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import validate from '../../middlewares/validate';
import LoginDto from './dto/login.dto';

const router = Router();

// Each handler resolves the controller from this request's scope, then calls the method.
// Public routes (no access token needed):
router.post('/login', validate(LoginDto), (req, res) =>
    req.scope.resolve('authController').login(req, res),
);
router.post('/refresh', (req, res) =>
    req.scope.resolve('authController').refresh(req, res),
);
router.post('/logout', (req, res) =>
    req.scope.resolve('authController').logout(req, res),
);

// Protected routes: authenticate runs first and must pass.
router.post('/logout-all', authenticate, (req, res) =>
    req.scope.resolve('authController').logoutAll(req, res),
);
router.get('/sessions', authenticate, (req, res) =>
    req.scope.resolve('authController').listSessions(req, res),
);
router.delete(
    '/sessions/:id',
    authenticate,
    (req: Request<{ id: string }>, res: Response) =>
        req.scope.resolve('authController').revokeSession(req, res),
);

export default router;
