import { PoolClient } from 'pg';
import { Rubrica } from '../domain/entities';

export class RubricaRepository {
  constructor(private readonly client: PoolClient) {}

  async findAll(tenantId: string): Promise<Rubrica[]> {
    const res = await this.client.query<Rubrica>(
      'SELECT * FROM rubricas WHERE tenant_id = $1 ORDER BY codigo ASC',
      [tenantId]
    );
    return res.rows;
  }

  async findByCodigo(tenantId: string, codigo: string): Promise<Rubrica | null> {
    const res = await this.client.query<Rubrica>(
      'SELECT * FROM rubricas WHERE tenant_id = $1 AND codigo = $2',
      [tenantId, codigo]
    );
    return res.rows[0] ?? null;
  }

  async findById(tenantId: string, id: string): Promise<Rubrica | null> {
    const res = await this.client.query<Rubrica>(
      'SELECT * FROM rubricas WHERE tenant_id = $1 AND id = $2',
      [tenantId, id]
    );
    return res.rows[0] ?? null;
  }

  async create(rubrica: Omit<Rubrica, 'id'>): Promise<Rubrica> {
    const { tenant_id, codigo, nome, conta_deb, conta_cred, historico, tipo } = rubrica;
    const res = await this.client.query<Rubrica>(
      `INSERT INTO rubricas (tenant_id, codigo, nome, conta_deb, conta_cred, historico, tipo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [tenant_id, codigo, nome, conta_deb, conta_cred, historico, tipo]
    );
    return res.rows[0];
  }

  async update(id: string, rubrica: Partial<Omit<Rubrica, 'id' | 'tenant_id'>>): Promise<Rubrica | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(rubrica)) {
      if (value !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE rubricas SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    
    const res = await this.client.query<Rubrica>(query, values);
    return res.rows[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.client.query(
      'DELETE FROM rubricas WHERE id = $1',
      [id]
    );
    return (res.rowCount ?? 0) > 0;
  }
}
