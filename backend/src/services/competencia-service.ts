import { PoolClient } from 'pg';
import { CompetenciaRepository } from '../repositories/competencia-repository';
import { Competencia } from '../domain/entities';

export class CompetenciaError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'CompetenciaError';
  }
}

export class CompetenciaService {
  private repository: CompetenciaRepository;

  constructor(client: PoolClient) {
    this.repository = new CompetenciaRepository(client);
  }

  async list(tenantId: string): Promise<Competencia[]> {
    return await this.repository.findAll(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<Competencia> {
    const comp = await this.repository.findById(tenantId, id);
    if (!comp) throw new CompetenciaError(404, 'Competência não encontrada.');
    return comp;
  }

  async create(tenantId: string, data: Omit<Competencia, 'id' | 'tenant_id' | 'fechada_em' | 'versao'>): Promise<Competencia> {
    // Validar formato AAAA/MM (ex: 2026/01)
    if (!/^\d{4}\/\d{2}$/.test(data.comp)) {
      throw new CompetenciaError(400, 'A competência deve estar no formato AAAA/MM.');
    }

    const existente = await this.repository.findByCompEtipo(tenantId, data.comp, data.tipo_folha);
    if (existente) {
      throw new CompetenciaError(400, 'Já existe uma competência com este período e tipo de folha.');
    }

    return await this.repository.create({ ...data, tenant_id: tenantId });
  }

  async changeStatus(tenantId: string, id: string, status: 'aberta' | 'fechada'): Promise<Competencia> {
    await this.getById(tenantId, id); // Garantir existencia
    const atualizada = await this.repository.updateStatus(id, status);
    if (!atualizada) throw new CompetenciaError(500, 'Erro ao atualizar status.');
    return atualizada;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const comp = await this.getById(tenantId, id);
    if (comp.status === 'fechada') {
      throw new CompetenciaError(400, 'Não é possível excluir uma competência fechada. Reabra primeiro.');
    }
    
    const sucesso = await this.repository.delete(id);
    if (!sucesso) throw new CompetenciaError(500, 'Erro ao deletar competência.');
  }
}
