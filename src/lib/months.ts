export const MES_REGEX = /^(19\d{2}|[2-9]\d{3})-(0[1-9]|1[0-2])$/;

export function mesAtual(data = new Date()): string {
  const partes = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Cuiaba',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(data);
  return `${partes.find((p) => p.type === 'year')!.value}-${partes.find((p) => p.type === 'month')!.value}`;
}

export function dataHoje(data = new Date()): string {
  const partes = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Cuiaba',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(data);
  return `${partes.find((p) => p.type === 'year')!.value}-${partes.find((p) => p.type === 'month')!.value}-${partes.find((p) => p.type === 'day')!.value}`;
}

export function mesSelecionado(valor?: string | string[]): string {
  return typeof valor === 'string' && MES_REGEX.test(valor)
    ? valor
    : mesAtual();
}

export function somarMeses(mes: string, quantidade: number): string {
  const [ano, numero] = mes.split('-').map(Number);
  const indice = ano * 12 + numero - 1 + quantidade;
  return `${Math.floor(indice / 12)}-${String((indice % 12) + 1).padStart(2, '0')}`;
}

export function rotuloMes(mes: string): string {
  const [ano, numero] = mes.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(ano, numero - 1, 1)));
}
