import { Router } from 'express';
import { AdminController } from '../controllers/admin-controller';
import { authMiddleware, requireAdmin } from '../middlewares/auth-middleware';
import { transactionMiddleware } from '../middlewares/transaction-middleware';

const router = Router();
const adminController = new AdminController();

router.use(authMiddleware);
router.use(requireAdmin);

// Listar todos os tenants (clientes)
router.get('/tenants', transactionMiddleware, adminController.listTenants.bind(adminController));

// Criar um novo tenant com seu respectivo administrador
router.post('/tenants', transactionMiddleware, adminController.createTenant.bind(adminController));

export { router as adminRoutes };
