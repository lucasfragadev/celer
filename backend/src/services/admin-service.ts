import { PoolClient } from 'pg';
import bcrypt from 'bcryptjs';

export class AdminService {
  constructor(private client: PoolClient) {}

  async listTenants() {
    const result = await this.client.query(`
      SELECT id, nome, cnpj, ativo, criado_em 
      FROM tenants 
      ORDER BY criado_em DESC
    `);
    return result.rows;
  }

  async createTenantWithUser(data: any) {
    const { nome, cnpj, email, senha, nomeUsuario } = data;

    // 1. Verificar se o e-mail já existe globalmente
    const userCheck = await this.client.query(`SELECT id FROM usuarios WHERE email = $1`, [email]);
    if (userCheck.rowCount && userCheck.rowCount > 0) {
      throw new Error('E-mail já está em uso');
    }

    // 2. Criar o Tenant
    const tenantRes = await this.client.query(
      `INSERT INTO tenants (nome, cnpj) VALUES ($1, $2) RETURNING id`,
      [nome, cnpj || null]
    );
    const tenantId = tenantRes.rows[0].id;

    // 3. Criar o Usuário
    const hash = await bcrypt.hash(senha, 10);
    const userRes = await this.client.query(
      `INSERT INTO usuarios (email, senha_hash, nome) VALUES ($1, $2, $3) RETURNING id`,
      [email, hash, nomeUsuario]
    );
    const userId = userRes.rows[0].id;

    // 4. Vincular o usuário ao Tenant como 'master'
    await this.client.query(
      `INSERT INTO memberships (user_id, tenant_id, papel) VALUES ($1, $2, 'master')`,
      [userId, tenantId]
    );

    return { tenantId, userId };
  }
}
