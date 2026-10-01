import { PoolClient } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRepository } from '../repositories/auth-repository';
import { LoginInput, LoginOutput, UsuarioPublico } from '../domain/entities';

/** Erros operacionais de autenticação — nunca expõem detalhes internos */
export class AuthError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * AuthService: toda a lógica de negócio de autenticação.
 * Depende do AuthRepository para acesso aos dados.
 * Princípio SRP: somente autenticação/autorização.
 */
export class AuthService {
  private readonly repository: AuthRepository;

  constructor(client: PoolClient) {
    this.repository = new AuthRepository(client);
  }

  /**
   * Realiza o login do usuário:
   * 1. Localiza o usuário pelo e-mail.
   * 2. Compara a senha com o hash armazenado.
   * 3. Busca os tenants que o usuário pode acessar.
   * 4. Gera e retorna um JWT assinado.
   */
  async login(input: LoginInput): Promise<LoginOutput> {
    const { email, senha } = input;

    const usuario = await this.repository.findUserByEmail(email);

    // Mensagem genérica — não revela se o e-mail existe ou não (segurança)
    if (!usuario) {
      throw new AuthError(401, 'E-mail ou senha inválidos.');
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaCorreta) {
      throw new AuthError(401, 'E-mail ou senha inválidos.');
    }

    const tenants = await this.repository.findTenantsByUserId(
      usuario.id,
      usuario.admin_global
    );

    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? '8h';

    if (!jwtSecret) {
      throw new Error('JWT_SECRET não configurado no ambiente.');
    }

    const token = jwt.sign(
      { sub: usuario.id, email: usuario.email, adminGlobal: usuario.admin_global },
      jwtSecret,
      { expiresIn: jwtExpiresIn } as jwt.SignOptions
    );

    const usuarioPublico: UsuarioPublico = {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      admin_global: usuario.admin_global,
      criado_em: usuario.criado_em,
    };

    return { token, usuario: usuarioPublico, tenants };
  }

  async session(userId: string): Promise<Omit<LoginOutput, 'token'>> {
    const usuario = await this.repository.findUserById(userId);
    if (!usuario) {
      throw new AuthError(401, 'Sessão inválida ou expirada.');
    }

    const tenants = await this.repository.findTenantsByUserId(
      usuario.id,
      usuario.admin_global
    );

    const usuarioPublico: UsuarioPublico = {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      admin_global: usuario.admin_global,
      criado_em: usuario.criado_em,
    };

    return { usuario: usuarioPublico, tenants };
  }
}
