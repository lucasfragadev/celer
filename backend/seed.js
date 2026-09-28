const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = new Client({
    connectionString: 'postgres://celer_user:celer_pass@localhost:5432/celer_db'
  });

  try {
    await client.connect();
    console.log('Conectado ao celer_db.');

    // 1. Criar o Tenant (INESC)
    const tenantRes = await client.query(`
      INSERT INTO tenants (nome, cnpj, sistema_contabil) 
      VALUES ('INESC', '00000000000000', 'Domínio') 
      RETURNING id
    `);
    const tenantId = tenantRes.rows[0].id;
    console.log('Tenant INESC criado.');

    // 2. Criar Usuário Admin
    const hash = await bcrypt.hash('senha123', 10);
    const userRes = await client.query(`
      INSERT INTO usuarios (email, senha_hash, nome, admin_global) 
      VALUES ('admin@lites.com.br', $1, 'Administrador Lites', true) 
      RETURNING id
    `, [hash]);
    const userId = userRes.rows[0].id;
    console.log('Usuário admin@lites.com.br criado.');

    // 3. Vincular Usuário ao Tenant (Membership)
    await client.query(`
      INSERT INTO memberships (user_id, tenant_id, papel, permissoes) 
      VALUES ($1, $2, 'master', '{"tudo": true}'::jsonb)
    `, [userId, tenantId]);
    console.log('Vínculo de administrador (Membership) criado.');

    console.log('✅ Seed concluído com sucesso!');
  } catch (err) {
    console.error('Erro ao rodar seed:', err.message);
  } finally {
    await client.end();
  }
}

seed();
