'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import type { Usuario } from '@/lib/types';
import { Brand, Icon } from './icon';
import { ErrorMessage } from './modal';
import { useToast } from './toast-provider';

export function AuthForm({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await api<Usuario>(register ? '/auth/registrar' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          login: String(data.get('login')).trim(),
          senha: data.get('senha'),
          ...(register ? { nome: String(data.get('nome')).trim() } : {}),
        }),
      });
      toast.success(
        register
          ? 'Sua conta foi criada com sucesso.'
          : 'Bem-vindo! Login realizado com sucesso.',
      );
      router.replace('/visao-geral');
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Não foi possível entrar.',
      );
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <Brand />
        <div className="auth-story-content">
          <span className="eyebrow light">CONTROLE FINANCEIRO PESSOAL</span>
          <h1>
            Suas contas.
            <br />
            Tudo <em>em ordem.</em>
          </h1>
          <p>Acompanhe vencimentos, pagamentos e despesas em um só lugar.</p>
          <ul className="auth-feature-list">
            <li>
              <Icon name="wallet" size={18} />
              Contas organizadas por mês
            </li>
            <li>
              <Icon name="clock" size={18} />
              Vencimentos e parcelas à vista
            </li>
            <li>
              <Icon name="check" size={18} />
              Histórico de pagamentos
            </li>
          </ul>
        </div>
        <span className="auth-story-footer">
          Finanças pessoais, sem complicação.
        </span>
      </section>
      <section className="auth-form-section">
        <div className="mobile-brand">
          <Brand />
        </div>
        <div className="auth-form-content">
          <span className="eyebrow">SEU ESPAÇO FINANCEIRO</span>
          <h2>{register ? 'Criar conta' : 'Entrar'}</h2>
          <p className="auth-subtitle">
            {register
              ? 'Preencha seus dados para começar.'
              : 'Informe seu usuário e senha para acessar suas contas.'}
          </p>
          <form className="form-stack" onSubmit={submit}>
            {register && (
              <label>
                Seu nome
                <input
                  name="nome"
                  autoComplete="name"
                  placeholder="Como podemos chamar você?"
                  minLength={2}
                  maxLength={100}
                  required
                  disabled={busy}
                />
              </label>
            )}
            <label>
              Login
              <input
                name="login"
                autoComplete="username"
                placeholder="Seu nome de usuário"
                minLength={register ? 3 : undefined}
                maxLength={register ? 50 : undefined}
                required
                disabled={busy}
                autoCapitalize="none"
                spellCheck={false}
              />
            </label>
            <label>
              Senha
              <span className="password-field">
                <input
                  name="senha"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={register ? 'new-password' : 'current-password'}
                  placeholder={
                    register ? 'Pelo menos 8 caracteres' : 'Sua senha'
                  }
                  minLength={register ? 8 : undefined}
                  required
                  disabled={busy}
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} />
                </button>
              </span>
            </label>
            <ErrorMessage message={error} />
            <button className="button primary auth-submit" disabled={busy}>
              {busy ? (
                <>
                  <span className="spinner" />
                  {register ? 'Criando conta…' : 'Entrando…'}
                </>
              ) : (
                <>
                  {register ? 'Criar conta' : 'Entrar'}
                  <Icon name="arrow" />
                </>
              )}
            </button>
          </form>
          <p className="auth-switch">
            {register ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}{' '}
            <Link href={register ? '/login' : '/cadastro'}>
              {register ? 'Entrar' : 'Criar conta'}
            </Link>
          </p>
          <div className="auth-security">
            <Icon name="shield" size={16} />
            <span>Um espaço só seu, protegido por senha.</span>
          </div>
        </div>
        <span className="auth-bottom">Finanças · Controle pessoal</span>
      </section>
    </main>
  );
}
