import { Router } from 'express';
import { CompetenciaController } from '../controllers/competencia-controller';
import { transactionMiddleware } from '../middlewares/transaction-middleware';
import { authMiddleware } from '../middlewares/auth-middleware';

import { operacoesRouter } from './operacoes-routes';

const competenciaRouter = Router();

competenciaRouter.use(authMiddleware);
competenciaRouter.use(transactionMiddleware);

competenciaRouter.get('/', CompetenciaController.list);
competenciaRouter.get('/:id', CompetenciaController.getById);
competenciaRouter.post('/', CompetenciaController.create);
competenciaRouter.patch('/:id/status', CompetenciaController.updateStatus);
competenciaRouter.delete('/:id', CompetenciaController.delete);

// Rotas aninhadas de transações mensais
competenciaRouter.use('/:competenciaId', operacoesRouter);

export { competenciaRouter };
