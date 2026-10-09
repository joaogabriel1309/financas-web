import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  mesAtual,
  mesSelecionado,
  rotuloMes,
  somarMeses,
} from '../src/lib/months';
import { AccountsTable } from '../src/components/accounts-table';
import type { Conta } from '../src/lib/types';

test('mês atual usa Cuiabá na virada UTC e navegação atravessa o ano', () => {
  assert.equal(mesAtual(new Date('2026-11-01T02:00:00Z')), '2026-10');
  assert.equal(mesAtual(new Date('2026-11-01T04:00:00Z')), '2026-11');
  assert.equal(somarMeses('2026-12', 1), '2027-01');
  assert.equal(somarMeses('2027-01', -1), '2026-12');
  assert.equal(rotuloMes('2027-01'), 'janeiro de 2027');
});

test('parâmetros de mês inválidos ou repetidos usam o mês atual na página', () => {
  assert.equal(mesSelecionado('2027-02'), '2027-02');
  for (const valor of [
    '2026-00',
    '2026-13',
    '2026-1',
    '0000-01',
    '1899-12',
    ['2026-10', '2026-11'],
  ]) {
    assert.equal(mesSelecionado(valor), mesAtual());
  }
});

test('tabela apresenta competência e parcela atual com status independente', () => {
  const conta: Conta = {
    id: '84933758-d41a-45cf-9116-62c2b7ccfb43',
    nome: 'Compra',
    valor: 75.5,
    mes: '2027-01',
    mesReferencia: '2026-12',
    mesFim: '2027-02',
    parcela: 3,
    parcelaAtual: 2,
    recorrencia: false,
    pago: false,
    dataHoraPagamento: null,
    diaVencimento: null,
    dataVencimento: null,
    situacaoVencimento: 'em_aberto',
    createdAt: '2026-12-01T12:00:00Z',
    updatedAt: '2026-12-01T12:00:00Z',
    formaPagamentoId: null,
    formaPagamento: null,
  };
  const html = renderToStaticMarkup(
    createElement(AccountsTable, { contas: [conta] }),
  );
  assert.match(html, /Parcela 2 de 3/);
  assert.match(html, /janeiro de 2027/);
  assert.match(html, /Em aberto/);
  assert.doesNotMatch(html, /Pago em/);
  const recorrente = renderToStaticMarkup(
    createElement(AccountsTable, {
      contas: [
        {
          ...conta,
          recorrencia: true,
          parcela: 1,
          parcelaAtual: null,
          mesFim: null,
        },
      ],
    }),
  );
  assert.match(recorrente, /Recorrência mensal/);
  assert.doesNotMatch(recorrente, /Parcela/);
});
