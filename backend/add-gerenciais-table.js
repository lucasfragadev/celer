const { Client } = require('pg');

async function migrate() {
  const client = new Client({
    connectionString: 'postgres://celer_user:celer_pass@localhost:5432/celer_db'
  });

  try {
    await client.connect();
    
    // Tabela contas_gerenciais
    await client.query(`
      CREATE TABLE IF NOT EXISTS contas_gerenciais (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        gerencial_ordem int NOT NULL,
        codigo text NOT NULL,
        nome text NOT NULL,
        tipo text,
        classificacao text,
        UNIQUE (tenant_id, gerencial_ordem, codigo),
        FOREIGN KEY (tenant_id, gerencial_ordem) REFERENCES gerenciais(tenant_id, ordem) ON DELETE CASCADE
      );
    `);
    
    // Habilitar RLS
    await client.query(`ALTER TABLE contas_gerenciais ENABLE ROW LEVEL SECURITY;`);

    // Política RLS
    await client.query(`
      DROP POLICY IF EXISTS "tenant_isolation" ON contas_gerenciais;
      CREATE POLICY "tenant_isolation" ON contas_gerenciais
        FOR ALL
        USING (tenant_id = (SELECT tenant_id FROM usuarios WHERE id = celer_current_user_id()))
        WITH CHECK (tenant_id = (SELECT tenant_id FROM usuarios WHERE id = celer_current_user_id()));
    `);

    console.log('Tabela contas_gerenciais criada com sucesso e isolamento RLS aplicado.');
  } catch (err) {
    console.error('Erro na migracao:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
