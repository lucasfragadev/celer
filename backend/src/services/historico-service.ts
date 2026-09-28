import { Client } from 'pg';
import { Historico } from '../domain/entities';

export class HistoricoService {
  constructor(private db: Client) {}

  async list(tenantId: string): Promise<Historico[]> {
    const res = await this.db.query(
      `SELECT * FROM historicos WHERE tenant_id = $1 ORDER BY codigo ASC`,
      [tenantId]
    );
    return res.rows;
  }

  async getByCodigo(tenantId: string, codigo: string): Promise<Historico | null> {
    const res = await this.db.query(
      `SELECT * FROM historicos WHERE tenant_id = $1 AND codigo = $2`,
      [tenantId, codigo]
    );
    return res.rows[0] || null;
  }

  async upsert(tenantId: string, codigo: string, descricao: string): Promise<Historico> {
    const res = await this.db.query(
      `INSERT INTO historicos (tenant_id, codigo, descricao)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id, codigo) DO UPDATE SET descricao = EXCLUDED.descricao
       RETURNING *`,
      [tenantId, codigo, descricao]
    );
    return res.rows[0];
  }

  async delete(tenantId: string, codigo: string): Promise<void> {
    await this.db.query(
      `DELETE FROM historicos WHERE tenant_id = $1 AND codigo = $2`,
      [tenantId, codigo]
    );
  }
}
