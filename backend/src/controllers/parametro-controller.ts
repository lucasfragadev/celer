import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth-middleware';
import { ParametroService } from '../services/parametro-service';
import { ApiResponse, Parametro } from '../domain/entities';

export class ParametroController {
  static async get(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new ParametroService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const parametro = await service.get(tenantId);
    res.status(200).json({ success: true, data: parametro } as ApiResponse<Parametro>);
  }

  static async update(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new ParametroService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const atualizado = await service.update(tenantId, req.body);
    res.status(200).json({ success: true, data: atualizado } as ApiResponse<Parametro>);
  }
}
