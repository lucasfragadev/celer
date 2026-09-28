import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth-middleware';
import { GerencialService } from '../services/gerencial-service';
import { ApiResponse, Gerencial, ContaGerencial } from '../domain/entities';

export class GerencialController {
  
  static async listPlanos(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new GerencialService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const lista = await service.listPlanos(tenantId);
    res.status(200).json({ success: true, data: lista } as ApiResponse<Gerencial[]>);
  }

  static async listContas(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new GerencialService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const ordem = parseInt(req.params.ordem, 10);
    const lista = await service.listContas(tenantId, ordem);
    res.status(200).json({ success: true, data: lista } as ApiResponse<ContaGerencial[]>);
  }

  static async createConta(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new GerencialService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const ordem = parseInt(req.params.ordem, 10);
    const criada = await service.createConta(tenantId, ordem, req.body);
    res.status(201).json({ success: true, data: criada } as ApiResponse<ContaGerencial>);
  }

  static async updateConta(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new GerencialService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const ordem = parseInt(req.params.ordem, 10);
    const atualizada = await service.updateContaByCodigo(tenantId, ordem, req.params.contaId, req.body);
    res.status(200).json({ success: true, data: atualizada } as ApiResponse<ContaGerencial>);
  }

  static async deleteConta(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new GerencialService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const ordem = parseInt(req.params.ordem, 10);
    await service.deleteContaByCodigo(tenantId, ordem, req.params.contaId);
    res.status(200).json({ success: true, data: null } as ApiResponse<null>);
  }
}
