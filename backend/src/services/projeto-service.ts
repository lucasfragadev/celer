import { PoolClient } from 'pg';
import { ProjetoRepository } from '../repositories/projeto-repository';
import { Projeto, ProjetoAnalitica } from '../domain/entities';

export class ProjetoError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ProjetoError';
  }
}

export class ProjetoService {
  private repository: ProjetoRepository;

  constructor(client: PoolClient) {
    this.repository = new ProjetoRepository(client);
  }

  async listProjetos(tenantId: string): Promise<Projeto[]> {
    return await this.repository.findAllProjetos(tenantId);
  }

  async getProjetoById(tenantId: string, id: string): Promise<Projeto> {
    const projeto = await this.repository.findProjetoById(tenantId, id);
    if (!projeto) throw new ProjetoError(404, 'Projeto não encontrado.');
    return projeto;
  }

  async createProjeto(tenantId: string, data: Omit<Projeto, 'id' | 'tenant_id'>): Promise<Projeto> {
    const existente = await this.repository.findProjetoByCodigo(tenantId, data.codigo);
    if (existente) {
      throw new ProjetoError(400, 'Já existe um projeto com este código.');
    }
    return await this.repository.createProjeto({ ...data, tenant_id: tenantId });
  }

  async updateProjetoByCodigo(tenantId: string, codigo: string, data: Partial<Omit<Projeto, 'id' | 'tenant_id'>>): Promise<Projeto> {
    const existente = await this.repository.findProjetoByCodigo(tenantId, codigo);
    if (!existente) throw new ProjetoError(404, 'Projeto não encontrado.');

    if (data.codigo && data.codigo !== codigo) {
      const conflito = await this.repository.findProjetoByCodigo(tenantId, data.codigo);
      if (conflito) {
        throw new ProjetoError(400, 'O novo código já está em uso por outro projeto.');
      }
    }

    const atualizado = await this.repository.updateProjeto(existente.id, data);
    if (!atualizado) throw new ProjetoError(500, 'Erro ao atualizar projeto.');
    return atualizado;
  }

  async deleteProjetoByCodigo(tenantId: string, codigo: string): Promise<void> {
    const existente = await this.repository.findProjetoByCodigo(tenantId, codigo);
    if (!existente) throw new ProjetoError(404, 'Projeto não encontrado.');

    const sucesso = await this.repository.deleteProjeto(existente.id);
    if (!sucesso) throw new ProjetoError(500, 'Erro ao deletar projeto.');
  }

  // --- Analíticas ---

  async listAnaliticas(tenantId: string, projetoCodigo: string): Promise<ProjetoAnalitica[]> {
    const projeto = await this.repository.findProjetoByCodigo(tenantId, projetoCodigo);
    if (!projeto) throw new ProjetoError(404, 'Projeto não encontrado.');
    return await this.repository.findAnaliticasByProjeto(tenantId, projeto.id);
  }

  async createAnalitica(tenantId: string, projetoCodigo: string, data: Omit<ProjetoAnalitica, 'id' | 'tenant_id' | 'projeto_id'>): Promise<ProjetoAnalitica> {
    const projeto = await this.repository.findProjetoByCodigo(tenantId, projetoCodigo);
    if (!projeto) throw new ProjetoError(404, 'Projeto não encontrado.');
    // TODO: checar se já existe analítica com esse código para esse projeto
    return await this.repository.createAnalitica({ ...data, tenant_id: tenantId, projeto_id: projeto.id });
  }

  async deleteAnaliticaByCodigo(tenantId: string, projetoCodigo: string, analiticaCodigo: string): Promise<void> {
    const projeto = await this.repository.findProjetoByCodigo(tenantId, projetoCodigo);
    if (!projeto) throw new ProjetoError(404, 'Projeto não encontrado.');

    const analiticas = await this.repository.findAnaliticasByProjeto(tenantId, projeto.id);
    const analitica = analiticas.find(a => a.codigo === analiticaCodigo);
    if (!analitica) throw new ProjetoError(404, 'Conta analítica não encontrada.');
    
    const sucesso = await this.repository.deleteAnalitica(analitica.id);
    if (!sucesso) throw new ProjetoError(500, 'Erro ao deletar analítica.');
  }

  async updateAnaliticaByCodigo(tenantId: string, projetoCodigo: string, analiticaCodigo: string, data: Partial<Omit<ProjetoAnalitica, 'id' | 'tenant_id' | 'projeto_id'>>): Promise<ProjetoAnalitica> {
    const projeto = await this.repository.findProjetoByCodigo(tenantId, projetoCodigo);
    if (!projeto) throw new ProjetoError(404, 'Projeto não encontrado.');

    const analiticas = await this.repository.findAnaliticasByProjeto(tenantId, projeto.id);
    const analitica = analiticas.find(a => a.codigo === analiticaCodigo);
    if (!analitica) throw new ProjetoError(404, 'Conta analítica não encontrada.');

    const atualizada = await this.repository.updateAnalitica(analitica.id, data);
    if (!atualizada) throw new ProjetoError(500, 'Erro ao atualizar analítica.');
    return atualizada;
  }
}
