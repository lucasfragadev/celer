import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth-middleware';
import { HistoricoService } from '../services/historico-service';
import { ApiResponse, Historico } from '../domain/entities';

export class HistoricoController {
  static async list(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new HistoricoService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const dados = await service.list(tenantId);
    res.status(200).json({ success: true, data: dados } as ApiResponse<Historico[]>);
  }

  static async upsert(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new HistoricoService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const { codigo } = req.params;
    const { descricao } = req.body;

    const salvo = await service.upsert(tenantId, codigo, descricao);
    res.status(200).json({ success: true, data: salvo } as ApiResponse<Historico>);
  }

  static async delete(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new HistoricoService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const { codigo } = req.params;
    await service.delete(tenantId, codigo);
    res.status(200).json({ success: true, data: null } as ApiResponse<null>);
  }
}
