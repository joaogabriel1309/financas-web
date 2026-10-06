import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { NextRequest } from 'next/server';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  handleBackend,
} from '../src/lib/backend';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

const usuario = {
  id: 1,
  nome: 'Pessoa Teste',
  login: 'teste',
  createdAt: '2026-01-01T12:00:00.000Z',
  updatedAt: '2026-01-01T12:00:00.000Z',
};
const session = {
  accessToken: 'new-access',
  refreshToken: 'new-refresh',
  tokenType: 'Bearer',
  usuario,
};
const uuid = '84933758-d41a-45cf-9116-62c2b7ccfb43';

function request(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    access?: string;
    refresh?: string;
    origin?: string;
    host?: string;
  } = {},
) {
  const method = options.method || 'GET';
  const cookies = [
    options.access && `${ACCESS_COOKIE}=${options.access}`,
    options.refresh && `${REFRESH_COOKIE}=${options.refresh}`,
  ]
    .filter(Boolean)
    .join('; ');
  return new NextRequest(`http://localhost:3001/api/backend/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies,
      ...(options.host ? { Host: options.host } : {}),
      ...(method !== 'GET'
        ? { Origin: options.origin || 'http://localhost:3001' }
        : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
}

test('login salva tokens HttpOnly e responde somente com o usuário', async () => {
  globalThis.fetch = async (_input, options) => {
    assert.equal(options?.method, 'POST');
    assert.deepEqual(JSON.parse(options?.body as string), {
      login: 'teste',
      senha: 'senha-teste',
    });
    return Response.json(session);
  };
  const response = await handleBackend(
    request('auth/login', {
      method: 'POST',
      body: { login: 'teste', senha: 'senha-teste' },
    }),
    ['auth', 'login'],
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), usuario);
  assert.match(response.headers.get('set-cookie') || '', /HttpOnly/i);
  assert.match(response.headers.get('set-cookie') || '', /SameSite=lax/i);
  assert.equal(response.cookies.get(ACCESS_COOKIE)?.value, 'new-access');
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('cadastro mantém o status 201 sem expor tokens', async () => {
  globalThis.fetch = async () => Response.json(session, { status: 201 });
  const response = await handleBackend(
    request('auth/registrar', {
      method: 'POST',
      body: { nome: 'Teste', login: 'teste', senha: 'senha-teste' },
    }),
    ['auth', 'registrar'],
  );
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), usuario);
});

test('rotas desconhecidas e mutações de outra origem não chegam à API', async () => {
  globalThis.fetch = async () => {
    assert.fail('Não deve consultar a API');
  };
  assert.equal((await handleBackend(request('admin'), ['admin'])).status, 404);
  assert.equal(
    (
      await handleBackend(request('auth/refresh', { method: 'POST' }), [
        'auth',
        'refresh',
      ])
    ).status,
    404,
  );
  assert.equal(
    (
      await handleBackend(request('contas/1', { method: 'DELETE' }), [
        'contas',
        '1',
      ])
    ).status,
    404,
  );
  assert.equal(
    (
      await handleBackend(
        request('contas', {
          method: 'POST',
          origin: 'https://outro-site.example',
        }),
        ['contas'],
      )
    ).status,
    403,
  );
});

test('cadastro aceita o Host real quando nextUrl foi normalizado para localhost', async () => {
  globalThis.fetch = async (_input, options) => {
    assert.equal(options?.method, 'POST');
    assert.deepEqual(JSON.parse(options?.body as string), {
      nome: 'Internet',
      valor: 129.9,
    });
    return Response.json(
      { id: uuid, nome: 'Internet', valor: '129.90', pago: false },
      { status: 201 },
    );
  };
  for (const host of ['127.0.0.1:3001', '192.168.1.10:3001']) {
    const response = await handleBackend(
      request('contas', {
        method: 'POST',
        host,
        origin: `http://${host}`,
        access: 'access-valido',
        body: { nome: 'Internet', valor: 129.9 },
      }),
      ['contas'],
    );
    assert.equal(response.status, 201);
    assert.equal((await response.json()).nome, 'Internet');
  }
});

test('cadastro rejeita origem com host, porta ou protocolo diferentes', async () => {
  globalThis.fetch = async () => {
    assert.fail('Não deve consultar a API');
  };
  for (const origin of [
    'http://localhost:3001',
    'http://127.0.0.1:3002',
    'https://127.0.0.1:3001',
    'null',
  ]) {
    const response = await handleBackend(
      request('contas', {
        method: 'POST',
        host: '127.0.0.1:3001',
        origin,
        access: 'access-valido',
      }),
      ['contas'],
    );
    assert.equal(response.status, 403);
  }
});

