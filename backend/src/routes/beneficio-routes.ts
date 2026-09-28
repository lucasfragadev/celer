import { Router } from 'express';
import { BeneficioController } from '../controllers/beneficio-controller';
import { transactionMiddleware } from '../middlewares/transaction-middleware';
import { authMiddleware } from '../middlewares/auth-middleware';

const beneficioRouter = Router();

beneficioRouter.use(authMiddleware);
beneficioRouter.use(transactionMiddleware);

// Cadastros (Tipos de Benefício)
beneficioRouter.get('/cadastros', BeneficioController.listCadastros);
beneficioRouter.put('/cadastros/:codigo', BeneficioController.upsertCadastro);
beneficioRouter.delete('/cadastros/:codigo', BeneficioController.deleteCadastro);

export { beneficioRouter };
