import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller';
import { transactionMiddleware } from '../middlewares/transaction-middleware';

const authRouter = Router();

/**
 * Rotas de autenticação.
 * O transactionMiddleware abre a transação no banco e
 * injeta o client no req antes de chamar o controller.
 */
import { authMiddleware } from '../middlewares/auth-middleware';

authRouter.post('/login', transactionMiddleware, AuthController.login);
authRouter.get('/session', authMiddleware, transactionMiddleware, AuthController.session);
authRouter.post('/logout', AuthController.logout);

export { authRouter };
