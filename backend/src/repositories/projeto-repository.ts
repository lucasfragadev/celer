import { PoolClient } from 'pg';
import { Projeto, ProjetoAnalitica } from '../domain/entities';

export class ProjetoRepository {
  constructor(private readonly client: PoolClient) {}

  // --- Projetos (Sintéticos) ---
  
  async findAllProjetos(tenantId: string): Promise<Projeto[]> {
    const res = await this.client.query<Projeto>(
      'SELECT * FROM projetos WHERE tenant_id = $1 ORDER BY codigo ASC',
      [tenantId]
    );
    return res.rows;
  }

  async findProjetoById(tenantId: string, id: string): Promise<Projeto | null> {
    const res = await this.client.query<Projeto>(
      'SELECT * FROM projetos WHERE tenant_id = $1 AND id = $2',
      [tenantId, id]
    );
    return res.rows[0] ?? null;
  }

  async findProjetoByCodigo(tenantId: string, codigo: string): Promise<Projeto | null> {
    const res = await this.client.query<Projeto>(
      'SELECT * FROM projetos WHERE tenant_id = $1 AND codigo = $2',
      [tenantId, codigo]
    );
    return res.rows[0] ?? null;
  }

  async createProjeto(projeto: Omit<Projeto, 'id'>): Promise<Projeto> {
    const { tenant_id, codigo, nome, vigencia_ate } = projeto;
    const res = await this.client.query<Projeto>(
      `INSERT INTO projetos (tenant_id, codigo, nome, vigencia_ate)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [tenant_id, codigo, nome, vigencia_ate]
    );
    return res.rows[0];
  }

  async updateProjeto(id: string, projeto: Partial<Omit<Projeto, 'id' | 'tenant_id'>>): Promise<Projeto | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(projeto)) {
      if (value !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) return null;
    values.push(id);
    const query = `UPDATE projetos SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await this.client.query<Projeto>(query, values);
    return res.rows[0] ?? null;
  }

  async deleteProjeto(id: string): Promise<boolean> {
    const res = await this.client.query('DELETE FROM projetos WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  // --- Analíticas ---

  async findAnaliticasByProjeto(tenantId: string, projetoId: string): Promise<ProjetoAnalitica[]> {
    const res = await this.client.query<ProjetoAnalitica>(
      'SELECT * FROM projeto_analiticas WHERE tenant_id = $1 AND projeto_id = $2 ORDER BY codigo ASC',
      [tenantId, projetoId]
    );
    return res.rows;
  }

  async findAnaliticaById(tenantId: string, id: string): Promise<ProjetoAnalitica | null> {
    const res = await this.client.query<ProjetoAnalitica>(
      'SELECT * FROM projeto_analiticas WHERE tenant_id = $1 AND id = $2',
      [tenantId, id]
    );
    return res.rows[0] ?? null;
  }

  async createAnalitica(analitica: Omit<ProjetoAnalitica, 'id'>): Promise<ProjetoAnalitica> {
    const { tenant_id, projeto_id, codigo, descricao } = analitica;
    const res = await this.client.query<ProjetoAnalitica>(
      `INSERT INTO projeto_analiticas (tenant_id, projeto_id, codigo, descricao)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [tenant_id, projeto_id, codigo, descricao]
    );
    return res.rows[0];
  }

  async deleteAnalitica(id: string): Promise<boolean> {
    const res = await this.client.query('DELETE FROM projeto_analiticas WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async updateAnalitica(id: string, analitica: Partial<Omit<ProjetoAnalitica, 'id' | 'tenant_id' | 'projeto_id'>>): Promise<ProjetoAnalitica | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(analitica)) {
      if (value !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) return null;
    values.push(id);
    const query = `UPDATE projeto_analiticas SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await this.client.query<ProjetoAnalitica>(query, values);
    return res.rows[0] ?? null;
  }
}
