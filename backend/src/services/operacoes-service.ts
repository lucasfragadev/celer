import { PoolClient } from 'pg';
import { OperacoesRepository } from '../repositories/operacoes-repository';
import { Folha, Rateio, Pagamento } from '../domain/entities';
import { CompetenciaService } from './competencia-service';

export class OperacoesError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'OperacoesError';
  }
}

export class OperacoesService {
  private repository: OperacoesRepository;
  private compService: CompetenciaService;

  constructor(client: PoolClient) {
    this.repository = new OperacoesRepository(client);
    this.compService = new CompetenciaService(client);
  }

  private async garantirCompetenciaAberta(tenantId: string, competenciaId: string) {
    const comp = await this.compService.getById(tenantId, competenciaId);
    if (comp.status === 'fechada') {
      throw new OperacoesError(400, 'Não é possível alterar dados de uma competência fechada.');
    }
  }

  // --- FOLHA ---
  async getFolha(tenantId: string, compId: string): Promise<Folha | null> {
    return await this.repository.getFolha(tenantId, compId);
  }

  async saveFolha(tenantId: string, compId: string, payload: any): Promise<Folha> {
    await this.garantirCompetenciaAberta(tenantId, compId);
    return await this.repository.upsertFolha(tenantId, compId, payload);
  }

  // --- RATEIOS ---
  async getRateios(tenantId: string, compId: string): Promise<Rateio[]> {
    return await this.repository.getRateios(tenantId, compId);
  }

  async getRateio(tenantId: string, compId: string, matricula: string): Promise<Rateio | null> {
    return await this.repository.getRateioMatricula(tenantId, compId, matricula);
  }

  async saveRateio(tenantId: string, compId: string, matricula: string, payload: any): Promise<Rateio> {
    await this.garantirCompetenciaAberta(tenantId, compId);
    return await this.repository.upsertRateio(tenantId, compId, matricula, payload);
  }

  // --- BENEFICIOS MENSAIS ---
  async getBeneficios(tenantId: string, compId: string): Promise<any[]> {
    return await this.repository.getBeneficios(tenantId, compId);
  }

  // --- PAGAMENTOS ---
  async getPagamentos(tenantId: string, compId: string): Promise<Pagamento[]> {
    return await this.repository.getPagamentos(tenantId, compId);
  }

  async addPagamento(tenantId: string, compId: string, data: Omit<Pagamento, 'id' | 'tenant_id' | 'competencia_id' | 'criado_em'>): Promise<Pagamento> {
    await this.garantirCompetenciaAberta(tenantId, compId);
    return await this.repository.createPagamento(tenantId, compId, data);
  }

  async removePagamento(tenantId: string, compId: string, pagamentoId: string): Promise<void> {
    await this.garantirCompetenciaAberta(tenantId, compId);
    const sucesso = await this.repository.deletePagamento(pagamentoId);
    if (!sucesso) throw new OperacoesError(500, 'Erro ao deletar pagamento.');
  }
}