test('sessão ausente retorna 401 e não consulta o backend', async () => {
  globalThis.fetch = async () => {
    assert.fail('Não deve consultar a API');
  };
  const response = await handleBackend(request('contas'), ['contas']);
  assert.equal(response.status, 401);
  assert.equal(response.cookies.get(REFRESH_COOKIE)?.value, '');
});

test('operações de contas encaminham UUID, Bearer e preservam 204', async () => {
  globalThis.fetch = async (input, options) => {
    assert.equal(String(input), `http://localhost:3000/contas/${uuid}`);
    assert.equal(options?.method, 'POST');
    assert.equal(
      new Headers(options?.headers).get('authorization'),
      'Bearer access-valido',
    );
    return new Response(null, { status: 204 });
  };
  const response = await handleBackend(
    request(`contas/${uuid}`, {
      method: 'POST',
      access: 'access-valido',
      refresh: 'refresh-valido',
    }),
    ['contas', uuid],
  );
  assert.equal(response.status, 204);
  assert.equal(await response.text(), '');
});

test('401 renova a sessão uma vez entre chamadas concorrentes e reenvia as requisições', async () => {
  let refreshCount = 0;
  let retryCount = 0;
  globalThis.fetch = async (input, options) => {
    if (String(input).endsWith('/auth/refresh')) {
      refreshCount++;
      assert.deepEqual(JSON.parse(options?.body as string), {
        refreshToken: 'refresh-concurrent',
      });
      await new Promise((resolve) => setTimeout(resolve, 25));
      return Response.json(session);
    }
    if (
      new Headers(options?.headers).get('authorization') === 'Bearer new-access'
    ) {
      retryCount++;
      return Response.json([]);
    }
    return Response.json({ message: 'Token expirado' }, { status: 401 });
  };
  const responses = await Promise.all([
    handleBackend(
      request('contas', { access: 'expired', refresh: 'refresh-concurrent' }),
      ['contas'],
    ),
    handleBackend(
      request('formas-pagamento', {
        access: 'expired',
        refresh: 'refresh-concurrent',
      }),
      ['formas-pagamento'],
    ),
  ]);
  assert.equal(refreshCount, 1);
  assert.equal(retryCount, 2);
  for (const response of responses) {
    assert.equal(response.status, 200);
    assert.equal(response.cookies.get(REFRESH_COOKIE)?.value, 'new-refresh');
  }
});

test('refresh revogado encerra a sessão, mas indisponibilidade preserva cookies', async () => {
  globalThis.fetch = async () =>
    Response.json({ message: 'Revogado' }, { status: 401 });
  const expired = await handleBackend(
    request('auth/me', { access: 'expired', refresh: 'refresh-revoked' }),
    ['auth', 'me'],
  );
  assert.equal(expired.status, 401);
  assert.equal(expired.cookies.get(REFRESH_COOKIE)?.value, '');

  globalThis.fetch = async (input) =>
    Response.json(
      {},
      { status: String(input).endsWith('/auth/refresh') ? 503 : 401 },
    );
  const unavailable = await handleBackend(
    request('auth/me', { access: 'expired', refresh: 'refresh-unavailable' }),
    ['auth', 'me'],
  );
  assert.equal(unavailable.status, 502);
  assert.equal(unavailable.headers.get('set-cookie'), null);
});

test('logout revoga o refresh token antes de apagar cookies', async () => {
  globalThis.fetch = async (input, options) => {
    assert.equal(String(input), 'http://localhost:3000/auth/logout');
    assert.deepEqual(JSON.parse(options?.body as string), {
      refreshToken: 'refresh-logout',
    });
    return new Response(null, { status: 204 });
  };
  const response = await handleBackend(
    request('auth/logout', { method: 'POST', refresh: 'refresh-logout' }),
    ['auth', 'logout'],
  );
  assert.equal(response.status, 204);
  assert.equal(response.cookies.get(REFRESH_COOKIE)?.value, '');
});

test('falha de rede retorna mensagem útil sem apagar a sessão', async () => {
  globalThis.fetch = async () => {
    throw new TypeError('fetch failed');
  };
  const response = await handleBackend(
    request('contas', { access: 'access-valido', refresh: 'refresh-network' }),
    ['contas'],
  );
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('set-cookie'), null);
  assert.match((await response.json()).message, /conectar à API/);
});
