import { Router } from 'express';
import { OperacoesController } from '../controllers/operacoes-controller';
import { transactionMiddleware } from '../middlewares/transaction-middleware';
import { authMiddleware } from '../middlewares/auth-middleware';

const operacoesRouter = Router({ mergeParams: true });

operacoesRouter.use(authMiddleware);
operacoesRouter.use(transactionMiddleware);

// --- FOLHA ---
operacoesRouter.get('/folha', OperacoesController.getFolha);
operacoesRouter.put('/folha', OperacoesController.saveFolha);

// --- RATEIOS ---
operacoesRouter.get('/rateios', OperacoesController.listRateios);
operacoesRouter.get('/rateios/:matricula', OperacoesController.getRateioMatricula);
operacoesRouter.put('/rateios/:matricula', OperacoesController.saveRateio);

// --- BENEFICIOS MENSAIS ---
operacoesRouter.get('/beneficios', OperacoesController.getBeneficios);

// --- PAGAMENTOS ---
operacoesRouter.get('/pagamentos', OperacoesController.listPagamentos);
operacoesRouter.post('/pagamentos', OperacoesController.addPagamento);
operacoesRouter.delete('/pagamentos/:pagamentoId', OperacoesController.removePagamento);

export { operacoesRouter };
