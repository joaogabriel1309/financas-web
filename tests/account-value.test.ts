import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  lerValorConta,
  rascunhoValorConta,
  salvarValorConta,
  aplicarValorConta,
  MAX_VALOR_CONTA,
} from '../src/lib/account-value';
import {
  AccountValueDisplay,
  AccountValueEditor,
} from '../src/components/account-value-editor';
import { AccountsTable } from '../src/components/accounts-table';
import type { Conta } from '../src/lib/types';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
const conta: Conta = {
  id: 'ef53c8b1-17a6-4a2d-8837-009706243954',
  nome: 'Internet',
  valor: '129.90',
  pago: true,
  mes: '2026-10',
  mesReferencia: '2026-10',
  mesFim: null,
  recorrencia: true,
  parcela: 1,
  parcelaAtual: null,
  dataHoraPagamento: '2026-10-02T12:00:00Z',
  createdAt: '2026-10-01T12:00:00Z',
  updatedAt: '2026-10-01T12:00:00Z',
  formaPagamentoId: null,
  formaPagamento: null,
};

test('valor aceita vírgula, ponto decimal, formato brasileiro com milhar e zero', () => {
  for (const [texto, valor] of [
    ['0', 0],
    ['0,00', 0],
    ['129,90', 129.9],
    ['129.90', 129.9],
    ['1.234,56', 1234.56],
    [' 80,5 ', 80.5],
    ['9999999999999,99', MAX_VALOR_CONTA],
  ] as const)
    assert.equal(lerValorConta(texto), valor);
  assert.equal(rascunhoValorConta('129.9'), '129,90');
});

test('não arredonda entrada inválida nem transforma campo vazio em zero', () => {
  for (const texto of [
    '',
    ' ',
    '-1',
    '1.234',
    '0,001',
    '1e3',
    'Infinity',
    'NaN',
    '1,2,3',
    '1.23,45',
    '10000000000000',
    '1,234.56',
  ])
    assert.equal(lerValorConta(texto), null, texto);
});

test('dois cliques e teclado abrem a edição sem botão de lápis', () => {
  let edicoes = 0;
  const elemento = AccountValueDisplay({
    conta,
    disabled: false,
    onEdit: () => {
      edicoes++;
    },
  }) as ReactElement<{
    children: ReactElement<{
      onDoubleClick?: () => void;
      onClick?: () => void;
      onKeyDown?: (event: { key: string; preventDefault: () => void }) => void;
    }>;
  }>;
  const valor = elemento.props.children;
  valor.props.onDoubleClick!();
  for (const key of ['Enter', ' ', 'F2']) {
    let prevenido = false;
    valor.props.onKeyDown!({
      key,
      preventDefault: () => {
        prevenido = true;
      },
    });
    assert.equal(prevenido, true);
  }
  valor.props.onKeyDown!({
    key: 'ArrowLeft',
    preventDefault: () => assert.fail('Não deve capturar setas'),
  });
  assert.equal(edicoes, 4);
  const html = renderToStaticMarkup(elemento);
  assert.doesNotMatch(html, /value-edit-trigger|Abrir edição do valor/);
});

test('editor apresenta valor atual, campo decimal, salvar, cancelar e bloqueio durante gravação', () => {
  const props = {
    conta,
    busy: false,
    onSave: async () => true,
    onCancel: () => {},
  };
  const html = renderToStaticMarkup(createElement(AccountValueEditor, props));
  assert.match(html, /value="129,90"/);
  assert.match(html, /inputMode="decimal"/);
  assert.match(html, /Novo valor de Internet em reais/);
  assert.match(html, /Salvar valor de Internet/);
  assert.match(html, /Cancelar edição de valor de Internet/);
  assert.match(html, /Enter salva · Esc cancela/);
  assert.doesNotMatch(html, /disabled=""/);
  const busy = renderToStaticMarkup(
    createElement(AccountValueEditor, { ...props, busy: true }),
  );
  assert.match(busy, /disabled=""/);
  assert.match(busy, /role="status">Salvando/);
});

test('tabela abre editor somente na linha escolhida e mantém visão geral sem edição', () => {
  const html = renderToStaticMarkup(
    createElement(AccountsTable, {
      contas: [conta],
      editingValueId: conta.id,
      onValueEdit: () => {},
      onValueSave: async () => true,
      onValueCancel: () => {},
      interactionsDisabled: true,
      onDelete: () => {},
    }),
  );
  assert.match(html, /account-value-editor/);
  assert.match(html, /disabled=""/);
  const leitura = renderToStaticMarkup(
    createElement(AccountsTable, { contas: [conta] }),
  );
  assert.doesNotMatch(
    leitura,
    /account-value-editor|editable-value|value-edit-trigger/,
  );
});

test('salva número por PATCH no endpoint de valor e usa Decimal retornado pela API', async () => {
  globalThis.fetch = async (input, options) => {
    assert.equal(input, `/api/backend/contas/${conta.id}/valor`);
    assert.equal(options?.method, 'PATCH');
    assert.deepEqual(JSON.parse(options?.body as string), { valor: 149.9 });
    return Response.json({ id: conta.id, valor: '149.90' });
  };
  assert.deepEqual(await salvarValorConta(conta.id, 149.9), {
    id: conta.id,
    valor: '149.90',
  });
});

test('erro de gravação preserva valor anterior', async () => {
  globalThis.fetch = async () =>
    Response.json({ message: 'Conta não encontrada.' }, { status: 404 });
  await assert.rejects(salvarValorConta(conta.id, 10), {
    name: 'ApiError',
    status: 404,
  });
  assert.equal(conta.valor, '129.90');
});

test('atualiza valor e total sem afetar vínculo, status, data ou outras linhas', () => {
  const outra = { ...conta, id: 'outra', valor: 10 };
  const novo = {
    id: conta.id,
    valor: '149.90',
    pago: false,
    formaPagamentoId: 'intruso',
  };
  const contas = aplicarValorConta([conta, outra], novo)!;
  assert.deepEqual(contas[0], { ...conta, valor: '149.90' });
  assert.equal(contas[1], outra);
  assert.equal(conta.valor, '129.90');
  assert.equal(
    contas.reduce(
      (soma, item) => soma + Math.round(Number(item.valor) * 100),
      0,
    ),
    15990,
  );
  assert.equal(aplicarValorConta(null, novo), null);
});
