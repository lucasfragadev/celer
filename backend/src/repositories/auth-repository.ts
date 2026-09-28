import { PoolClient } from 'pg';
import { Usuario, Tenant } from '../domain/entities';

/**
 * AuthRepository: responsável exclusivamente pelo acesso ao banco
 * para operações de autenticação. Segue o Repository Pattern —
 * nenhuma regra de negócio vive aqui.
 */
export class AuthRepository {
  constructor(private readonly client: PoolClient) {}

  /**
   * Busca um usuário pelo e-mail.
   * Retorna null se não encontrado (nunca lança exceção).
   */
  async findUserByEmail(email: string): Promise<Usuario | null> {
    const result = await this.client.query<Usuario>(
      'SELECT id, email, senha_hash, nome, admin_global, criado_em FROM usuarios WHERE email = $1',
      [email]
    );

    return result.rows[0] ?? null;
  }

  /**
   * Retorna os tenants (clientes) aos quais o usuário tem acesso.
   * Admin global vê todos. Demais usuários veem apenas os seus.
   */
  async findTenantsByUserId(
    userId: string,
    isAdminGlobal: boolean
  ): Promise<Pick<Tenant, 'id' | 'nome' | 'logo_url'>[]> {
    if (isAdminGlobal) {
      const result = await this.client.query<Pick<Tenant, 'id' | 'nome' | 'logo_url'>>(
        'SELECT id, nome, logo_url FROM tenants WHERE ativo = true ORDER BY nome'
      );
      return result.rows;
    }

    const result = await this.client.query<Pick<Tenant, 'id' | 'nome' | 'logo_url'>>(
      `SELECT t.id, t.nome, t.logo_url
       FROM tenants t
       INNER JOIN memberships m ON m.tenant_id = t.id
       WHERE m.user_id = $1 AND t.ativo = true
       ORDER BY t.nome`,
      [userId]
    );

    return result.rows;
  }
}
