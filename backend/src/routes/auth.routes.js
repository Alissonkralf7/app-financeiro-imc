import { Router } from 'express';
import authController from '../controllers/auth.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

// Rotas públicas
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);

// Rotas protegidas
router.use(authMiddleware.verifyToken);
router.get('/me', authController.getMe);
router.post('/logout', authController.logout);
router.post('/alterar-senha', authController.alterarSenha);

export default router;
