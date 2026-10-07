import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  createToastTimer,
  MAX_TOASTS,
  toastReducer,
  TOAST_DURATION,
  type Toast,
} from '../src/lib/toasts';
import { ToastCard, ToastProvider } from '../src/components/toast-provider';

function fakeClock() {
  let now = 0;
  let nextId = 0;
  const timers = new Map<
    ReturnType<typeof setTimeout>,
    { due: number; callback: () => void }
  >();
  return {
    now: () => now,
    schedule(callback: () => void, delay: number) {
      const id = ++nextId as unknown as ReturnType<typeof setTimeout>;
      timers.set(id, { due: now + delay, callback });
      return id;
    },
    cancel: (id: ReturnType<typeof setTimeout>) => {
      timers.delete(id);
    },
    advance(ms: number) {
      const end = now + ms;
      for (;;) {
        const next = [...timers.entries()].sort(
          (a, b) => a[1].due - b[1].due,
        )[0];
        if (!next || next[1].due > end) break;
        now = next[1].due;
        timers.delete(next[0]);
        next[1].callback();
      }
      now = end;
    },
    pending: () => timers.size,
  };
}

test('sucesso desaparece após 4 segundos, uma única vez', () => {
  const clock = fakeClock();
  let chamadas = 0;
  const timer = createToastTimer(
    () => chamadas++,
    TOAST_DURATION.success,
    clock,
  );
  clock.advance(3999);
  assert.equal(chamadas, 0);
  clock.advance(1);
  assert.equal(chamadas, 1);
  timer.resume();
  clock.advance(10000);
  assert.equal(chamadas, 1);
  assert.equal(clock.pending(), 0);
});

test('hover ou foco pausa o prazo e retoma somente o tempo restante', () => {
  const clock = fakeClock();
  let chamadas = 0;
  const timer = createToastTimer(() => chamadas++, 4000, clock);
  clock.advance(1500);
  timer.pause();
  timer.pause();
  clock.advance(10000);
  assert.equal(chamadas, 0);
  timer.resume();
  timer.resume();
  assert.equal(clock.pending(), 1);
  clock.advance(2499);
  assert.equal(chamadas, 0);
  clock.advance(1);
  assert.equal(chamadas, 1);
});

test('dispensar ou desmontar cancela o timer sem chamadas tardias', () => {
  const clock = fakeClock();
  let chamadas = 0;
  const timer = createToastTimer(() => chamadas++, 4000, clock);
  timer.dispose();
  timer.resume();
  clock.advance(10000);
  assert.equal(chamadas, 0);
  assert.equal(clock.pending(), 0);
});

test('fila limita avisos, mantém os mais recentes e dispensa apenas o escolhido', () => {
  let lista: Toast[] = [];
  for (let i = 0; i < MAX_TOASTS + 2; i++) {
    const anterior = lista;
    lista = toastReducer(lista, {
      type: 'add',
      toast: {
        id: String(i),
        message: 'Sucesso',
        type: 'success',
        duration: 4000,
      },
    });
    assert.notEqual(lista, anterior);
  }
  assert.equal(lista.length, MAX_TOASTS);
  assert.equal(lista[0].id, String(MAX_TOASTS + 1));
  const removido = lista[1].id;
  lista = toastReducer(lista, { type: 'dismiss', id: removido });
  assert.equal(lista.length, MAX_TOASTS - 1);
  assert.equal(
    lista.some((toast) => toast.id === removido),
    false,
  );
});

test('cartão tem mensagem acessível, botão de fechar e barra de tempo', () => {
  const toast: Toast = {
    id: '1',
    type: 'success',
    message: 'Conta cadastrada.',
    duration: 4000,
  };
  const html = renderToStaticMarkup(
    createElement(ToastCard, { toast, onDismiss: () => {} }),
  );
  assert.match(html, /toast-success/);
  assert.match(html, /role="status"/);
  assert.match(html, /Conta cadastrada/);
  assert.match(html, /Dispensar notificação/);
  assert.match(html, /--toast-duration:4000ms/);
  const erro = renderToStaticMarkup(
    createElement(ToastCard, {
      toast: { ...toast, type: 'error' },
      paused: true,
      onDismiss: () => {},
    }),
  );
  assert.match(erro, /role="alert"/);
  assert.match(erro, /animation-play-state:paused/);
});

test('provider é compatível com renderização de servidor sem timers ou avisos', () => {
  const html = renderToStaticMarkup(
    createElement(ToastProvider, null, createElement('main', null, 'Conteúdo')),
  );
  assert.match(html, /Conteúdo/);
  assert.match(html, /aria-label="Notificações"/);
  assert.doesNotMatch(html, /toast-success/);
});
