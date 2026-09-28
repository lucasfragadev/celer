// ============================================================
// Domain Entities - Celer
// ============================================================

export type PapelCeler = 'master' | 'operador' | 'consulta';
export type SituacaoEmp = 'ativo' | 'afastado' | 'desligado';
export type StatusComp = 'aberta' | 'fechada';
export type ModoGerencial = 'rateio' | 'empregado' | 'rubrica' | 'projeto';

export interface Usuario {
  id: string;
  email: string;
  senha_hash: string;
  nome: string;
  admin_global: boolean;
  criado_em: Date;
}

export interface UsuarioPublico {
  id: string;
  email: string;
  nome: string;
  admin_global: boolean;
  criado_em: Date;
}

export interface Tenant {
  id: string;
  nome: string;
  cnpj: string | null;
  logo_url: string | null;
  sistema_contabil: string;
  ativo: boolean;
  criado_em: Date;
}

export interface Membership {
  user_id: string;
  tenant_id: string;
  papel: PapelCeler;
  permissoes: Record<string, boolean>;
  criado_em: Date;
}

export interface Empregado {
  id: string;
  tenant_id: string;
  matricula: string;
  nome: string;
  cargo: string | null;
  filial: string | null;
  situacao: SituacaoEmp;
  conta_g2: string | null;
}

export interface Rubrica {
  id: string;
  tenant_id: string;
  codigo: string;
  nome: string | null;
  conta_deb: string | null;
  conta_cred: string | null;
  historico: string | null;
  tipo: string | null;
}

export interface Projeto {
  id: string;
  tenant_id: string;
  codigo: string;
  nome: string;
  vigencia_ate: Date | null;
}

export interface ProjetoAnalitica {
  id: string;
  tenant_id: string;
  projeto_id: string;
  codigo: string;
  descricao: string | null;
}

export interface Gerencial {
  id: string;
  tenant_id: string;
  ordem: number;
  nome: string;
  modo: ModoGerencial;
  ativo: boolean;
}

export interface ContaGerencial {
  id: string;
  tenant_id: string;
  gerencial_ordem: number;
  codigo: string;
  nome: string;
  tipo: string | null;
  classificacao: string | null;
}

export interface Parametro {
  tenant_id: string;
  endereco: string | null;
  paleta: string;
  arredondamento_cent: number;
  atualizado_em: Date;
}

export interface Competencia {
  id: string;
  tenant_id: string;
  comp: string; // Ex: '2026/01'
  tipo_folha: string;
  status: StatusComp;
  fechada_em: Date | null;
  versao: number;
}

export interface Folha {
  competencia_id: string;
  tenant_id: string;
  payload: any;
  atualizado_em: Date;
}

export interface Rateio {
  id: string;
  tenant_id: string;
  competencia_id: string;
  matricula: string;
  payload: any;
  versao: number;
}

export interface Pagamento {
  id: string;
  tenant_id: string;
  competencia_id: string;
  obrigacao: string;
  pagador: string | null;
  data_pgto: Date | null;
  valor: number;
  criado_em: Date;
}

export interface Historico {
  id: string;
  tenant_id: string;
  codigo: string;
  descricao: string;
  criado_em: Date;
}

export interface BeneficioCadastro {
  id: string;
  tenant_id: string;
  codigo: string;
  nome: string;
  conta_deb: string;
  conta_cred: string;
  criado_em: Date;
}

export interface Beneficio {
  id: string;
  tenant_id: string;
  competencia_id: string;
  matricula: string;
  payload: any;
  versao: number;
  atualizado_em: Date;
}

export interface LoginInput {
  email: string;
  senha: string;
}

export interface LoginOutput {
  token: string;
  usuario: UsuarioPublico;
  tenants: Pick<Tenant, 'id' | 'nome' | 'logo_url'>[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
