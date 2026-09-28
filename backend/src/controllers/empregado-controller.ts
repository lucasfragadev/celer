import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth-middleware';
import { EmpregadoService } from '../services/empregado-service';
import { ApiResponse, Empregado } from '../domain/entities';

export class EmpregadoController {
  static async list(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new EmpregadoService(authReq.dbClient);
    // TODO: Recuperar o tenantId corretamente. Por enquanto vamos usar do header ou assumir o primeiro tenant
    // Idealmente, a aplicação frontend envia X-Tenant-Id, pois o user pode ter vários
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
       res.status(400).json({ success: false, error: 'X-Tenant-Id header é obrigatório' });
       return;
    }

    const lista = await service.list(tenantId);
    res.status(200).json({ success: true, data: lista } as ApiResponse<Empregado[]>);
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new EmpregadoService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'X-Tenant-Id header é obrigatório' });
      return;
    }

    const emp = await service.getById(tenantId, req.params.id);
    res.status(200).json({ success: true, data: emp } as ApiResponse<Empregado>);
  }

  static async create(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new EmpregadoService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'X-Tenant-Id header é obrigatório' });
      return;
    }

    const criado = await service.create(tenantId, req.body);
    res.status(201).json({ success: true, data: criado } as ApiResponse<Empregado>);
  }

  static async update(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new EmpregadoService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'X-Tenant-Id header é obrigatório' });
      return;
    }

    const atualizado = await service.updateByMatricula(tenantId, req.params.id, req.body);
    res.status(200).json({ success: true, data: atualizado } as ApiResponse<Empregado>);
  }

  static async delete(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new EmpregadoService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'X-Tenant-Id header é obrigatório' });
      return;
    }

    await service.deleteByMatricula(tenantId, req.params.id);
    res.status(200).json({ success: true, data: null } as ApiResponse<null>);
  }
}
