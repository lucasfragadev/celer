import { Router } from 'express';
import { ParametroController } from '../controllers/parametro-controller';
import { transactionMiddleware } from '../middlewares/transaction-middleware';
import { authMiddleware } from '../middlewares/auth-middleware';

const parametroRouter = Router();

parametroRouter.use(authMiddleware);
parametroRouter.use(transactionMiddleware);

parametroRouter.get('/', ParametroController.get);
parametroRouter.put('/', ParametroController.update);

export { parametroRouter };
