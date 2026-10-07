import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PaymentMethodField } from '../src/components/payment-method-field';
import { AccountsTable } from '../src/components/accounts-table';
import type { Conta, FormaPagamento } from '../src/lib/types';

const forma: FormaPagamento = {
  id: '84933758-d41a-45cf-9116-62c2b7ccfb43',
  nome: 'Pix pessoal',
  createdAt: '2026-10-01T12:00:00Z',
  updatedAt: '2026-10-01T12:00:00Z',
};
const props = {
  methods: [forma],
  loading: false,
  error: null,
  busy: false,
  onRetry: () => {},
};

test('seletor opcional envia UUID e oferece conta sem vínculo', () => {
  const html = renderToStaticMarkup(createElement(PaymentMethodField, props));
  assert.match(html, /name="formaPagamentoId"/);
  assert.match(html, new RegExp(`value="${forma.id}"`));
  assert.match(html, /Pix pessoal/);
  assert.match(html, /value="" selected=""/);
  assert.match(html, /Não informada/);
  assert.match(html, /aria-describedby=/);
  assert.match(html, /todos os meses e parcelas/);
  assert.doesNotMatch(html, /required=""|disabled=""/);
});

test('sem formas cadastradas, orienta o cadastro e permite continuar', () => {
  const html = renderToStaticMarkup(
    createElement(PaymentMethodField, { ...props, methods: [] }),
  );
  assert.match(html, /Nenhuma forma cadastrada/);
  assert.match(html, /href="\/formas-pagamento"/);
  assert.match(html, /continue sem informar/);
  assert.doesNotMatch(html, /disabled=""/);
});

test('carregamento e salvamento desabilitam somente a seleção', () => {
  const carregando = renderToStaticMarkup(
    createElement(PaymentMethodField, {
      ...props,
      methods: null,
      loading: true,
    }),
  );
  assert.match(carregando, /Carregando formas de pagamento/);
  assert.match(carregando, /disabled=""/);
  const salvando = renderToStaticMarkup(
    createElement(PaymentMethodField, { ...props, busy: true }),
  );
  assert.match(salvando, /disabled=""/);
});

test('falha de carregamento oferece nova tentativa sem enviar opções antigas', () => {
  const html = renderToStaticMarkup(
    createElement(PaymentMethodField, { ...props, error: 'Falha de conexão' }),
  );
  assert.match(html, /role="alert"/);
  assert.match(html, /Falha de conexão/);
  assert.match(html, /Tentar carregar formas novamente/);
  assert.match(html, /type="button"/);
  assert.match(html, /sem forma de pagamento/);
  assert.doesNotMatch(html, /Pix pessoal/);
});

test('tabela exibe nome vinculado e identifica contas sem forma', () => {
  const conta: Conta = {
    id: 'conta-id',
    nome: 'Internet',
    valor: 100,
    pago: false,
    mes: '2026-10',
    mesReferencia: '2026-10',
    mesFim: null,
    recorrencia: true,
    parcela: 1,
    parcelaAtual: null,
    dataHoraPagamento: null,
    createdAt: forma.createdAt,
    updatedAt: forma.updatedAt,
    formaPagamentoId: forma.id,
    formaPagamento: { id: forma.id, nome: forma.nome },
  };
  const html = renderToStaticMarkup(
    createElement(AccountsTable, {
      contas: [
        conta,
        {
          ...conta,
          id: 'sem-forma',
          formaPagamentoId: null,
          formaPagamento: null,
        },
      ],
    }),
  );
  assert.match(html, /FORMA DE PAGAMENTO/);
  assert.match(html, /Pix pessoal/);
  assert.match(html, /Não informada/);
});
