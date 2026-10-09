import { NextRequest, NextResponse } from 'next/server';
import type { Sessao } from './types';

export const ACCESS_COOKIE = 'financas_access';
export const REFRESH_COOKIE = 'financas_refresh';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const refreshes = new Map<string, Promise<Sessao>>();

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function expireSession(response: NextResponse) {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
    response.cookies.set(name, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
  }
  return response;
}

function saveSession(response: NextResponse, session: Sessao) {
  // Apenas o prazo é lido do JWT. A autenticação é sempre validada pela API NestJS.
  let maxAge = 604800;
  try {
    const { exp } = JSON.parse(
      Buffer.from(session.refreshToken.split('.')[1], 'base64url').toString(),
    );
    if (typeof exp === 'number')
      maxAge = Math.max(0, exp - Math.floor(Date.now() / 1000));
  } catch {
    /* O prazo padrão também funciona com tokens opacos. */
  }
  const options = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
  response.cookies.set(ACCESS_COOKIE, session.accessToken, options);
  response.cookies.set(REFRESH_COOKIE, session.refreshToken, options);
  return response;
}

async function upstream(
  path: string,
  method: string,
  body?: string,
  accessToken?: string,
) {
  const base = (process.env.API_URL || 'http://localhost:3000').replace(
    /\/+$/,
    '',
  );
  return fetch(`${base}/${path}`, {
    method,
    body,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
  });
}

class RefreshError extends Error {
  constructor(public status: number) {
    super('Falha ao renovar sessão');
  }
}

function validSession(value: unknown): value is Sessao {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<Sessao>;
  return (
    typeof session.accessToken === 'string' &&
    typeof session.refreshToken === 'string' &&
    !!session.usuario
  );
}

async function refreshSession(token: string): Promise<Sessao> {
  const existing = refreshes.get(token);
  if (existing) return existing;
  const pending = (async () => {
    const response = await upstream(
      'auth/refresh',
      'POST',
      JSON.stringify({ refreshToken: token }),
    );
    if (!response.ok) throw new RefreshError(response.status);
    const session: unknown = await response.json();
    if (!validSession(session)) throw new RefreshError(502);
    return session;
  })();
  refreshes.set(token, pending);
  // Compartilha a rotação entre requisições paralelas no mesmo processo.
  pending.then(
    () => {
      setTimeout(() => refreshes.delete(token), 10000).unref();
    },
    () => {
      refreshes.delete(token);
    },
  );
  return pending;
}

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    // O Next.js pode normalizar nextUrl para localhost no desenvolvimento.
    // Host preserva o endereço usado pelo navegador, incluindo a porta.
    const host = request.headers.get('host');
    const expectedOrigin = host
      ? new URL(`${request.nextUrl.protocol}//${host}`).origin
      : request.nextUrl.origin;
    return new URL(origin).origin === expectedOrigin;
  } catch {
    return false;
  }
}

function allowed(path: string[], method: string) {
  const [resource, id] = path;
  if (path.length === 3)
    return (
      resource === 'contas' &&
      UUID.test(id) &&
      ['valor', 'dados'].includes(path[2]) &&
      method === 'PATCH'
    );
  if (path.length === 2 && resource === 'auth') {
    return id === 'me'
      ? method === 'GET'
      : ['login', 'registrar', 'logout'].includes(id) && method === 'POST';
  }
  if (resource === 'previsao') return path.length === 1 && method === 'GET';
  if (!['contas', 'receitas', 'formas-pagamento'].includes(resource))
    return false;
  if (path.length === 1) return ['GET', 'POST'].includes(method);
  if (path.length !== 2 || !UUID.test(id)) return false;
  return resource === 'contas'
    ? ['GET', 'POST', 'PATCH', 'DELETE'].includes(method)
    : ['GET', 'PATCH', 'DELETE'].includes(method);
}

export async function handleBackend(request: NextRequest, path: string[]) {
  const method = request.method;
  if (!allowed(path, method))
    return json({ message: 'Rota não encontrada.' }, 404);
  if (method !== 'GET' && !sameOrigin(request)) {
    return json({ message: 'Origem da requisição não permitida.' }, 403);
  }
  const route = path.join('/');
  const query = new URLSearchParams();
  if (
    (['contas', 'receitas', 'previsao'].includes(path[0]) &&
      method === 'GET') ||
    (path[0] === 'contas' && method === 'POST' && path.length === 2)
  ) {
    const meses = request.nextUrl.searchParams.getAll('mes');
    if (meses.length > 1)
      return json({ message: 'Informe somente um mês de referência.' }, 400);
    if (meses.length === 1) query.set('mes', meses[0]);
  }
  const upstreamRoute = query.size ? `${route}?${query}` : route;
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  try {
    if (route === 'auth/logout') {
      // Só confirma a saída depois de revogar o refresh token na API.
      if (refreshToken) {
        const response = await upstream(
          route,
          'POST',
          JSON.stringify({ refreshToken }),
        );
        if (!response.ok)
          return json(
            { message: 'Não foi possível sair agora. Tente novamente.' },
            502,
          );
      }
      return expireSession(
        new NextResponse(null, {
          status: 204,
          headers: { 'Cache-Control': 'no-store' },
        }),
      );
    }

    let body: string | undefined;
    if (['POST', 'PATCH'].includes(method)) {
      const text = await request.text();
      if (text.length > 16384)
        return json({ message: 'Requisição muito grande.' }, 413);
      if (text) {
        try {
          body = JSON.stringify(JSON.parse(text));
        } catch {
          return json({ message: 'Dados inválidos.' }, 400);
        }
      }
    }

    if (route === 'auth/login' || route === 'auth/registrar') {
      const response = await upstream(route, method, body);
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok)
        return json(
          payload || { message: 'Não foi possível entrar.' },
          response.status,
        );
      if (!validSession(payload))
        return json({ message: 'Resposta inválida da API.' }, 502);
      return saveSession(json(payload.usuario, response.status), payload);
    }

    if (!accessToken && !refreshToken)
      return expireSession(
        json({ message: 'Faça login para continuar.' }, 401),
      );
    let renewed: Sessao | undefined;
    let response: Response;
    if (accessToken) {
      response = await upstream(upstreamRoute, method, body, accessToken);
    } else {
      response = new Response(null, { status: 401 });
    }
    if (response.status === 401 && refreshToken) {
      renewed = await refreshSession(refreshToken);
      response = await upstream(
        upstreamRoute,
        method,
        body,
        renewed.accessToken,
      );
    }
    const result =
      response.status === 204
        ? new NextResponse(null, {
            status: 204,
            headers: { 'Cache-Control': 'no-store' },
          })
        : json(
            await response
              .json()
              .catch(() => ({ message: 'Resposta inválida da API.' })),
            response.status,
          );
    if (response.status === 401) return expireSession(result);
    return renewed ? saveSession(result, renewed) : result;
  } catch (error) {
    if (
      error instanceof RefreshError &&
      [400, 401, 403].includes(error.status)
    ) {
      return expireSession(
        json({ message: 'Sua sessão expirou. Entre novamente.' }, 401),
      );
    }
    return json(
      {
        message:
          'Não foi possível conectar à API. Verifique se ela está em execução e tente novamente.',
      },
      502,
    );
  }
}
