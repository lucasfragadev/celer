import { PoolClient } from 'pg';
import { Empregado, SituacaoEmp } from '../domain/entities';

export class EmpregadoRepository {
  constructor(private readonly client: PoolClient) {}

  async findAll(tenantId: string): Promise<Empregado[]> {
    const res = await this.client.query<Empregado>(
      'SELECT * FROM empregados WHERE tenant_id = $1 ORDER BY nome ASC',
      [tenantId]
    );
    return res.rows;
  }

  async findById(tenantId: string, id: string): Promise<Empregado | null> {
    const res = await this.client.query<Empregado>(
      'SELECT * FROM empregados WHERE tenant_id = $1 AND id = $2',
      [tenantId, id]
    );
    return res.rows[0] ?? null;
  }

  async findByMatricula(tenantId: string, matricula: string): Promise<Empregado | null> {
    const res = await this.client.query<Empregado>(
      'SELECT * FROM empregados WHERE tenant_id = $1 AND matricula = $2',
      [tenantId, matricula]
    );
    return res.rows[0] ?? null;
  }

  async create(empregado: Omit<Empregado, 'id'>): Promise<Empregado> {
    const { tenant_id, matricula, nome, cargo, filial, situacao, conta_g2 } = empregado;
    const res = await this.client.query<Empregado>(
      `INSERT INTO empregados (tenant_id, matricula, nome, cargo, filial, situacao, conta_g2)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [tenant_id, matricula, nome, cargo, filial, situacao, conta_g2]
    );
    return res.rows[0];
  }

  async update(id: string, empregado: Partial<Omit<Empregado, 'id' | 'tenant_id'>>): Promise<Empregado | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(empregado)) {
      if (value !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE empregados SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    
    const res = await this.client.query<Empregado>(query, values);
    return res.rows[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.client.query(
      'DELETE FROM empregados WHERE id = $1',
      [id]
    );
    return (res.rowCount ?? 0) > 0;
  }
}
