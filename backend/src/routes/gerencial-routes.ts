import { Router } from 'express';
import { GerencialController } from '../controllers/gerencial-controller';
import { transactionMiddleware } from '../middlewares/transaction-middleware';
import { authMiddleware } from '../middlewares/auth-middleware';

const gerencialRouter = Router();

gerencialRouter.use(authMiddleware);
gerencialRouter.use(transactionMiddleware);

// Retorna todos os planos gerenciais (G1, G2...) para este tenant
gerencialRouter.get('/', GerencialController.listPlanos);

// Rotas para gerenciar as Contas de um plano específico (ex: /api/gerenciais/1/contas para as contas do G1)
gerencialRouter.get('/:ordem/contas', GerencialController.listContas);
gerencialRouter.post('/:ordem/contas', GerencialController.createConta);
gerencialRouter.put('/:ordem/contas/:contaId', GerencialController.updateConta);
gerencialRouter.delete('/:ordem/contas/:contaId', GerencialController.deleteConta);

export { gerencialRouter };
