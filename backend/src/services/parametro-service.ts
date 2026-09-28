import { PoolClient } from 'pg';
import { ParametroRepository } from '../repositories/parametro-repository';
import { Parametro } from '../domain/entities';

export class ParametroService {
  private repository: ParametroRepository;

  constructor(client: PoolClient) {
    this.repository = new ParametroRepository(client);
  }

  async get(tenantId: string): Promise<Parametro> {
    let param = await this.repository.get(tenantId);
    if (!param) {
      // Se não existir na base, cria um padrão
      param = await this.repository.upsert(tenantId, {});
    }
    return param;
  }

  async update(tenantId: string, data: Partial<Omit<Parametro, 'tenant_id' | 'atualizado_em'>>): Promise<Parametro> {
    return await this.repository.upsert(tenantId, data);
  }
}
