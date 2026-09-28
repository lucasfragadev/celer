import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: string;
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
    const { sub } = decoded as { sub: string };
    req.userId = sub;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token invalid' });
  }
}
