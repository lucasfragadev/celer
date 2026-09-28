import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth-middleware';
import { RubricaService } from '../services/rubrica-service';
import { ApiResponse, Rubrica } from '../domain/entities';

export class RubricaController {
  static async list(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new RubricaService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'X-Tenant-Id header é obrigatório' });
      return;
    }

    const lista = await service.list(tenantId);
    res.status(200).json({ success: true, data: lista } as ApiResponse<Rubrica[]>);
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new RubricaService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'X-Tenant-Id header é obrigatório' });
      return;
    }

    const rub = await service.getById(tenantId, req.params.id);
    res.status(200).json({ success: true, data: rub } as ApiResponse<Rubrica>);
  }

  static async create(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new RubricaService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'X-Tenant-Id header é obrigatório' });
      return;
    }

    const criada = await service.create(tenantId, req.body);
    res.status(201).json({ success: true, data: criada } as ApiResponse<Rubrica>);
  }

  static async update(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new RubricaService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'X-Tenant-Id header é obrigatório' });
      return;
    }

    const atualizada = await service.updateByCodigo(tenantId, req.params.id, req.body);
    res.status(200).json({ success: true, data: atualizada } as ApiResponse<Rubrica>);
  }

  static async delete(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new RubricaService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'X-Tenant-Id header é obrigatório' });
      return;
    }

    await service.deleteByCodigo(tenantId, req.params.id);
    res.status(200).json({ success: true, data: null } as ApiResponse<null>);
  }
}
