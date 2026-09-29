import fs from 'fs';
import path from 'path';
import { pool } from './infrastructure/database/pg-client';

async function run() {
  console.log('Iniciando populacao de dados para INESC...');
  const jsonPath = path.resolve(__dirname, '../../backend/seed-data.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('Arquivo seed-data.json não encontrado!');
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  let seed;
  try {
    seed = JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao parsear seed-data.json:', e);
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    // 1. Achar tenant_id do INESC
    const tenantRes = await client.query(`SELECT id FROM tenants WHERE slug = 'inesc'`);
    if (tenantRes.rowCount === 0) {
      throw new Error('Tenant INESC não encontrado. Rode o banco novamente.');
    }
    const tenantId = tenantRes.rows[0].id;
    console.log(`Tenant INESC encontrado: ${tenantId}`);

    await client.query('BEGIN');

    // Bypass RLS simulando o admin master do INESC, ou apenas setando o app.current_tenant_id (depende de como está o RLS, mas se usarmos insert direto precisamos do tenant_id em todas as tabelas)
    // Na verdade, basta inserir o tenant_id manualmente nas colunas.

    console.log('Populando Empregados...');
    if (seed.empregados) {
      for (const [mat, emp] of Object.entries(seed.empregados)) {
        // emp pode ter { nome, cpf, cargo, situacao, demissao, contaSalPagar, contaAdiant, contaG2 }
        await client.query(`
          INSERT INTO empregados (tenant_id, matricula, nome, cpf, cargo, situacao, demissao, conta_sal_pagar, conta_adiant, conta_g2)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (tenant_id, matricula) DO UPDATE SET
            nome = EXCLUDED.nome,
            cpf = EXCLUDED.cpf,
            cargo = EXCLUDED.cargo
        `, [
          tenantId,
          mat,
          (emp as any).nome || 'Sem Nome',
          (emp as any).cpf || '',
          (emp as any).cargo || '',
          (emp as any).situacao || 'Ativo',
          (emp as any).demissao ? new Date((emp as any).demissao) : null,
          (emp as any).contaSalPagar || '',
          (emp as any).contaAdiant || '',
          (emp as any).contaG2 || ''
        ]);
      }
    }

    console.log('Populando Rubricas...');
    if (seed.rubricas) {
      for (const [cod, rub] of Object.entries(seed.rubricas)) {
        await client.query(`
          INSERT INTO rubricas (tenant_id, codigo, descricao, tipo, ativa, nao_contabil, ratear, g3, conta_deb, conta_cred)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (tenant_id, codigo) DO UPDATE SET
            descricao = EXCLUDED.descricao,
            tipo = EXCLUDED.tipo
        `, [
          tenantId,
          cod,
          (rub as any).descricao || 'Sem Descricao',
          (rub as any).tipo || 'Provento',
          (rub as any).ativa !== false,
          (rub as any).naoContab === true,
          (rub as any).ratear || '',
          (rub as any).g3 || '',
          (rub as any).contaDeb || '',
          (rub as any).contaCred || ''
        ]);
      }
    }

    console.log('Populando Projetos...');
    if (seed.projetos) {
      for (const [cod, proj] of Object.entries(seed.projetos)) {
        await client.query(`
          INSERT INTO projetos (tenant_id, codigo, nome)
          VALUES ($1, $2, $3)
          ON CONFLICT (tenant_id, codigo) DO UPDATE SET
            nome = EXCLUDED.nome
        `, [
          tenantId,
          cod,
          (proj as any).nome || 'Sem Nome'
        ]);

        // Contas analíticas
        const analiticas = (proj as any).analiticas;
        if (analiticas) {
          for (const [codAnalitica, nomeAnalitica] of Object.entries(analiticas)) {
            await client.query(`
              INSERT INTO contas_analiticas (tenant_id, projeto_codigo, codigo, nome)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (tenant_id, projeto_codigo, codigo) DO UPDATE SET
                nome = EXCLUDED.nome
            `, [
              tenantId,
              cod,
              codAnalitica,
              nomeAnalitica
            ]);
          }
        }
      }
    }

    console.log('Populando Planos Gerenciais...');
    if (seed.gerenciais) {
      for (const [gN, contas] of Object.entries(seed.gerenciais)) {
        // gN é G1, G2, etc. Onde G1 -> 1
        const ordem = parseInt(gN.replace('G', ''));
        if (isNaN(ordem)) continue;

        // Ensure plan exists
        const planoNome = gN === 'G1' ? 'Projetos' : (gN === 'G2' ? 'Empregados' : (gN === 'G3' ? 'Rubricas' : 'G4'));
        await client.query(`
          INSERT INTO planos_gerenciais (tenant_id, ordem, nome, vinculado_a)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (tenant_id, ordem) DO NOTHING
        `, [tenantId, ordem, planoNome, null]);

        for (const [cod, conta] of Object.entries(contas as Record<string, any>)) {
          await client.query(`
            INSERT INTO contas_gerenciais (tenant_id, plano_ordem, codigo, sintetica, nome, tipo, classif, projeto, empregado)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (tenant_id, plano_ordem, codigo) DO UPDATE SET
              nome = EXCLUDED.nome
          `, [
            tenantId,
            ordem,
            cod,
            conta.sintetica || '',
            conta.nome || 'Sem Nome',
            conta.tipo || 'A',
            conta.classif || '',
            conta.projeto || '',
            conta.empregado || ''
          ]);
        }
      }
    }

    await client.query('COMMIT');
    console.log('População concluída com sucesso!');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Erro na populacao:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
