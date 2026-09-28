import { PoolClient } from 'pg';
import { Gerencial, ContaGerencial } from '../domain/entities';

export class GerencialRepository {
  constructor(private readonly client: PoolClient) {}

  // --- Planos Gerenciais (Definições: G1 a G6) ---
  async findAllPlanos(tenantId: string): Promise<Gerencial[]> {
    const res = await this.client.query<Gerencial>(
      'SELECT * FROM gerenciais WHERE tenant_id = $1 ORDER BY ordem ASC',
      [tenantId]
    );
    return res.rows;
  }

  async findPlanoByOrdem(tenantId: string, ordem: number): Promise<Gerencial | null> {
    const res = await this.client.query<Gerencial>(
      'SELECT * FROM gerenciais WHERE tenant_id = $1 AND ordem = $2',
      [tenantId, ordem]
    );
    return res.rows[0] ?? null;
  }

  // --- Contas Gerenciais (Os centros de custo dentro de cada G) ---
  async findContasByOrdem(tenantId: string, ordem: number): Promise<ContaGerencial[]> {
    const res = await this.client.query<ContaGerencial>(
      'SELECT * FROM contas_gerenciais WHERE tenant_id = $1 AND gerencial_ordem = $2 ORDER BY classificacao ASC, codigo ASC',
      [tenantId, ordem]
    );
    return res.rows;
  }

  async findContaById(tenantId: string, id: string): Promise<ContaGerencial | null> {
    const res = await this.client.query<ContaGerencial>(
      'SELECT * FROM contas_gerenciais WHERE tenant_id = $1 AND id = $2',
      [tenantId, id]
    );
    return res.rows[0] ?? null;
  }

  async findContaByCodigo(tenantId: string, ordem: number, codigo: string): Promise<ContaGerencial | null> {
    const res = await this.client.query<ContaGerencial>(
      'SELECT * FROM contas_gerenciais WHERE tenant_id = $1 AND gerencial_ordem = $2 AND codigo = $3',
      [tenantId, ordem, codigo]
    );
    return res.rows[0] ?? null;
  }

  async createConta(conta: Omit<ContaGerencial, 'id'>): Promise<ContaGerencial> {
    const { tenant_id, gerencial_ordem, codigo, nome, tipo, classificacao } = conta;
    const res = await this.client.query<ContaGerencial>(
      `INSERT INTO contas_gerenciais (tenant_id, gerencial_ordem, codigo, nome, tipo, classificacao)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenant_id, gerencial_ordem, codigo, nome, tipo, classificacao]
    );
    return res.rows[0];
  }

  async updateConta(id: string, conta: Partial<Omit<ContaGerencial, 'id' | 'tenant_id' | 'gerencial_ordem'>>): Promise<ContaGerencial | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(conta)) {
      if (value !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) return null;
    values.push(id);
    const query = `UPDATE contas_gerenciais SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    
    const res = await this.client.query<ContaGerencial>(query, values);
    return res.rows[0] ?? null;
  }

  async deleteConta(id: string): Promise<boolean> {
    const res = await this.client.query('DELETE FROM contas_gerenciais WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
