import { PoolClient } from 'pg';
import { EmpregadoRepository } from '../repositories/empregado-repository';
import { Empregado, SituacaoEmp } from '../domain/entities';

export class EmpregadoError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'EmpregadoError';
  }
}

export class EmpregadoService {
  private repository: EmpregadoRepository;

  constructor(client: PoolClient) {
    this.repository = new EmpregadoRepository(client);
  }

  async list(tenantId: string): Promise<Empregado[]> {
    return await this.repository.findAll(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<Empregado> {
    const emp = await this.repository.findById(tenantId, id);
    if (!emp) throw new EmpregadoError(404, 'Empregado não encontrado.');
    return emp;
  }

  async create(tenantId: string, data: Omit<Empregado, 'id' | 'tenant_id'>): Promise<Empregado> {
    const existente = await this.repository.findByMatricula(tenantId, data.matricula);
    if (existente) {
      throw new EmpregadoError(400, 'Já existe um empregado com esta matrícula.');
    }
    return await this.repository.create({ ...data, tenant_id: tenantId });
  }

  async updateByMatricula(tenantId: string, matricula: string, data: Partial<Omit<Empregado, 'id' | 'tenant_id'>>): Promise<Empregado> {
    const existente = await this.repository.findByMatricula(tenantId, matricula);
    if (!existente) throw new EmpregadoError(404, 'Empregado não encontrado.');

    if (data.matricula && data.matricula !== matricula) {
      const conflito = await this.repository.findByMatricula(tenantId, data.matricula);
      if (conflito) {
        throw new EmpregadoError(400, 'A nova matrícula já está em uso por outro empregado.');
      }
    }

    const atualizado = await this.repository.update(existente.id, data);
    if (!atualizado) throw new EmpregadoError(500, 'Erro ao atualizar empregado.');
    return atualizado;
  }

  async deleteByMatricula(tenantId: string, matricula: string): Promise<void> {
    const existente = await this.repository.findByMatricula(tenantId, matricula);
    if (!existente) throw new EmpregadoError(404, 'Empregado não encontrado.');

    const sucesso = await this.repository.delete(existente.id);
    if (!sucesso) throw new EmpregadoError(500, 'Erro ao deletar empregado.');
  }
}
