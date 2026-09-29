-- Dropar para recriar, já que estamos no começo da migração.
DROP TABLE IF EXISTS public.beneficios CASCADE;
DROP TABLE IF EXISTS public.beneficio_cadastros CASCADE;
DROP TABLE IF EXISTS public.historicos CASCADE;

-- 1. Tabela de Históricos Contábeis
CREATE TABLE public.historicos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, codigo)
);

ALTER TABLE public.historicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Isolamento por tenant na tabela historicos" 
    ON public.historicos FOR ALL 
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- 2. Tabela de Cadastro de Benefícios
CREATE TABLE public.beneficio_cadastros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    conta_deb VARCHAR(50) NOT NULL,
    conta_cred VARCHAR(50) NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, codigo)
);

ALTER TABLE public.beneficio_cadastros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Isolamento por tenant na tabela beneficio_cadastros" 
    ON public.beneficio_cadastros FOR ALL 
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- 3. Tabela de Valores Mensais dos Benefícios
CREATE TABLE public.beneficios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    competencia_id UUID NOT NULL REFERENCES public.competencias(id) ON DELETE CASCADE,
    matricula VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    versao INT DEFAULT 1,
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, competencia_id, matricula)
);

ALTER TABLE public.beneficios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Isolamento por tenant na tabela beneficios" 
    ON public.beneficios FOR ALL 
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

CREATE INDEX idx_beneficios_comp ON public.beneficios(tenant_id, competencia_id);
