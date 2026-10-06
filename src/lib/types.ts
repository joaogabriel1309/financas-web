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
  valor: string | number;
  pago: boolean;
  dataHoraPagamento: string | null;
  createdAt: string;
  updatedAt: string;
  formaPagamentoId: string | null;
}

export interface FormaPagamento {
  id: string;
  nome: string;
  createdAt: string;
  updatedAt: string;
}
