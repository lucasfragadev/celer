import { Client } from 'pg';
import { BeneficioCadastro, Beneficio } from '../domain/entities';

export class BeneficioService {
  constructor(private db: Client) {}

  // --- Cadastro de Tipos de Benefícios (benCad) ---
  async listCadastros(tenantId: string): Promise<BeneficioCadastro[]> {
    const res = await this.db.query(
      `SELECT * FROM beneficio_cadastros WHERE tenant_id = $1 ORDER BY nome ASC`,
      [tenantId]
    );
    return res.rows;
  }

  async upsertCadastro(tenantId: string, codigo: string, nome: string, contaDeb: string, contaCred: string): Promise<BeneficioCadastro> {
    const res = await this.db.query(
      `INSERT INTO beneficio_cadastros (tenant_id, codigo, nome, conta_deb, conta_cred)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id, codigo) DO UPDATE SET 
         nome = EXCLUDED.nome, conta_deb = EXCLUDED.conta_deb, conta_cred = EXCLUDED.conta_cred
       RETURNING *`,
      [tenantId, codigo, nome, contaDeb, contaCred]
    );
    return res.rows[0];
  }

  async deleteCadastro(tenantId: string, codigo: string): Promise<void> {
    await this.db.query(
      `DELETE FROM beneficio_cadastros WHERE tenant_id = $1 AND codigo = $2`,
      [tenantId, codigo]
    );
  }

  // --- Benefícios Mensais ---
  async getBeneficios(tenantId: string, competenciaId: string): Promise<Beneficio[]> {
    const res = await this.db.query(
      `SELECT * FROM beneficios WHERE tenant_id = $1 AND competencia_id = $2`,
      [tenantId, competenciaId]
    );
    return res.rows;
  }

  async getBeneficio(tenantId: string, competenciaId: string, matricula: string): Promise<Beneficio | null> {
    const res = await this.db.query(
      `SELECT * FROM beneficios WHERE tenant_id = $1 AND competencia_id = $2 AND matricula = $3`,
      [tenantId, competenciaId, matricula]
    );
    return res.rows[0] || null;
  }

  async saveBeneficio(tenantId: string, competenciaId: string, matricula: string, payload: any): Promise<Beneficio> {
    const res = await this.db.query(
      `INSERT INTO beneficios (tenant_id, competencia_id, matricula, payload, versao)
       VALUES ($1, $2, $3, $4, 1)
       ON CONFLICT (tenant_id, competencia_id, matricula) DO UPDATE SET 
         payload = EXCLUDED.payload, 
         versao = beneficios.versao + 1,
         atualizado_em = NOW()
       RETURNING *`,
      [tenantId, competenciaId, matricula, payload]
    );
    return res.rows[0];
  }
}
