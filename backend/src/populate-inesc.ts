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
    // 1. Achar tenant_id do INESC (corrigido: coluna 'nome' ao invés de 'slug')
    const tenantRes = await client.query(`SELECT id FROM tenants WHERE nome = 'INESC' LIMIT 1`);
    if (tenantRes.rowCount === 0) {
      throw new Error('Tenant INESC não encontrado. Rode o banco novamente.');
    }
    const tenantId = tenantRes.rows[0].id;
    console.log(`Tenant INESC encontrado: ${tenantId}`);

    await client.query('BEGIN');

    console.log('Populando Empregados...');
    if (seed.empregados) {
      for (const [mat, emp] of Object.entries(seed.empregados)) {
        await client.query(`
          INSERT INTO empregados (tenant_id, matricula, nome, cargo, situacao, conta_g2)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (tenant_id, matricula) DO UPDATE SET
            nome = EXCLUDED.nome,
            cargo = EXCLUDED.cargo
        `, [
          tenantId,
          mat,
          (emp as any).nome || 'Sem Nome',
          (emp as any).cargo || '',
          (emp as any).situacao || 'Ativo',
          (emp as any).contaG2 || ''
        ]);
      }
    }

    console.log('Populando Rubricas...');
    if (seed.rubricas) {
      for (const [cod, rub] of Object.entries(seed.rubricas)) {
        await client.query(`
          INSERT INTO rubricas (tenant_id, codigo, nome, tipo, conta_deb, conta_cred)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (tenant_id, codigo) DO UPDATE SET
            nome = EXCLUDED.nome,
            tipo = EXCLUDED.tipo
        `, [
          tenantId,
          cod,
          (rub as any).descricao || 'Sem Descricao',
          (rub as any).tipo || 'Provento',
          (rub as any).contaDeb || '',
          (rub as any).contaCred || ''
        ]);
      }
    }

    console.log('Populando Projetos...');
    if (seed.projetos) {
      for (const [cod, proj] of Object.entries(seed.projetos)) {
        const projRes = await client.query(`
          INSERT INTO projetos (tenant_id, codigo, nome)
          VALUES ($1, $2, $3)
          ON CONFLICT (tenant_id, codigo) DO UPDATE SET
            nome = EXCLUDED.nome
          RETURNING id
        `, [
          tenantId,
          cod,
          (proj as any).nome || 'Sem Nome'
        ]);
        
        const projetoId = projRes.rows[0].id;

        // Contas analíticas
        const analiticas = (proj as any).analiticas;
        if (analiticas) {
          for (const [codAnalitica, nomeAnalitica] of Object.entries(analiticas)) {
            await client.query(`
              INSERT INTO projeto_analiticas (tenant_id, projeto_id, codigo, descricao)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (tenant_id, projeto_id, codigo) DO UPDATE SET
                descricao = EXCLUDED.descricao
            `, [
              tenantId,
              projetoId,
              codAnalitica,
              nomeAnalitica
            ]);
          }
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
