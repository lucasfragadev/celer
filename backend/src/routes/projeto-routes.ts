import { Router } from 'express';
import { ProjetoController } from '../controllers/projeto-controller';
import { transactionMiddleware } from '../middlewares/transaction-middleware';
import { authMiddleware } from '../middlewares/auth-middleware';

const projetoRouter = Router();

projetoRouter.use(authMiddleware);
projetoRouter.use(transactionMiddleware);

// Rotas de Projeto Sintético
projetoRouter.get('/', ProjetoController.list);
projetoRouter.get('/:id', ProjetoController.getById);
projetoRouter.post('/', ProjetoController.create);
projetoRouter.put('/:id', ProjetoController.update);
projetoRouter.delete('/:id', ProjetoController.delete);

// Rotas de Contas Analíticas
projetoRouter.get('/:id/analiticas', ProjetoController.listAnaliticas);
projetoRouter.post('/:id/analiticas', ProjetoController.createAnalitica);
projetoRouter.put('/:id/analiticas/:analiticaId', ProjetoController.updateAnalitica);
projetoRouter.delete('/:id/analiticas/:analiticaId', ProjetoController.deleteAnalitica);

export { projetoRouter };
