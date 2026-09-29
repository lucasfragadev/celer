import fs from 'fs';
import path from 'path';
import { pool } from './infrastructure/database/pg-client';

async function run() {
  console.log('Iniciando populacao COMPLETA de dados para INESC a partir de dados.json...');
  const jsonPath = path.resolve(__dirname, '../../dados.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('Arquivo dados.json não encontrado na raiz!');
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao parsear dados.json:', e);
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    // 1. Achar tenant_id do INESC
    const tenantRes = await client.query(`SELECT id FROM tenants WHERE nome = 'INESC' LIMIT 1`);
    if (tenantRes.rowCount === 0) {
      throw new Error('Tenant INESC não encontrado. Rode o banco novamente.');
    }
    const tenantId = tenantRes.rows[0].id;
    console.log(`Tenant INESC encontrado: ${tenantId}`);

    await client.query('BEGIN');

    // Add rateio_padrao to empregados if not exists
    await client.query(`ALTER TABLE empregados ADD COLUMN IF NOT EXISTS rateio_padrao jsonb DEFAULT '{}'::jsonb`);

    console.log('Populando Empregados (com Rateios Padrao)...');
    if (data.empregados) {
      for (const [mat, emp] of Object.entries(data.empregados)) {
        let situacao = 'ativo';
        const rawSit = (emp as any).situacao;
        if (rawSit == '1') situacao = 'ativo';
        else if (rawSit == '2') situacao = 'afastado';
        else if (rawSit == '3') situacao = 'desligado';
        else if (typeof rawSit === 'string' && ['ativo', 'afastado', 'desligado'].includes(rawSit.toLowerCase())) {
          situacao = rawSit.toLowerCase();
        }

        const rateioPadrao = data.rateios ? (data.rateios[mat] || {}) : {};

        await client.query(`
          INSERT INTO empregados (tenant_id, matricula, nome, cargo, situacao, conta_g2, rateio_padrao)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (tenant_id, matricula) DO UPDATE SET
            nome = EXCLUDED.nome,
            cargo = EXCLUDED.cargo,
            situacao = EXCLUDED.situacao,
            rateio_padrao = EXCLUDED.rateio_padrao
        `, [
          tenantId, mat, (emp as any).nome || 'Sem Nome', (emp as any).cargo || '', situacao, (emp as any).contaG2 || '', rateioPadrao
        ]);
      }
    }

    console.log('Populando Rubricas...');
    if (data.rubricas) {
      for (const [cod, rub] of Object.entries(data.rubricas)) {
        await client.query(`
          INSERT INTO rubricas (tenant_id, codigo, nome, tipo, conta_deb, conta_cred)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (tenant_id, codigo) DO UPDATE SET
            nome = EXCLUDED.nome, tipo = EXCLUDED.tipo, conta_deb = EXCLUDED.conta_deb, conta_cred = EXCLUDED.conta_cred
        `, [
          tenantId, cod, (rub as any).descricao || 'Sem Descricao', (rub as any).tipo || 'Provento', (rub as any).contaDeb || '', (rub as any).contaCred || ''
        ]);
      }
    }

    console.log('Populando Projetos...');
    if (data.projetos) {
      for (const [cod, proj] of Object.entries(data.projetos)) {
        const projRes = await client.query(`
          INSERT INTO projetos (tenant_id, codigo, nome)
          VALUES ($1, $2, $3)
          ON CONFLICT (tenant_id, codigo) DO UPDATE SET nome = EXCLUDED.nome
          RETURNING id
        `, [tenantId, cod, (proj as any).nome || 'Sem Nome']);
        
        const projetoId = projRes.rows[0].id;

        const analiticas = (proj as any).analiticas;
        if (analiticas) {
          for (const [codAnalitica, nomeAnalitica] of Object.entries(analiticas)) {
            await client.query(`
              INSERT INTO projeto_analiticas (tenant_id, projeto_id, codigo, descricao)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (tenant_id, projeto_id, codigo) DO UPDATE SET descricao = EXCLUDED.descricao
            `, [tenantId, projetoId, codAnalitica, nomeAnalitica]);
          }
        }
      }
    }

    console.log('Populando Historicos...');
    if (data.historicos) {
      for (const hist of data.historicos) {
        if (!hist || !hist.cod) continue;
        await client.query(`
          INSERT INTO historicos (tenant_id, codigo, descricao) VALUES ($1, $2, $3)
          ON CONFLICT (tenant_id, codigo) DO UPDATE SET descricao = EXCLUDED.descricao
        `, [tenantId, hist.cod, hist.desc || '']);
      }
    }

    console.log('Populando Beneficio Cadastros...');
    if (data.benCad) {
      for (const [cod, ben] of Object.entries(data.benCad)) {
        await client.query(`
          INSERT INTO beneficio_cadastros (tenant_id, codigo, nome, conta_deb, conta_cred)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (tenant_id, codigo) DO UPDATE SET
            nome = EXCLUDED.nome, conta_deb = EXCLUDED.conta_deb, conta_cred = EXCLUDED.conta_cred
        `, [tenantId, cod, (ben as any).descricao || '', (ben as any).contaDeb || '', (ben as any).contaCred || '']);
      }
    }

    // Helper para garantir competencia
    const ensureCompetencia = async (comp: string) => {
      const cRes = await client.query(`SELECT id FROM competencias WHERE tenant_id = $1 AND comp = $2`, [tenantId, comp]);
      if (cRes.rowCount > 0) return cRes.rows[0].id;
      const iRes = await client.query(`INSERT INTO competencias (tenant_id, comp, status) VALUES ($1, $2, 'fechada') RETURNING id`, [tenantId, comp]);
      return iRes.rows[0].id;
    };

    console.log('Populando Rateios Mensais...');
    if (data.rateiosComp) {
      for (const [compStr, matriculasObj] of Object.entries(data.rateiosComp)) {
        const compId = await ensureCompetencia(compStr);
        for (const [mat, payload] of Object.entries(matriculasObj as any)) {
          await client.query(`
            INSERT INTO rateios (tenant_id, competencia_id, matricula, payload)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (tenant_id, competencia_id, matricula) DO UPDATE SET payload = EXCLUDED.payload
          `, [tenantId, compId, mat, payload]);
        }
      }
    }

    console.log('Populando Folha e Beneficios da Folha (se houver)...');
    if (data.folha && data.folha.competencia && data.folha.recs) {
      const compId = await ensureCompetencia(data.folha.competencia);
      for (const rec of data.folha.recs) {
        if (!rec.matricula || !rec.rubrica) continue;
        await client.query(`
          INSERT INTO folha (tenant_id, competencia_id, matricula, rubrica, valor, ref)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING
        `, [tenantId, compId, rec.matricula, rec.rubrica, rec.valor || 0, rec.ref || 0]);
      }
    }

    if (data.beneficios) {
      for (const [compStr, matriculasObj] of Object.entries(data.beneficios)) {
        const compId = await ensureCompetencia(compStr);
        for (const [mat, payload] of Object.entries(matriculasObj as any)) {
          await client.query(`
            INSERT INTO beneficios (tenant_id, competencia_id, matricula, payload)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (tenant_id, competencia_id, matricula) DO UPDATE SET payload = EXCLUDED.payload
          `, [tenantId, compId, mat, payload]);
        }
      }
    }

    console.log('Populando Parametros e Configuracoes Globais...');
    if (data.param) {
      await client.query(`
        INSERT INTO parametros (tenant_id, paleta, arredondamento_cent)
        VALUES ($1, $2, $3)
        ON CONFLICT (tenant_id) DO UPDATE SET 
          paleta = EXCLUDED.paleta, 
          arredondamento_cent = EXCLUDED.arredondamento_cent
      `, [tenantId, data.param.paleta || 'verde', data.param.tolArred || 3]);
    }

    console.log('Populando Mapeamento Gerencial...');
    if (data.gerVinc) {
      for (const [gN, modoStr] of Object.entries(data.gerVinc)) {
        if (!modoStr) continue;
        const ordem = parseInt(gN.replace('G', ''));
        if (isNaN(ordem)) continue;

        let modo = 'rateio';
        if (modoStr === 'projeto') modo = 'projeto';
        else if (modoStr === 'empregado') modo = 'empregado';
        else if (modoStr === 'rubrica') modo = 'rubrica';

        const planoNome = gN === 'G1' ? 'Projetos' : (gN === 'G2' ? 'Empregados' : (gN === 'G3' ? 'Rubricas' : `Plano ${ordem}`));

        await client.query(`
          INSERT INTO gerenciais (tenant_id, ordem, nome, modo, ativo)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (tenant_id, ordem) DO UPDATE SET 
            nome = EXCLUDED.nome, modo = EXCLUDED.modo
        `, [tenantId, ordem, planoNome, modo, true]);
      }
    }

    console.log('Populando Contas Gerenciais (Itens de G1, G2, etc)...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS contas_gerenciais (
        id              uuid primary key default gen_random_uuid(),
        tenant_id       uuid not null references tenants(id) on delete cascade,
        gerencial_ordem int not null,
        codigo          text not null,
        nome            text not null,
        tipo            text,
        classificacao   text,
        unique (tenant_id, gerencial_ordem, codigo),
        foreign key (tenant_id, gerencial_ordem) references gerenciais(tenant_id, ordem) on delete cascade
      )
    `);
    if (data.gerenciais) {
      for (const [gKey, contasObj] of Object.entries(data.gerenciais)) {
        const ordem = parseInt(gKey.replace('G', ''));
        if (isNaN(ordem)) continue;
        
        for (const [codigo, cObj] of Object.entries(contasObj as any)) {
          const nome = (cObj as any).nome || 'Sem Nome';
          const tipo = (cObj as any).tipo || 'A';
          const classificacao = (cObj as any).classif || '';
          await client.query(`
            INSERT INTO contas_gerenciais (tenant_id, gerencial_ordem, codigo, nome, tipo, classificacao)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (tenant_id, gerencial_ordem, codigo) DO UPDATE SET
              nome = EXCLUDED.nome, tipo = EXCLUDED.tipo, classificacao = EXCLUDED.classificacao
          `, [tenantId, ordem, codigo, nome, tipo, classificacao]);
        }
      }
    }

    await client.query('COMMIT');
    console.log('População TOTAL concluída com sucesso!');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Erro na populacao:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
