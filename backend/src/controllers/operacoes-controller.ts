import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth-middleware';
import { OperacoesService } from '../services/operacoes-service';
import { ApiResponse, Folha, Rateio, Pagamento } from '../domain/entities';

export class OperacoesController {
  
  // --- FOLHA ---
  static async getFolha(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new OperacoesService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const folha = await service.getFolha(tenantId, req.params.competenciaId);
    res.status(200).json({ success: true, data: folha } as ApiResponse<Folha | null>);
  }

  static async saveFolha(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new OperacoesService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const salva = await service.saveFolha(tenantId, req.params.competenciaId, req.body.payload);
    res.status(200).json({ success: true, data: salva } as ApiResponse<Folha>);
  }

  // --- RATEIOS ---
  static async listRateios(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new OperacoesService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const rateios = await service.getRateios(tenantId, req.params.competenciaId);
    res.status(200).json({ success: true, data: rateios } as ApiResponse<Rateio[]>);
  }

  static async getRateioMatricula(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new OperacoesService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const rateio = await service.getRateio(tenantId, req.params.competenciaId, req.params.matricula);
    res.status(200).json({ success: true, data: rateio } as ApiResponse<Rateio | null>);
  }

  static async saveRateio(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new OperacoesService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const salvo = await service.saveRateio(tenantId, req.params.competenciaId, req.params.matricula, req.body.payload);
    res.status(200).json({ success: true, data: salvo } as ApiResponse<Rateio>);
  }

  // --- BENEFICIOS MENSAIS ---
  static async getBeneficios(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new OperacoesService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatA3rio' }); return; }

    const beneficios = await service.getBeneficios(tenantId, req.params.competenciaId);
    res.status(200).json({ success: true, data: beneficios } as ApiResponse<any[]>);
  }

  // --- PAGAMENTOS ---
  static async listPagamentos(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new OperacoesService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const pags = await service.getPagamentos(tenantId, req.params.competenciaId);
    res.status(200).json({ success: true, data: pags } as ApiResponse<Pagamento[]>);
  }

  static async addPagamento(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new OperacoesService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const pag = await service.addPagamento(tenantId, req.params.competenciaId, req.body);
    res.status(201).json({ success: true, data: pag } as ApiResponse<Pagamento>);
  }

  static async removePagamento(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new OperacoesService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    await service.removePagamento(tenantId, req.params.competenciaId, req.params.pagamentoId);
    res.status(200).json({ success: true, data: null } as ApiResponse<null>);
  }
}
