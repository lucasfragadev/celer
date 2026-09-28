import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth-middleware';
import { BeneficioService } from '../services/beneficio-service';
import { ApiResponse, BeneficioCadastro, Beneficio } from '../domain/entities';

export class BeneficioController {
  
  // --- Cadastros (Tipos) ---
  static async listCadastros(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new BeneficioService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const dados = await service.listCadastros(tenantId);
    res.status(200).json({ success: true, data: dados } as ApiResponse<BeneficioCadastro[]>);
  }

  static async upsertCadastro(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new BeneficioService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const { codigo } = req.params;
    const { nome, conta_deb, conta_cred } = req.body;

    const salvo = await service.upsertCadastro(tenantId, codigo, nome, conta_deb, conta_cred);
    res.status(200).json({ success: true, data: salvo } as ApiResponse<BeneficioCadastro>);
  }

  static async deleteCadastro(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new BeneficioService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const { codigo } = req.params;
    await service.deleteCadastro(tenantId, codigo);
    res.status(200).json({ success: true, data: null } as ApiResponse<null>);
  }

  // --- Valores Mensais ---
  static async listMensal(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new BeneficioService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const dados = await service.getBeneficios(tenantId, req.params.competenciaId);
    res.status(200).json({ success: true, data: dados } as ApiResponse<Beneficio[]>);
  }

  static async getBeneficioMatricula(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new BeneficioService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const dados = await service.getBeneficio(tenantId, req.params.competenciaId, req.params.matricula);
    res.status(200).json({ success: true, data: dados } as ApiResponse<Beneficio | null>);
  }

  static async saveBeneficio(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const service = new BeneficioService(authReq.dbClient);
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'X-Tenant-Id obrigatório' }); return; }

    const salvo = await service.saveBeneficio(tenantId, req.params.competenciaId, req.params.matricula, req.body.payload);
    res.status(200).json({ success: true, data: salvo } as ApiResponse<Beneficio>);
  }
}
