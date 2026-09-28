import { Router } from 'express';
import { EmpregadoController } from '../controllers/empregado-controller';
import { transactionMiddleware } from '../middlewares/transaction-middleware';
import { authMiddleware } from '../middlewares/auth-middleware';

const empregadoRouter = Router();

// Todas as rotas de empregados exigem estar autenticado e rodar dentro de uma transação (para o RLS)
empregadoRouter.use(authMiddleware);
empregadoRouter.use(transactionMiddleware);

empregadoRouter.get('/', EmpregadoController.list);
empregadoRouter.get('/:id', EmpregadoController.getById);
empregadoRouter.post('/', EmpregadoController.create);
empregadoRouter.put('/:id', EmpregadoController.update);
empregadoRouter.delete('/:id', EmpregadoController.delete);

export { empregadoRouter };
