const { Client } = require('pg');

async function seedGerenciais() {
  const client = new Client({
    host: 'localhost', port: 5432,
    database: 'celer_db',
    user: 'postgres',
    password: '215500#Aa'
  });

  await client.connect();

  // Busca o tenant INESC
  const tenantRes = await client.query("SELECT id FROM tenants WHERE nome ILIKE '%INESC%' LIMIT 1");
  if (!tenantRes.rows.length) {
    console.error('Tenant INESC não encontrado!');
    await client.end();
    return;
  }

  const tenantId = tenantRes.rows[0].id;
  console.log('Tenant INESC:', tenantId);

  // Os 4 planos gerenciais que o frontend usa (G1 a G4)
  const planos = [
    { ordem: 1, nome: 'G1 - PROJETOS',   modo: 'projeto'    },
    { ordem: 2, nome: 'G2 - EMPREGADO',  modo: 'empregado'  },
    { ordem: 3, nome: 'G3 - RUBRICA',    modo: 'rubrica'    },
    { ordem: 4, nome: 'G4 - GERENCIAL',  modo: 'rateio'     },
  ];

  for (const p of planos) {
    const exists = await client.query(
      'SELECT id FROM gerenciais WHERE tenant_id=$1 AND ordem=$2',
      [tenantId, p.ordem]
    );

    if (exists.rows.length) {
      console.log(`⏭️  G${p.ordem} já existe, pulando`);
      continue;
    }

    await client.query(
      `INSERT INTO gerenciais (tenant_id, ordem, nome, modo, ativo)
       VALUES ($1, $2, $3, $4, true)`,
      [tenantId, p.ordem, p.nome, p.modo]
    );
    console.log(`✅  G${p.ordem} criado: ${p.nome}`);
  }

  await client.end();
  console.log('Pronto!');
}

seedGerenciais().catch(console.error);
