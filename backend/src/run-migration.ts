import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    const sql = fs.readFileSync(path.join(__dirname, '../migrations/01_historicos_beneficios.sql'), 'utf8');
    await client.query(sql);
    console.log('Migration executada com sucesso!');
  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await client.end();
  }
}

run();
