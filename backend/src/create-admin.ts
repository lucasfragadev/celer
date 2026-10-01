import { pool } from './infrastructure/database/pg-client';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'admin@lites.com.br';
  const plainPassword = 'admin';
  const nome = 'Super Admin';

  try {
    const hash = await bcrypt.hash(plainPassword, 10);
    const result = await pool.query(
      `INSERT INTO usuarios (email, senha_hash, nome, admin_global) 
       VALUES ($1, $2, $3, true) 
       ON CONFLICT (email) DO UPDATE SET senha_hash = $2, admin_global = true
       RETURNING id, email, admin_global`,
      [email, hash, nome]
    );

    console.log('Super Admin criado/atualizado com sucesso:');
    console.log(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar Super Admin:', err);
  } finally {
    await pool.end();
  }
}

main();
