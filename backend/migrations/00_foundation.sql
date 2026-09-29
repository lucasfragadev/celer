-- ============================================================================
-- Celer - Fundacao do banco (Node.js / PostgreSQL)
-- Versao v2 (Adaptado para Node.js puro, sem Supabase)
--
-- Esqueleto do banco do servico web multicliente. Cobre:
--   1. Tabelas de estrutura (usuarios nativos) e de dados com tenant_id
--   2. Isolamento por cliente, via Row Level Security
--   3. Papeis e permissoes, com override fino por usuario
--   4. Trilha de auditoria, so de insercao, com valor de antes e de depois
--
-- IMPORTANTE PARA A API NODE:
-- Antes de cada query, a API deve iniciar uma transação e injetar o usuário:
-- SET LOCAL app.current_user_id = 'uuid-do-usuario-logado';
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensoes
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. Tipos
-- ----------------------------------------------------------------------------
create type papel_celer   as enum ('master','operador','consulta');
create type situacao_emp  as enum ('ativo','afastado','desligado');
create type status_comp   as enum ('aberta','fechada');
create type modo_gerencial as enum ('rateio','empregado','rubrica','projeto');

-- ----------------------------------------------------------------------------
-- 1.5 Funcoes de Sessao (Substituindo o auth.uid() do Supabase)
-- ----------------------------------------------------------------------------
create or replace function celer_current_user_id() returns uuid
language sql stable as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid;
$$;

-- ----------------------------------------------------------------------------
-- 2. Tabela de Usuarios
--    Substitui o auth.users do Supabase e o antigo profiles.
--    admin_global marca o administrador (Lites) que enxerga todos os clientes.
-- ----------------------------------------------------------------------------
create table usuarios (
  id           uuid primary key default gen_random_uuid(),
  email        text unique not null,
  senha_hash   text not null,
  nome         text not null default '',
  admin_global boolean not null default false,
  criado_em    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. Clientes, os tenants
-- ----------------------------------------------------------------------------
create table tenants (
  id               uuid primary key default gen_random_uuid(),
  nome             text not null,
  cnpj             text,
  logo_url         text,
  sistema_contabil text not null default 'radar',
  ativo            boolean not null default true,
  criado_em        timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. Vinculo usuario - cliente - papel
-- ----------------------------------------------------------------------------
create table memberships (
  user_id    uuid not null references usuarios(id) on delete cascade,
  tenant_id  uuid not null references tenants(id)  on delete cascade,
  papel      papel_celer not null default 'consulta',
  permissoes jsonb not null default '{}'::jsonb,
  criado_em  timestamptz not null default now(),
  primary key (user_id, tenant_id)
);

-- ----------------------------------------------------------------------------
-- 5. Presets de permissao por papel
-- ----------------------------------------------------------------------------
create table role_permissions (
  papel     papel_celer not null,
  permissao text not null,
  primary key (papel, permissao)
);

insert into role_permissions (papel, permissao) values
  ('master','importar_folha'),
  ('master','lancar_rateio'),
  ('master','registrar_pagamento'),
  ('master','fechar_competencia'),
  ('master','editar_cadastro'),
  ('master','excluir_cadastro'),
  ('master','exportar'),
  ('master','ajustar_preferencias'),
  ('operador','importar_folha'),
  ('operador','lancar_rateio');

-- ----------------------------------------------------------------------------
-- 6. Funcoes de apoio ao isolamento e as permissoes
-- ----------------------------------------------------------------------------
create or replace function celer_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select admin_global from usuarios where id = celer_current_user_id()), false);
$$;

