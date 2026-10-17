export interface TelegramStatus {
  conectado: boolean;
  criadoEm: string | null;
}
export interface TelegramLink {
  url: string;
  expiresAt: string;
}
export function validarLinkTelegram(value: unknown, now: number): TelegramLink {
  if (!value || typeof value !== 'object')
    throw new Error('Link de conexão inválido. Tente novamente.');
  const link = value as Partial<TelegramLink>;
  try {
    if (typeof link.url !== 'string' || typeof link.expiresAt !== 'string')
      throw new Error();
    const url = new URL(link.url);
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 't.me' ||
      url.port ||
      url.username ||
      url.password ||
      url.hash ||
      !/^\/[A-Za-z0-9_]+$/.test(url.pathname) ||
      !/^[A-Za-z0-9_-]{43}$/.test(url.searchParams.get('start') || '') ||
      !Number.isFinite(Date.parse(link.expiresAt)) ||
      Date.parse(link.expiresAt) <= now
    )
      throw new Error();
    return { url: link.url, expiresAt: link.expiresAt };
  } catch {
    throw new Error('Link de conexão inválido ou expirado. Gere outro link.');
  }
}
