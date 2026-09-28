import { PoolClient } from 'pg';
import { Competencia } from '../domain/entities';

export class CompetenciaRepository {
  constructor(private readonly client: PoolClient) {}

  async findAll(tenantId: string): Promise<Competencia[]> {
    const res = await this.client.query<Competencia>(
      'SELECT * FROM competencias WHERE tenant_id = $1 ORDER BY comp DESC, tipo_folha ASC',
      [tenantId]
    );
    return res.rows;
  }

  async findById(tenantId: string, id: string): Promise<Competencia | null> {
    const res = await this.client.query<Competencia>(
      'SELECT * FROM competencias WHERE tenant_id = $1 AND id = $2',
      [tenantId, id]
    );
    return res.rows[0] ?? null;
  }

  async findByCompEtipo(tenantId: string, comp: string, tipoFolha: string): Promise<Competencia | null> {
    const res = await this.client.query<Competencia>(
      'SELECT * FROM competencias WHERE tenant_id = $1 AND comp = $2 AND tipo_folha = $3',
      [tenantId, comp, tipoFolha]
    );
    return res.rows[0] ?? null;
  }

  async create(competencia: Omit<Competencia, 'id' | 'fechada_em' | 'versao'>): Promise<Competencia> {
    const { tenant_id, comp, tipo_folha, status } = competencia;
    const res = await this.client.query<Competencia>(
      `INSERT INTO competencias (tenant_id, comp, tipo_folha, status, versao)
       VALUES ($1, $2, $3, $4, 1) RETURNING *`,
      [tenant_id, comp, tipo_folha, status]
    );
    return res.rows[0];
  }

  async updateStatus(id: string, status: 'aberta' | 'fechada'): Promise<Competencia | null> {
    const query = status === 'fechada' 
      ? `UPDATE competencias SET status = 'fechada', fechada_em = now() WHERE id = $1 RETURNING *`
      : `UPDATE competencias SET status = 'aberta', fechada_em = null, versao = versao + 1 WHERE id = $1 RETURNING *`;
      
    const res = await this.client.query<Competencia>(query, [id]);
    return res.rows[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.client.query('DELETE FROM competencias WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
