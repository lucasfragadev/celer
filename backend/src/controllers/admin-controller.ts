import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth-middleware';
import { AdminService } from '../services/admin-service';

export class AdminController {
  async listTenants(req: AuthenticatedRequest, res: Response) {
    const adminService = new AdminService(req.dbClient);
    try {
      const tenants = await adminService.listTenants();
      return res.json({ success: true, data: tenants });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async createTenant(req: AuthenticatedRequest, res: Response) {
    const adminService = new AdminService(req.dbClient);
    const { nome, cnpj, email, senha, nomeUsuario } = req.body;

    if (!nome || !email || !senha || !nomeUsuario) {
      return res.status(400).json({ success: false, error: 'Dados incompletos para criar tenant e usuário' });
    }

    try {
      const result = await adminService.createTenantWithUser({ nome, cnpj, email, senha, nomeUsuario });
      return res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      if (err.message === 'E-mail já está em uso') {
        return res.status(409).json({ success: false, error: err.message });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
