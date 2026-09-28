import { Response, NextFunction } from 'express';
import { pool } from '../infrastructure/database/pg-client';
import { AuthenticatedRequest } from './auth-middleware';

/**
 * Middleware that wraps the request in a PostgreSQL transaction.
 * It also sets the `app.current_user_id` inside the transaction
 * so that Row Level Security (RLS) works properly.
 */
export async function transactionMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Inject the session user ID for Postgres RLS
    if (req.userId) {
      await client.query(`SET LOCAL app.current_user_id = '${req.userId}'`);
    }

    // Attach client to request so controllers/services can use the same transaction
    req.dbClient = client;

    // We hook into the response finish event to commit or rollback
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        await client.query('COMMIT');
      } else {
        await client.query('ROLLBACK');
      }
      client.release();
    });

    res.on('close', async () => {
      // If connection closed before finish
      if (!res.writableFinished) {
        await client.query('ROLLBACK');
        client.release();
      }
    });

    next();
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    next(err);
  }
}
