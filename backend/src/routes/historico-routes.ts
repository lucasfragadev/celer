import { Router } from 'express';
import { HistoricoController } from '../controllers/historico-controller';
import { transactionMiddleware } from '../middlewares/transaction-middleware';
import { authMiddleware } from '../middlewares/auth-middleware';

const historicoRouter = Router();

historicoRouter.use(authMiddleware);
historicoRouter.use(transactionMiddleware);

historicoRouter.get('/', HistoricoController.list);
historicoRouter.put('/:codigo', HistoricoController.upsert);
historicoRouter.delete('/:codigo', HistoricoController.delete);

export { historicoRouter };
