import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { test } from 'node:test';

// API efêmera e isolada: não consulta nem altera o banco de dados real.
test(
  'Next.js em produção: páginas, sessão e operações via proxy',
  { timeout: 60000 },
  async () => {
    const usuario = {
      id: 1,
      nome: 'Pessoa Teste',
      login: 'teste',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const session = {
      accessToken: 'smoke-access',
      refreshToken: 'smoke-refresh',
      tokenType: 'Bearer',
      usuario,
    };
    const contas = [];
    const formas = [];
    const pagamentos = new Map();
    const apresentarConta = (item, mes) => {
      const forma = formas.find(
        (method) => method.id === item.formaPagamentoId,
      );
      return {
        ...item,
        mes: mes || item.mesReferencia,
        pago: pagamentos.get(item.id)?.has(mes || item.mesReferencia) || false,
        formaPagamentoId: item.formaPagamentoId || null,
        formaPagamento: forma ? { id: forma.id, nome: forma.nome } : null,
      };
    };
    const mock = createServer(async (req, res) => {
      try {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const text = Buffer.concat(chunks).toString();
        const body = text ? JSON.parse(text) : {};
        let value = null;
        let status = 200;
        const url = new URL(req.url, 'http://mock');
        const [resource, id, subresource] = url.pathname.slice(1).split('/');
        const mes = url.searchParams.get('mes');
        if (resource === 'auth' && ['login', 'registrar'].includes(id)) {
          value = session;
          status = id === 'registrar' ? 201 : 200;
        } else if (req.url === '/auth/logout') {
          status = 204;
        } else {
          assert.equal(req.headers.authorization, 'Bearer smoke-access');
          if (req.url === '/auth/me') value = usuario;
          else {
            const collection = resource === 'contas' ? contas : formas;
            if (!id && req.method === 'GET')
              value =
                resource === 'contas'
                  ? collection
                      .filter(
                        (item) =>
                          !mes ||
                          item.recorrencia ||
                          item.mesReferencia === mes,
                      )
                      .map((item) => apresentarConta(item, mes))
                  : collection;
            if (!id && req.method === 'POST') {
              value = {
                id: crypto.randomUUID(),
                ...body,
                createdAt: new Date().toISOString(),
                pago: false,
                dataHoraPagamento: null,
                mesReferencia: body.mes || '2026-10',
                mes: body.mes || '2026-10',
                recorrencia: body.recorrencia || false,
                parcela: body.parcela || 1,
                parcelaAtual: body.recorrencia ? null : 1,
              };
              collection.push(value);
              if (resource === 'contas') value = apresentarConta(value, mes);
              status = 201;
            }
            if (id) {
              const index = collection.findIndex((item) => item.id === id);
              assert.notEqual(index, -1);
              if (req.method === 'DELETE') {
                value = collection.splice(index, 1)[0];
                if (resource === 'formas-pagamento') {
                  for (const conta of contas) {
                    if (conta.formaPagamentoId === id)
                      conta.formaPagamentoId = null;
                  }
                }
                if (resource === 'contas') status = 204;
              } else if (req.method === 'PATCH') {
                Object.assign(collection[index], body);
                value = collection[index];
                if (resource === 'contas') {
                  const conta = apresentarConta(value, mes);
                  value =
                    subresource === 'valor'
                      ? { id: conta.id, valor: conta.valor }
                      : {
                          id: conta.id,
                          formaPagamentoId: conta.formaPagamentoId,
                          formaPagamento: conta.formaPagamento,
                        };
                }
              } else if (req.method === 'POST') {
                const meses = pagamentos.get(id) || new Set();
                meses.add(mes || collection[index].mesReferencia);
                pagamentos.set(id, meses);
                status = 204;
              } else value = collection[index];
            }
          }
        }
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(status === 204 ? undefined : JSON.stringify(value));
      } catch {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Falha no mock de teste' }));
      }
    });
    mock.listen(0, '127.0.0.1');
    await once(mock, 'listening');
    const mockPort = mock.address().port;
    const portProbe = createServer();
    portProbe.listen(0, '127.0.0.1');
    await once(portProbe, 'listening');
    const port = portProbe.address().port;
    await new Promise((done) => portProbe.close(done));
    const base = `http://localhost:${port}`;
    const child = spawn(
      process.execPath,
      [
        resolve('node_modules/next/dist/bin/next'),
        'start',
        '--port',
        String(port),
        '--hostname',
        '127.0.0.1',
      ],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          API_URL: `http://127.0.0.1:${mockPort}`,
          NEXT_TELEMETRY_DISABLED: '1',
        },
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    let logs = '';
    child.stdout.on('data', (chunk) => {
      logs += chunk;
    });
    child.stderr.on('data', (chunk) => {
      logs += chunk;
    });

    try {
      let ready = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        try {
          const response = await fetch(`${base}/login`);
          if (response.ok) {
            ready = true;
            break;
          }
        } catch {
          /* Aguarda o servidor de teste. */
        }
        if (child.exitCode !== null) break;
        await new Promise((done) => setTimeout(done, 100));
      }
      assert.ok(ready, logs);
      assert.equal((await fetch(`${base}/cadastro`)).status, 200);
      const protectedPage = await fetch(`${base}/contas`, {
        redirect: 'manual',
      });
      assert.equal(protectedPage.status, 307);
      assert.equal(protectedPage.headers.get('location'), '/login');

      const login = await fetch(`${base}/api/backend/auth/login`, {
        method: 'POST',
        headers: { Origin: base, 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: 'teste', senha: 'senha-teste' }),
      });
      assert.equal(login.status, 200);
      assert.deepEqual(await login.json(), usuario);
      const cookie = login.headers
        .getSetCookie()
        .map((entry) => entry.split(';')[0])
        .join('; ');
      assert.match(cookie, /financas_refresh=smoke-refresh/);
      const call = (path, method = 'GET', body) =>
        fetch(`${base}/api/backend${path}`, {
          method,
          headers: {
            Origin: base,
            Cookie: cookie,
            'Content-Type': 'application/json',
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
      assert.deepEqual(await (await call('/auth/me')).json(), usuario);
      for (const path of ['/visao-geral', '/contas', '/formas-pagamento']) {
        assert.equal(
          (await fetch(`${base}${path}`, { headers: { Cookie: cookie } }))
            .status,
          200,
        );
      }
      const created = await call('/contas', 'POST', {
        nome: 'Internet',
        valor: 129.9,
      });
      assert.equal(created.status, 201);
      const conta = await created.json();
      assert.equal((await (await call('/contas')).json()).length, 1);
      assert.equal((await call(`/contas/${conta.id}`, 'POST')).status, 204);
      assert.equal((await (await call('/contas')).json())[0].pago, true);
      assert.equal((await call(`/contas/${conta.id}`, 'DELETE')).status, 204);
      assert.deepEqual(await (await call('/contas')).json(), []);

      // Contrato mensal pelo Next em produção, sem dados no banco real.
      const recorrente = await (
        await call('/contas', 'POST', {
          nome: 'Recorrente',
          valor: 100,
          mes: '2026-12',
          recorrencia: true,
          parcela: 1,
        })
      ).json();
      const janeiro = await (await call('/contas?mes=2027-01')).json();
      assert.equal(janeiro[0].mes, '2027-01');
      assert.equal(janeiro[0].pago, false);
      assert.equal(
        (await call(`/contas/${recorrente.id}?mes=2027-01`, 'POST')).status,
        204,
      );
      assert.equal(
        (await (await call('/contas?mes=2027-01')).json())[0].pago,
        true,
      );
      assert.equal(
        (await (await call('/contas?mes=2027-02')).json())[0].pago,
        false,
      );
      assert.equal(
        (await call(`/contas/${recorrente.id}`, 'DELETE')).status,
        204,
      );

      // Regressão: acesso por IP não pode ser confundido com outra origem.
      const ipBase = `http://127.0.0.1:${port}`;
      const ipCreated = await fetch(`${ipBase}/api/backend/contas`, {
        method: 'POST',
        headers: {
          Origin: ipBase,
          Cookie: cookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome: 'Conta pelo IP', valor: 75.5 }),
      });
      assert.equal(ipCreated.status, 201);
      const ipConta = await ipCreated.json();
      assert.equal(ipConta.nome, 'Conta pelo IP');
      assert.equal((await call(`/contas/${ipConta.id}`, 'DELETE')).status, 204);

      const method = await (
        await call('/formas-pagamento', 'POST', { nome: 'Pix' })
      ).json();
      const contaVinculadaResponse = await call('/contas', 'POST', {
        nome: 'Internet com Pix',
        valor: 100,
        mes: '2026-12',
        recorrencia: true,
        formaPagamentoId: method.id,
      });
      assert.equal(contaVinculadaResponse.status, 201);
      const contaVinculada = await contaVinculadaResponse.json();
      assert.equal(contaVinculada.formaPagamentoId, method.id);
      assert.deepEqual(contaVinculada.formaPagamento, {
        id: method.id,
        nome: 'Pix',
      });
      const changed = await call(`/formas-pagamento/${method.id}`, 'PATCH', {
        nome: 'Pix pessoal',
      });
      assert.equal((await changed.json()).nome, 'Pix pessoal');
      assert.deepEqual(
        (await (await call('/contas?mes=2027-01')).json())[0].formaPagamento,
        { id: method.id, nome: 'Pix pessoal' },
      );
      assert.equal(
        (await call(`/contas/${contaVinculada.id}?mes=2027-01`, 'POST')).status,
        204,
      );
      const outraForma = await (
        await call('/formas-pagamento', 'POST', { nome: 'Cartão' })
      ).json();
      const novoValor = await call(
        `/contas/${contaVinculada.id}/valor`,
        'PATCH',
        { valor: 149.9 },
      );
      assert.equal(novoValor.status, 200);
      assert.deepEqual(await novoValor.json(), {
        id: contaVinculada.id,
        valor: 149.9,
      });
      const [aposValor] = await (await call('/contas?mes=2027-01')).json();
      assert.equal(aposValor.valor, 149.9);
      assert.equal(aposValor.pago, true);
      assert.equal(aposValor.formaPagamentoId, method.id);
      const alterada = await call(`/contas/${contaVinculada.id}`, 'PATCH', {
        formaPagamentoId: outraForma.id,
      });
      assert.equal(alterada.status, 200);
      assert.deepEqual(await alterada.json(), {
        id: contaVinculada.id,
        formaPagamentoId: outraForma.id,
        formaPagamento: { id: outraForma.id, nome: 'Cartão' },
      });
      const [aposTroca] = await (await call('/contas?mes=2027-01')).json();
      assert.equal(aposTroca.formaPagamentoId, outraForma.id);
      assert.equal(aposTroca.pago, true);
      const removida = await call(`/contas/${contaVinculada.id}`, 'PATCH', {
        formaPagamentoId: null,
      });
      assert.equal(removida.status, 200);
      assert.deepEqual(await removida.json(), {
        id: contaVinculada.id,
        formaPagamentoId: null,
        formaPagamento: null,
      });
      assert.equal(
        (
          await call(`/contas/${contaVinculada.id}`, 'PATCH', {
            formaPagamentoId: method.id,
          })
        ).status,
        200,
      );
      assert.equal(
        (await call(`/formas-pagamento/${outraForma.id}`, 'DELETE')).status,
        200,
      );
      assert.equal(
        (await call(`/formas-pagamento/${method.id}`, 'DELETE')).status,
        200,
      );
      assert.deepEqual(await (await call('/formas-pagamento')).json(), []);
      const [contaSemForma] = await (await call('/contas?mes=2027-01')).json();
      assert.equal(contaSemForma.id, contaVinculada.id);
      assert.equal(contaSemForma.formaPagamentoId, null);
      assert.equal(contaSemForma.formaPagamento, null);
      assert.equal(contaSemForma.pago, true);
      assert.equal(
        (await call(`/contas/${contaVinculada.id}`, 'DELETE')).status,
        204,
      );
      const logout = await call('/auth/logout', 'POST');
      assert.equal(logout.status, 204);
      assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
    } finally {
      child.kill();
      mock.closeAllConnections();
      await new Promise((done) => mock.close(done));
    }
  },
);
