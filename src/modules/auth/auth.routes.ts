import { Router } from 'express';
import validate from '../../middlewares/validate';
import * as authController from './auth.controller';
import LoginDto from './dto/login.dto';

const router = Router();

// Request flow: validate(LoginDto) -> authController.login -> authService.login
router.post('/login', validate(LoginDto), authController.login);

export default router;
