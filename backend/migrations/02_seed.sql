DO $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  -- 1. Cria Tenant INESC se nao existir
  IF NOT EXISTS (SELECT 1 FROM tenants WHERE nome = 'INESC') THEN
    INSERT INTO tenants (nome, cnpj, sistema_contabil) VALUES ('INESC', '00000000000000', 'Dominio') RETURNING id INTO v_tenant_id;
  ELSE
    SELECT id INTO v_tenant_id FROM tenants WHERE nome = 'INESC' LIMIT 1;
  END IF;

  -- 2. Cria Usuario Admin se nao existir
  IF NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@lites.com.br') THEN
    INSERT INTO usuarios (email, senha_hash, nome, admin_global) 
    VALUES ('admin@lites.com.br', '$2b$10$VB4GNnA44veV44Bkyejf8e0aBrp.GTJdD/i.hOzqlXzCsBYefKEru', 'Administrador Lites', true) 
    RETURNING id INTO v_user_id;

    -- 3. Vincula ao Tenant
    INSERT INTO memberships (user_id, tenant_id, papel, permissoes) 
    VALUES (v_user_id, v_tenant_id, 'master', '{"tudo": true}'::jsonb);
  END IF;
END $$;
