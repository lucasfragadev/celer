import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { authRouter } from './routes/auth-routes';
import { empregadoRouter } from './routes/empregado-routes';
import { rubricaRouter } from './routes/rubrica-routes';
import { projetoRouter } from './routes/projeto-routes';
import { gerencialRouter } from './routes/gerencial-routes';
import { parametroRouter } from './routes/parametro-routes';
import { competenciaRouter } from './routes/competencia-routes';
import { historicoRouter } from './routes/historico-routes';
import { beneficioRouter } from './routes/beneficio-routes';
import { AuthError } from './services/auth-service';

const app = express();

app.use(cors({
  origin: true, // Permite qualquer origem (ou 'http://...' específico se preferir)
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Serve a pasta frontend estaticamente (usa process.cwd() para garantir que resolva independente do tsx/Node)
const frontendPath = path.resolve(process.cwd(), '../frontend');
console.log('Servindo frontend de:', frontendPath);
app.use(express.static(frontendPath));

// ─── Rotas ────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/auth', authRouter);
app.use('/api/empregados', empregadoRouter);
app.use('/api/rubricas', rubricaRouter);
app.use('/api/projetos', projetoRouter);
app.use('/api/gerenciais', gerencialRouter);
app.use('/api/parametros', parametroRouter);
app.use('/api/competencias', competenciaRouter);
app.use('/api/historicos', historicoRouter);
app.use('/api/beneficios', beneficioRouter);

// ─── Tratamento Global de Erros ───────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  // Erros operacionais conhecidos (ex: credenciais inválidas)
  if (err instanceof AuthError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Erros inesperados — log interno, resposta genérica para o cliente
  console.error('[Celer Error]', err);

  return res.status(500).json({
    success: false,
    error: 'Erro interno do servidor.',
  });
});

export { app };
