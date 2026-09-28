import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth-middleware';
import { ProjetoService } from '../services/projeto-service';
import { ApiResponse, Projeto, ProjetoAnalitica } from '../domain/entities';

export class ProjetoController {
  static async list(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new ProjetoService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id header é obrigatório' }); return; }

    const lista = await service.listProjetos(tenantId);
    res.status(200).json({ success: true, data: lista } as ApiResponse<Projeto[]>);
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new ProjetoService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const projeto = await service.getProjetoById(tenantId, req.params.id);
    res.status(200).json({ success: true, data: projeto } as ApiResponse<Projeto>);
  }

  static async create(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new ProjetoService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const criado = await service.createProjeto(tenantId, req.body);
    res.status(201).json({ success: true, data: criado } as ApiResponse<Projeto>);
  }

  static async update(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new ProjetoService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const atualizado = await service.updateProjetoByCodigo(tenantId, req.params.id, req.body);
    res.status(200).json({ success: true, data: atualizado } as ApiResponse<Projeto>);
  }

  static async delete(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new ProjetoService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    await service.deleteProjetoByCodigo(tenantId, req.params.id);
    res.status(200).json({ success: true, data: null } as ApiResponse<null>);
  }

  // --- Analíticas ---

  static async listAnaliticas(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new ProjetoService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const lista = await service.listAnaliticas(tenantId, req.params.id);
    res.status(200).json({ success: true, data: lista } as ApiResponse<ProjetoAnalitica[]>);
  }

  static async createAnalitica(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new ProjetoService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const criada = await service.createAnalitica(tenantId, req.params.id, req.body);
    res.status(201).json({ success: true, data: criada } as ApiResponse<ProjetoAnalitica>);
  }

  static async deleteAnalitica(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new ProjetoService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    await service.deleteAnaliticaByCodigo(tenantId, req.params.id, req.params.analiticaId);
    res.status(200).json({ success: true, data: null } as ApiResponse<null>);
  }

  static async updateAnalitica(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new ProjetoService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const atualizada = await service.updateAnaliticaByCodigo(tenantId, req.params.id, req.params.analiticaId, req.body);
    res.status(200).json({ success: true, data: atualizada } as ApiResponse<ProjetoAnalitica>);
  }
}
