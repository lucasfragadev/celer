import { Router } from 'express';
import { RubricaController } from '../controllers/rubrica-controller';
import { transactionMiddleware } from '../middlewares/transaction-middleware';
import { authMiddleware } from '../middlewares/auth-middleware';

const rubricaRouter = Router();

// Todas as rotas de rubricas exigem estar autenticado e rodar dentro de uma transação (para o RLS)
rubricaRouter.use(authMiddleware);
rubricaRouter.use(transactionMiddleware);

rubricaRouter.get('/', RubricaController.list);
rubricaRouter.get('/:id', RubricaController.getById);
rubricaRouter.post('/', RubricaController.create);
rubricaRouter.put('/:id', RubricaController.update);
rubricaRouter.delete('/:id', RubricaController.delete);

export { rubricaRouter };
