export interface Usuario {
  id: number;
  nome: string;
  login: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sessao {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  usuario: Usuario;
}

export interface Conta {
  id: string;
  nome: string;
  icone?: string;
  valor: string | number;
  pago: boolean;
  mes: string;
  mesReferencia: string;
  mesFim: string | null;
  recorrencia: boolean;
  parcela: number;
  parcelaAtual: number | null;
  dataHoraPagamento: string | null;
  createdAt: string;
  updatedAt: string;
  formaPagamentoId: string | null;
  formaPagamento: Pick<FormaPagamento, 'id' | 'nome' | 'cor' | 'icone'> | null;
}

export interface FormaPagamento {
  id: string;
  nome: string;
  cor?: string;
  icone?: string;
  createdAt: string;
  updatedAt: string;
}
