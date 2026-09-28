const { Client } = require('pg');

async function audit() {
  const c = new Client({ host:'localhost', port:5432, database:'celer_db', user:'postgres', password:'215500#Aa' });
  await c.connect();

  // 1. Funções da sessão que o RLS usa
  const fn = await c.query("SELECT proname FROM pg_proc WHERE proname LIKE 'celer%'");
  console.log('Funções celer:', fn.rows.map(r => r.proname));

  // 2. Contagem das tabelas principais
  const tables = ['empregados', 'rubricas', 'projetos', 'gerenciais', 'contas_gerenciais', 'memberships', 'usuarios'];
  for (const t of tables) {
    const r = await c.query('SELECT COUNT(*) FROM ' + t);
    console.log(t + ': ' + r.rows[0].count + ' registros');
  }

  // 3. Testar SET LOCAL (o que o transactionMiddleware faz)
  try {
    await c.query('BEGIN');
    await c.query("SET LOCAL app.current_user_id = 'test-id'");
    const v = await c.query("SELECT current_setting('app.current_user_id', true) AS uid");
    console.log('SET LOCAL app.current_user_id funciona:', v.rows[0].uid);
    await c.query('ROLLBACK');
  } catch(e) {
    console.error('ERRO no SET LOCAL:', e.message);
    await c.query('ROLLBACK');
  }

  // 4. Verificar RLS habilitado
  const rls = await c.query("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename IN ('empregados','rubricas','projetos')");
  console.log('RLS status:', rls.rows);

  await c.end();
}

audit().catch(e => console.error('Erro:', e.message));
