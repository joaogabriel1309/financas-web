'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useResource } from '@/lib/use-resource';
import {
  validarLinkTelegram,
  type TelegramLink,
  type TelegramStatus,
} from '@/lib/telegram';
import { ErrorMessage, LoadingState, Modal } from './modal';
import { Icon } from './icon';
import { useToast } from './toast-provider';

const endpoint = '/integracoes/telegram';

export function TelegramIntegration() {
  const { data, setData, error, loading, reload } =
    useResource<TelegramStatus>(endpoint);
  const toast = useToast();
  const [link, setLink] = useState<TelegramLink | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const acting = useRef(false);
  const linkInput = useRef<HTMLInputElement>(null);
  const connected = data?.conectado === true;
  const expired = !!link && Date.parse(link.expiresAt) <= now;
  const seconds = link
    ? Math.max(0, Math.ceil((Date.parse(link.expiresAt) - now) / 1000))
    : 0;

  useEffect(() => {
    if (!link || connected || expired) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [link, connected, expired]);

  useEffect(() => {
    if (!link || connected || busy || expired) return;
    const controller = new AbortController();
    let inFlight = false;
    async function refresh() {
      if (
        inFlight ||
        document.visibilityState !== 'visible' ||
        Date.now() >= Date.parse(link!.expiresAt)
      )
        return;
      inFlight = true;
      try {
        await reload(controller.signal);
      } finally {
        inFlight = false;
      }
    }
    const timer = window.setInterval(() => void refresh(), 5000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [link, connected, busy, expired, reload]);

  async function generate() {
    if (acting.current || checking) return;
    acting.current = true;
    setBusy(true);
    setActionError(null);
    setLink(null);
    try {
      const result = await api<unknown>(`${endpoint}/vincular`, {
        method: 'POST',
      });
      const validated = validarLinkTelegram(result, Date.now());
      setNow(Date.now());
      setLink(validated);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Não foi possível gerar o link.',
      );
      await reload();
    } finally {
      acting.current = false;
      setBusy(false);
    }
  }

  async function check() {
    if (checking || acting.current) return;
    setChecking(true);
    try {
      await reload();
    } finally {
      setChecking(false);
    }
  }

  async function copy() {
    if (!link || expired) return;
    setActionError(null);
    try {
      await navigator.clipboard.writeText(link.url);
      toast.success('Link copiado.');
    } catch {
      linkInput.current?.focus();
      linkInput.current?.select();
      setActionError(
        'Não foi possível copiar automaticamente. O link está selecionado; copie pelo navegador.',
      );
    }
  }

  async function disconnect() {
    if (acting.current || checking) return;
    acting.current = true;
    setBusy(true);
    setActionError(null);
    try {
      await api<void>(endpoint, { method: 'DELETE' });
      setData({ conectado: false, criadoEm: null });
      setLink(null);
      setConfirming(false);
      toast.success('Telegram desconectado.');
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Não foi possível desconectar.',
      );
    } finally {
      acting.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Integrações</h1>
          <p>Conecte serviços à sua conta financeira.</p>
        </div>
      </div>
      <section
        className="panel telegram-panel"
        aria-labelledby="telegram-title"
      >
        <div className="telegram-heading">
          <span className="telegram-symbol">
            <Icon name="telegram" size={26} />
          </span>
          <div>
            <h2 id="telegram-title">Telegram</h2>
            <p>Cadastre contas enviando uma mensagem para o bot.</p>
          </div>
          {data && (
            <span
              className={`badge ${connected ? 'paid' : 'pending'}`}
              role="status"
            >
              <span />
              {connected ? 'Conectado' : 'Não conectado'}
            </span>
          )}
        </div>
        <ErrorMessage message={error} />
        {error && data && (
          <button
            className="button secondary retry-button"
            onClick={() => void check()}
            disabled={checking || busy}
          >
            {checking ? 'Verificando…' : 'Atualizar status'}
          </button>
        )}
        {!confirming && <ErrorMessage message={actionError} />}
        {loading ? (
          <LoadingState />
        ) : data ? (
          connected ? (
            <div className="telegram-body">
              <p role="status">
                Seu Telegram está conectado
                {data.criadoEm
                  ? ` desde ${new Date(data.criadoEm).toLocaleDateString('pt-BR')}`
                  : ''}
                .
              </p>
              <div className="telegram-example">
                <span>Envie ao bot, por exemplo:</span>
                <code>add luz 456,45</code>
                <small>
                  A conta será cadastrada em aberto, sem recorrência.
                </small>
              </div>
              <button
                className="button secondary"
                onClick={() => {
                  setActionError(null);
                  setConfirming(true);
                }}
                disabled={busy}
              >
                Desconectar Telegram
              </button>
            </div>
          ) : (
            <div className="telegram-body">
              {link ? (
                <>
                  <ol className="telegram-steps">
                    <li>Abra o link abaixo no Telegram.</li>
                    <li>
                      Toque em <strong>Iniciar</strong> na conversa com o bot.
                    </li>
                    <li>Volte aqui para conferir a conexão.</li>
                  </ol>
                  {expired ? (
                    <p role="status" className="form-hint">
                      Este link expirou. Gere um novo para continuar.
                    </p>
                  ) : (
                    <>
                      <div className="telegram-actions">
                        <a
                          className="button primary"
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                        >
                          Abrir Telegram
                          <Icon name="arrow" size={17} />
                        </a>
                        <button
                          className="button secondary"
                          onClick={() => void copy()}
                        >
                          Copiar link
                        </button>
                      </div>
                      <label className="telegram-link-field">
                        Link de conexão
                        <input
                          ref={linkInput}
                          value={link.url}
                          readOnly
                          onFocus={(event) => event.currentTarget.select()}
                        />
                      </label>
                      <p className="form-hint">
                        Válido por {Math.floor(seconds / 60)}min{' '}
                        {String(seconds % 60).padStart(2, '0')}s. Não
                        compartilhe este link.
                      </p>
                    </>
                  )}
                  <div className="telegram-actions">
                    <button
                      className="button secondary"
                      onClick={() => void check()}
                      disabled={checking || busy}
                    >
                      {checking ? 'Verificando…' : 'Verificar conexão'}
                    </button>
                    <button
                      className={`button ${expired ? 'primary' : 'secondary'}`}
                      onClick={() => void generate()}
                      disabled={busy || checking}
                    >
                      {busy ? 'Gerando…' : 'Gerar novo link'}
                    </button>
                  </div>
                  <p className="form-hint">
                    A conexão é verificada automaticamente enquanto o link
                    estiver válido. Um novo link substitui o anterior.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Conecte sua conta para registrar despesas diretamente pelo
                    Telegram.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => void generate()}
                    disabled={busy || checking}
                  >
                    <Icon name="telegram" size={18} />
                    {busy ? 'Gerando link…' : 'Conectar Telegram'}
                  </button>
                </>
              )}
            </div>
          )
        ) : (
          <button
            className="button secondary"
            onClick={() => void check()}
            disabled={checking}
          >
            {checking ? 'Carregando…' : 'Tentar novamente'}
          </button>
        )}
      </section>
      {confirming && (
        <Modal
          title="Desconectar Telegram?"
          description="O bot deixará de cadastrar contas para você. Suas contas e pagamentos existentes serão mantidos."
          busy={busy}
          onClose={() => setConfirming(false)}
        >
          <ErrorMessage message={actionError} />
          <div className="modal-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setConfirming(false)}
            >
              Cancelar
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={() => void disconnect()}
            >
              {busy ? 'Desconectando…' : 'Desconectar'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
