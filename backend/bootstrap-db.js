const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function bootstrap() {
  console.log('Conectando ao PostgreSQL local...');
  
  // 1. Conecta no banco padrão (postgres) usando o superusuário para criar o banco da aplicação
  const adminClient = new Client({
    user: 'postgres',
    password: '215500#Aa',
    host: 'localhost',
    port: 5432,
    database: 'postgres'
  });

  try {
    await adminClient.connect();
    
    // Verifica e cria o usuário celer_user
    console.log('Configurando usuário celer_user...');
    await adminClient.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'celer_user') THEN
          CREATE ROLE celer_user LOGIN PASSWORD 'celer_pass';
        END IF;
      END
      $$;
    `);

    // Verifica e cria o banco celer_db
    console.log('Configurando banco de dados celer_db...');
    const dbCheck = await adminClient.query(`SELECT 1 FROM pg_database WHERE datname = 'celer_db'`);
    if (dbCheck.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE celer_db OWNER celer_user`);
      console.log('Banco celer_db criado com sucesso.');
    } else {
      console.log('Banco celer_db já existe.');
    }
  } catch (err) {
    console.error('Erro na configuração inicial (admin):', err.message);
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  // 2. Conecta no banco celer_db usando o novo celer_user para rodar o SQL
  console.log('Conectando ao banco celer_db para injetar tabelas...');
  const appClient = new Client({
    user: 'celer_user',
    password: 'celer_pass',
    host: 'localhost',
    port: 5432,
    database: 'celer_db'
  });

  try {
    await appClient.connect();
    
    const sqlPath = path.join(__dirname, '../Celer_Banco_Fundacao_Node_v1.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executando Celer_Banco_Fundacao_Node_v1.sql...');
    await appClient.query(sql);
    
    console.log('Tabelas e funções criadas com sucesso!');
  } catch (err) {
    console.error('Erro ao injetar SQL:', err.message);
  } finally {
    await appClient.end();
  }
}

bootstrap();
