import { PoolClient } from 'pg';
import { Folha, Rateio, Pagamento } from '../domain/entities';

export class OperacoesRepository {
  constructor(private readonly client: PoolClient) {}

  // --- FOLHA ---
  async getFolha(tenantId: string, competenciaId: string): Promise<Folha | null> {
    const res = await this.client.query<Folha>(
      'SELECT * FROM folha WHERE tenant_id = $1 AND competencia_id = $2',
      [tenantId, competenciaId]
    );
    return res.rows[0] ?? null;
  }

  async upsertFolha(tenantId: string, competenciaId: string, payload: any): Promise<Folha> {
    const res = await this.client.query<Folha>(`
      INSERT INTO folha (tenant_id, competencia_id, payload)
      VALUES ($1, $2, $3)
      ON CONFLICT (competencia_id) DO UPDATE SET
        payload = EXCLUDED.payload,
        atualizado_em = now()
      RETURNING *;
    `, [tenantId, competenciaId, JSON.stringify(payload)]);
    return res.rows[0];
  }

  // --- RATEIOS ---
  async getRateios(tenantId: string, competenciaId: string): Promise<Rateio[]> {
    const res = await this.client.query<Rateio>(
      'SELECT * FROM rateios WHERE tenant_id = $1 AND competencia_id = $2 ORDER BY matricula ASC',
      [tenantId, competenciaId]
    );
    return res.rows;
  }

  async getRateioMatricula(tenantId: string, competenciaId: string, matricula: string): Promise<Rateio | null> {
    const res = await this.client.query<Rateio>(
      'SELECT * FROM rateios WHERE tenant_id = $1 AND competencia_id = $2 AND matricula = $3',
      [tenantId, competenciaId, matricula]
    );
    return res.rows[0] ?? null;
  }

  async upsertRateio(tenantId: string, competenciaId: string, matricula: string, payload: any): Promise<Rateio> {
    const res = await this.client.query<Rateio>(`
      INSERT INTO rateios (tenant_id, competencia_id, matricula, payload)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tenant_id, competencia_id, matricula) DO UPDATE SET
        payload = EXCLUDED.payload,
        versao = rateios.versao + 1
      RETURNING *;
    `, [tenantId, competenciaId, matricula, JSON.stringify(payload)]);
    return res.rows[0];
  }

  // --- BENEFICIOS MENSAIS ---
  async getBeneficios(tenantId: string, competenciaId: string): Promise<any[]> {
    const res = await this.client.query(
      'SELECT * FROM beneficios WHERE tenant_id = $1 AND competencia_id = $2',
      [tenantId, competenciaId]
    );
    return res.rows;
  }

  // --- PAGAMENTOS ---
  async getPagamentos(tenantId: string, competenciaId: string): Promise<Pagamento[]> {
    const res = await this.client.query<Pagamento>(
      'SELECT * FROM pagamentos WHERE tenant_id = $1 AND competencia_id = $2 ORDER BY data_pgto DESC',
      [tenantId, competenciaId]
    );
    return res.rows;
  }

  async createPagamento(tenantId: string, competenciaId: string, pag: Omit<Pagamento, 'id' | 'tenant_id' | 'competencia_id' | 'criado_em'>): Promise<Pagamento> {
    const res = await this.client.query<Pagamento>(`
      INSERT INTO pagamentos (tenant_id, competencia_id, obrigacao, pagador, data_pgto, valor)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `, [tenantId, competenciaId, pag.obrigacao, pag.pagador, pag.data_pgto, pag.valor]);
    return res.rows[0];
  }

  async deletePagamento(id: string): Promise<boolean> {
    const res = await this.client.query('DELETE FROM pagamentos WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
