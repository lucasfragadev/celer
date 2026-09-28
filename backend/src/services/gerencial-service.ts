import { PoolClient } from 'pg';
import { GerencialRepository } from '../repositories/gerencial-repository';
import { Gerencial, ContaGerencial } from '../domain/entities';

export class GerencialError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'GerencialError';
  }
}

export class GerencialService {
  private repository: GerencialRepository;

  constructor(client: PoolClient) {
    this.repository = new GerencialRepository(client);
  }

  async listPlanos(tenantId: string): Promise<Gerencial[]> {
    return await this.repository.findAllPlanos(tenantId);
  }

  async getPlano(tenantId: string, ordem: number): Promise<Gerencial> {
    const plano = await this.repository.findPlanoByOrdem(tenantId, ordem);
    if (!plano) throw new GerencialError(404, `Plano Gerencial G${ordem} não encontrado ou não configurado.`);
    return plano;
  }

  async listContas(tenantId: string, ordem: number): Promise<ContaGerencial[]> {
    await this.getPlano(tenantId, ordem); // Garante que o plano existe
    return await this.repository.findContasByOrdem(tenantId, ordem);
  }

  async createConta(tenantId: string, ordem: number, data: Omit<ContaGerencial, 'id' | 'tenant_id' | 'gerencial_ordem'>): Promise<ContaGerencial> {
    await this.getPlano(tenantId, ordem); // Valida o plano
    
    const existente = await this.repository.findContaByCodigo(tenantId, ordem, data.codigo);
    if (existente) {
      throw new GerencialError(400, `Código já em uso no plano G${ordem}.`);
    }

    return await this.repository.createConta({ ...data, tenant_id: tenantId, gerencial_ordem: ordem });
  }

  async updateContaByCodigo(tenantId: string, ordem: number, codigo: string, data: Partial<Omit<ContaGerencial, 'id' | 'tenant_id' | 'gerencial_ordem'>>): Promise<ContaGerencial> {
    const conta = await this.repository.findContaByCodigo(tenantId, ordem, codigo);
    if (!conta) {
      throw new GerencialError(404, 'Conta gerencial não encontrada neste plano.');
    }

    if (data.codigo && data.codigo !== codigo) {
      const existente = await this.repository.findContaByCodigo(tenantId, ordem, data.codigo);
      if (existente) throw new GerencialError(400, 'O novo código já está em uso.');
    }

    const atualizada = await this.repository.updateConta(conta.id, data);
    if (!atualizada) throw new GerencialError(500, 'Erro ao atualizar conta.');
    return atualizada;
  }

  async deleteContaByCodigo(tenantId: string, ordem: number, codigo: string): Promise<void> {
    const conta = await this.repository.findContaByCodigo(tenantId, ordem, codigo);
    if (!conta) {
      throw new GerencialError(404, 'Conta gerencial não encontrada.');
    }

    const sucesso = await this.repository.deleteConta(conta.id);
    if (!sucesso) throw new GerencialError(500, 'Erro ao deletar conta.');
  }
}
