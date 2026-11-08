import { Router } from 'express';
import * as userController from './user.controller';

const router = Router();

router.get('/:id', userController.getUser);

export default router;
