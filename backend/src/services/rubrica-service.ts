import { PoolClient } from 'pg';
import { RubricaRepository } from '../repositories/rubrica-repository';
import { Rubrica } from '../domain/entities';

export class RubricaError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'RubricaError';
  }
}

export class RubricaService {
  private repository: RubricaRepository;

  constructor(client: PoolClient) {
    this.repository = new RubricaRepository(client);
  }

  async list(tenantId: string): Promise<Rubrica[]> {
    return await this.repository.findAll(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<Rubrica> {
    const rub = await this.repository.findById(tenantId, id); // wait, repo needs findById
    if (!rub) throw new RubricaError(404, 'Rubrica não encontrada.');
    return rub;
  }

  async create(tenantId: string, data: Omit<Rubrica, 'id' | 'tenant_id'>): Promise<Rubrica> {
    const existente = await this.repository.findByCodigo(tenantId, data.codigo);
    if (existente) {
      throw new RubricaError(400, 'Já existe uma rubrica com este código.');
    }
    return await this.repository.create({ ...data, tenant_id: tenantId });
  }

  async updateByCodigo(tenantId: string, codigo: string, data: Partial<Omit<Rubrica, 'id' | 'tenant_id'>>): Promise<Rubrica> {
    const existente = await this.repository.findByCodigo(tenantId, codigo);
    if (!existente) throw new RubricaError(404, 'Rubrica não encontrada.');

    if (data.codigo && data.codigo !== codigo) {
      const conflito = await this.repository.findByCodigo(tenantId, data.codigo);
      if (conflito) {
        throw new RubricaError(400, 'O novo código já está em uso por outra rubrica.');
      }
    }

    const atualizada = await this.repository.update(existente.id, data);
    if (!atualizada) throw new RubricaError(500, 'Erro ao atualizar rubrica.');
    return atualizada;
  }

  async deleteByCodigo(tenantId: string, codigo: string): Promise<void> {
    const existente = await this.repository.findByCodigo(tenantId, codigo);
    if (!existente) throw new RubricaError(404, 'Rubrica não encontrada.');

    const sucesso = await this.repository.delete(existente.id);
    if (!sucesso) throw new RubricaError(500, 'Erro ao deletar rubrica.');
  }
}
