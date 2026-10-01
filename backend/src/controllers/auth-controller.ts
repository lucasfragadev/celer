import { Request, Response } from 'express';
import { AuthService, AuthError } from '../services/auth-service';
import { AuthenticatedRequest } from '../middlewares/auth-middleware';
import { LoginInput, ApiResponse, LoginOutput } from '../domain/entities';

/**
 * AuthController: recebe e responde requisições HTTP.
 * Delega toda lógica para o AuthService.
 * Princípio SRP: somente orquestração de entrada/saída HTTP.
 */
export class AuthController {
  /**
   * POST /api/auth/login
   * Body: { email: string, senha: string }
   */
  static async login(req: Request, res: Response): Promise<void> {
    const { email, senha } = req.body as LoginInput;

    if (!email || !senha) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'E-mail e senha são obrigatórios.',
      };
      res.status(400).json(response);
      return;
    }

    const authRequest = req as AuthenticatedRequest;
    const service = new AuthService(authRequest.dbClient);
    const result = await service.login({ email, senha });

    // Armazena o token em um cookie httpOnly (seguro contra XSS)
    res.cookie('celer_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000, // 8 horas em ms
    });

    const response: ApiResponse<LoginOutput> = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  }

  /**
   * POST /api/auth/logout
   * Apaga o cookie de sessão.
   */
  static logout(_req: Request, res: Response): void {
    res.clearCookie('celer_token');

    const response: ApiResponse<null> = {
      success: true,
      data: null,
    };

    res.status(200).json(response);
  static async session(req: Request, res: Response): Promise<void> {
    const authRequest = req as AuthenticatedRequest;
    if (!authRequest.userId) {
      res.status(401).json({ success: false, error: 'Não autorizado' });
      return;
    }
    const service = new AuthService(authRequest.dbClient);
    const result = await service.session(authRequest.userId);
    res.status(200).json({ success: true, data: result });
  }
}
