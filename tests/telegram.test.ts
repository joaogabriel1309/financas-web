import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validarLinkTelegram } from '../src/lib/telegram';
const now = Date.parse('2026-10-16T12:00:00Z');
const valid = {
  url: 'https://t.me/financas_bot?start=' + 'a'.repeat(43),
  expiresAt: '2026-10-16T12:05:00Z',
};
test('aceita o deep link de uso único retornado pelo back', () => {
  assert.deepEqual(validarLinkTelegram(valid, now), valid);
});
test('recusa links vencidos, malformados e endereços fora do Telegram', () => {
  for (const value of [
    null,
    {},
    { ...valid, url: 'javascript:alert(1)' },
    { ...valid, url: valid.url.replace('t.me', 't.me.evil.example') },
    { ...valid, url: valid.url.replace('https:', 'http:') },
    { ...valid, url: 'https://t.me/financas_bot?start=curto' },
    { ...valid, expiresAt: 'data-invalida' },
    { ...valid, expiresAt: new Date(now).toISOString() },
  ]) {
    assert.throws(() => validarLinkTelegram(value, now));
  }
});
