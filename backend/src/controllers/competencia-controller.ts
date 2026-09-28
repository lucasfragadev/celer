import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth-middleware';
import { CompetenciaService } from '../services/competencia-service';
import { ApiResponse, Competencia } from '../domain/entities';

export class CompetenciaController {
  static async list(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new CompetenciaService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const lista = await service.list(tenantId);
    res.status(200).json({ success: true, data: lista } as ApiResponse<Competencia[]>);
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new CompetenciaService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const comp = await service.getById(tenantId, req.params.id);
    res.status(200).json({ success: true, data: comp } as ApiResponse<Competencia>);
  }

  static async create(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new CompetenciaService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const criada = await service.create(tenantId, req.body);
    res.status(201).json({ success: true, data: criada } as ApiResponse<Competencia>);
  }

  static async updateStatus(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new CompetenciaService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const atualizada = await service.changeStatus(tenantId, req.params.id, req.body.status);
    res.status(200).json({ success: true, data: atualizada } as ApiResponse<Competencia>);
  }

  static async delete(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new CompetenciaService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    await service.delete(tenantId, req.params.id);
    res.status(200).json({ success: true, data: null } as ApiResponse<null>);
  }
}
