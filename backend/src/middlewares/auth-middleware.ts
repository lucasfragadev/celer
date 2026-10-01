import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  adminGlobal?: boolean;
  dbClient?: any;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Lê o token do cookie httpOnly (frontend) ou do header Authorization (Bruno/API clients)
  const tokenFromCookie = req.cookies?.celer_token;
  const tokenFromHeader = req.headers.authorization?.split(' ')[1];
  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const { sub, adminGlobal } = decoded as { sub: string, adminGlobal?: boolean };
    req.userId = sub;
    req.adminGlobal = adminGlobal;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token invalid' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.adminGlobal) {
    return res.status(403).json({ success: false, error: 'Acesso restrito ao Super-Admin' });
  }
  next();
}
