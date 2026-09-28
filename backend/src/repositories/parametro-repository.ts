import { PoolClient } from 'pg';
import { Parametro } from '../domain/entities';

export class ParametroRepository {
  constructor(private readonly client: PoolClient) {}

  async get(tenantId: string): Promise<Parametro | null> {
    const res = await this.client.query<Parametro>(
      'SELECT * FROM parametros WHERE tenant_id = $1',
      [tenantId]
    );
    return res.rows[0] ?? null;
  }

  async upsert(tenantId: string, param: Partial<Omit<Parametro, 'tenant_id' | 'atualizado_em'>>): Promise<Parametro> {
    // Como os campos têm default na base, garantimos que se for o primeiro insert, cria com padrões + os enviados.
    // O upsert (ON CONFLICT) funciona perfeitamente pois tenant_id é PK.
    const { endereco = null, paleta = 'verde', arredondamento_cent = 3 } = param;
    
    // Pega o atual para preservar caso de upsert
    const atual = await this.get(tenantId);
    const end = param.endereco !== undefined ? param.endereco : (atual?.endereco ?? null);
    const pal = param.paleta !== undefined ? param.paleta : (atual?.paleta ?? 'verde');
    const arr = param.arredondamento_cent !== undefined ? param.arredondamento_cent : (atual?.arredondamento_cent ?? 3);

    const res = await this.client.query<Parametro>(`
      INSERT INTO parametros (tenant_id, endereco, paleta, arredondamento_cent)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tenant_id) DO UPDATE SET
        endereco = EXCLUDED.endereco,
        paleta = EXCLUDED.paleta,
        arredondamento_cent = EXCLUDED.arredondamento_cent,
        atualizado_em = now()
      RETURNING *;
    `, [tenantId, end, pal, arr]);

    return res.rows[0];
  }
}