create or replace function celer_is_member(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select celer_is_admin()
      or exists (select 1 from memberships 
                 where user_id = celer_current_user_id() and tenant_id = t);
$$;

create or replace function celer_has_perm(t uuid, p text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  m memberships%rowtype;
begin
  if celer_is_admin() then return true; end if;
  
  select * into m from memberships where user_id = celer_current_user_id() and tenant_id = t;
  if not found then return false; end if;
  
  if m.permissoes ? p then
    return coalesce((m.permissoes ->> p)::boolean, false);
  end if;
  
  return exists (select 1 from role_permissions rp
                 where rp.papel = m.papel and rp.permissao = p);
end;
$$;

-- ----------------------------------------------------------------------------
-- 7. Tabelas de dados
-- ----------------------------------------------------------------------------
create table parametros (
  tenant_id             uuid primary key references tenants(id) on delete cascade,
  endereco              text,
  paleta                text not null default 'verde',
  arredondamento_cent   int  not null default 3,
  atualizado_em         timestamptz not null default now()
);

create table contas_gerenciais (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid not null references tenants(id) on delete cascade,
    gerencial_ordem int not null,
    codigo          text not null,
    nome            text not null,
    tipo            text,
    classificacao   text,
    unique (tenant_id, gerencial_ordem, codigo),
    foreign key (tenant_id, gerencial_ordem) references gerenciais(tenant_id, ordem) on delete cascade
  );

  alter table contas_gerenciais enable row level security;
  create policy cg_sel on contas_gerenciais for select using (celer_is_member(tenant_id));
  create policy cg_ins on contas_gerenciais for insert with check (celer_has_perm(tenant_id,'editar_cadastro'));
  create policy cg_upd on contas_gerenciais for update using (celer_has_perm(tenant_id,'editar_cadastro'));
  create policy cg_del on contas_gerenciais for delete using (celer_has_perm(tenant_id,'editar_cadastro'));
  
  create table gerenciais (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  ordem     int  not null check (ordem between 1 and 6),
  nome      text not null,
  modo      modo_gerencial not null,
  ativo     boolean not null default true,
  unique (tenant_id, ordem)
);

create table projetos (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  codigo      text not null,
  nome        text not null,
  vigencia_ate date,
  unique (tenant_id, codigo)
);

create table projeto_analiticas (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  projeto_id uuid not null references projetos(id) on delete cascade,
  codigo     text not null,
  descricao  text,
  unique (tenant_id, projeto_id, codigo)
);

create table rubricas (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  codigo     text not null,
  nome       text,
  conta_deb  text,
  conta_cred text,
  historico  text,
  tipo       text,
  unique (tenant_id, codigo)
);

create table beneficios (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  codigo     text not null,
  nome       text,
  conta_deb  text,
  conta_cred text,
  fornecedor text,
  unique (tenant_id, codigo)
);

create table historicos (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  codigo    text not null,
  descricao text,
  unique (tenant_id, codigo)
);

create table empregados (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  matricula text not null,
  nome      text not null default '',
  cargo     text,
  filial    text,
  situacao  situacao_emp not null default 'ativo',
  conta_g2  text,
    rateio_padrao jsonb default '{}'::jsonb,
  unique (tenant_id, matricula)
);

create table competencias (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  comp       text not null,
  tipo_folha text not null default 'geral',
  status     status_comp not null default 'aberta',
  fechada_em timestamptz,
  versao     int not null default 1,
  unique (tenant_id, comp, tipo_folha)
);

create table folha (
  competencia_id uuid primary key references competencias(id) on delete cascade,
  tenant_id      uuid not null references tenants(id) on delete cascade,
  payload        jsonb not null default '{}'::jsonb,
  atualizado_em  timestamptz not null default now()
);

create table rateios (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  competencia_id uuid not null references competencias(id) on delete cascade,
  matricula      text not null,
  payload        jsonb not null default '{}'::jsonb,
  versao         int not null default 1,
  unique (tenant_id, competencia_id, matricula)
);

create table pagamentos (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  competencia_id uuid not null references competencias(id) on delete cascade,
  obrigacao      text not null,
  pagador        text,
  data_pgto      date,
  valor          numeric(14,2) not null default 0,
  criado_em      timestamptz not null default now()
);

create table export_layouts (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  sistema   text not null,
  config    jsonb not null default '{}'::jsonb,
  unique (tenant_id, sistema)
);

-- ----------------------------------------------------------------------------
-- 8. Trilha de auditoria
-- ----------------------------------------------------------------------------
create table audit_log (
  id           bigint generated always as identity primary key,
  tenant_id    uuid not null,
  user_id      uuid,
  acao         text not null,
  alvo         text,
  valor_antes  jsonb,
  valor_depois jsonb,
  quando       timestamptz not null default now(),
  ip           text
);
create index audit_log_tenant_idx on audit_log (tenant_id, quando desc);

create or replace function celer_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  t uuid;
begin
  t := coalesce(new.tenant_id, old.tenant_id);
  insert into audit_log (tenant_id, user_id, acao, alvo, valor_antes, valor_depois)
  values (
    t, celer_current_user_id(),
    tg_op || ' ' || tg_table_name,
    tg_table_name,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end
  );
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

create or replace function celer_log(t uuid, acao text, alvo text default null,
                                     antes jsonb default null, depois jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not celer_is_member(t) then
    raise exception 'sem acesso ao cliente';
  end if;
  insert into audit_log (tenant_id, user_id, acao, alvo, valor_antes, valor_depois)
  values (t, celer_current_user_id(), acao, alvo, antes, depois);
end;
$$;

create or replace function celer_audit_readonly() returns trigger
language plpgsql as $$
begin
  raise exception 'a trilha de auditoria e somente de insercao';
end;
$$;

create trigger audit_no_update before update on audit_log
  for each row execute function celer_audit_readonly();
create trigger audit_no_delete before delete on audit_log
  for each row execute function celer_audit_readonly();
revoke update, delete on audit_log from public;

-- ----------------------------------------------------------------------------
-- 9. Concorrencia
-- ----------------------------------------------------------------------------
create or replace function celer_bump_versao() returns trigger
language plpgsql as $$
begin
  new.versao := old.versao + 1;
  return new;
end;
$$;
create trigger rateios_versao before update on rateios
  for each row execute function celer_bump_versao();
create trigger competencias_versao before update on competencias
  for each row execute function celer_bump_versao();

create or replace function celer_check_fechamento() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status 
     and not celer_has_perm(new.tenant_id, 'fechar_competencia') then
    raise exception 'sem permissao para fechar ou reabrir competencia';
  end if;
  return new;
end;
$$;
create trigger competencias_fechamento before update on competencias
  for each row execute function celer_check_fechamento();

-- ----------------------------------------------------------------------------
-- 10. Row Level Security
-- ----------------------------------------------------------------------------
alter table usuarios    enable row level security;
alter table tenants     enable row level security;
alter table memberships enable row level security;

create policy usr_sel on usuarios for select
  using (id = celer_current_user_id() or celer_is_admin());
create policy usr_upd on usuarios for update
  using (id = celer_current_user_id() or celer_is_admin())
  with check (id = celer_current_user_id() or celer_is_admin());
create policy usr_adm on usuarios for all
  using (celer_is_admin()) with check (celer_is_admin());

create policy ten_sel on tenants for select
  using (celer_is_member(id));
create policy ten_adm on tenants for all
  using (celer_is_admin()) with check (celer_is_admin());

create policy mem_sel on memberships for select
  using (user_id = celer_current_user_id() or celer_is_admin());
create policy mem_adm on memberships for all
  using (celer_is_admin()) with check (celer_is_admin());

alter table role_permissions enable row level security;
create policy rp_sel on role_permissions for select using (celer_current_user_id() is not null);
create policy rp_adm on role_permissions for all
  using (celer_is_admin()) with check (celer_is_admin());

do $$
declare
  tbl text;
  cadastro text[] := array[
    'projetos','projeto_analiticas','rubricas','beneficios',
    'historicos','empregados'
  ];
begin
  foreach tbl in array cadastro loop
    execute format('alter table %I enable row level security;', tbl);
    execute format($f$create policy %1$s_sel on %1$I for select
        using (celer_is_member(tenant_id));$f$, tbl);
    execute format($f$create policy %1$s_ins on %1$I for insert
        with check (celer_has_perm(tenant_id,'editar_cadastro'));$f$, tbl);
    execute format($f$create policy %1$s_upd on %1$I for update
        using (celer_has_perm(tenant_id,'editar_cadastro'))
        with check (celer_has_perm(tenant_id,'editar_cadastro'));$f$, tbl);
    execute format($f$create policy %1$s_del on %1$I for delete
        using (celer_has_perm(tenant_id,'excluir_cadastro'));$f$, tbl);
    execute format($f$create trigger %1$s_audit
        after insert or update or delete on %1$I
        for each row execute function celer_audit();$f$, tbl);
  end loop;
end $$;

alter table parametros enable row level security;
create policy par_sel on parametros for select using (celer_is_member(tenant_id));
create policy par_ins on parametros for insert with check (celer_has_perm(tenant_id,'ajustar_preferencias'));
create policy par_upd on parametros for update
  using (celer_has_perm(tenant_id,'ajustar_preferencias'))
  with check (celer_has_perm(tenant_id,'ajustar_preferencias'));
create trigger parametros_audit after insert or update or delete on parametros
  for each row execute function celer_audit();

alter table gerenciais enable row level security;
create policy ger_sel on gerenciais for select using (celer_is_member(tenant_id));
create policy ger_wr  on gerenciais for all
  using (celer_has_perm(tenant_id,'config_gerenciais'))
  with check (celer_has_perm(tenant_id,'config_gerenciais'));
create trigger gerenciais_audit after insert or update or delete on gerenciais
  for each row execute function celer_audit();

alter table export_layouts enable row level security;
create policy exl_sel on export_layouts for select using (celer_is_member(tenant_id));
create policy exl_wr  on export_layouts for all
  using (celer_has_perm(tenant_id,'config_gerenciais'))
  with check (celer_has_perm(tenant_id,'config_gerenciais'));
create trigger export_layouts_audit after insert or update or delete on export_layouts
  for each row execute function celer_audit();

alter table competencias enable row level security;
create policy cmp_sel on competencias for select using (celer_is_member(tenant_id));
create policy cmp_ins on competencias for insert with check (celer_has_perm(tenant_id,'importar_folha'));
create policy cmp_upd on competencias for update
  using (celer_has_perm(tenant_id,'importar_folha') or celer_has_perm(tenant_id,'fechar_competencia'))
  with check (celer_has_perm(tenant_id,'importar_folha') or celer_has_perm(tenant_id,'fechar_competencia'));
create policy cmp_del on competencias for delete using (celer_has_perm(tenant_id,'fechar_competencia'));
create trigger competencias_audit after insert or update or delete on competencias
  for each row execute function celer_audit();

alter table folha enable row level security;
create policy folha_sel on folha for select using (celer_is_member(tenant_id));
create policy folha_wr  on folha for all
  using (celer_has_perm(tenant_id,'importar_folha'))
  with check (celer_has_perm(tenant_id,'importar_folha'));
create trigger folha_audit after insert or update or delete on folha
  for each row execute function celer_audit();

alter table rateios enable row level security;
create policy rat_sel on rateios for select using (celer_is_member(tenant_id));
create policy rat_wr  on rateios for all
  using (celer_has_perm(tenant_id,'lancar_rateio'))
  with check (celer_has_perm(tenant_id,'lancar_rateio'));
create trigger rateios_audit after insert or update or delete on rateios
  for each row execute function celer_audit();

alter table pagamentos enable row level security;
create policy pag_sel on pagamentos for select using (celer_is_member(tenant_id));
create policy pag_wr  on pagamentos for all
  using (celer_has_perm(tenant_id,'registrar_pagamento'))
  with check (celer_has_perm(tenant_id,'registrar_pagamento'));
create trigger pagamentos_audit after insert or update or delete on pagamentos
  for each row execute function celer_audit();

alter table audit_log enable row level security;
create policy aud_sel on audit_log for select using (celer_is_member(tenant_id));
create policy aud_ins on audit_log for insert with check (celer_is_member(tenant_id));
