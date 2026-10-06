'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { iniciais } from '@/lib/format';
import { useAuth } from './auth-provider';
import { Brand, Icon, type IconName } from './icon';

const navigation: { href: string; label: string; icon: IconName }[] = [
  { href: '/visao-geral', label: 'Visão geral', icon: 'chart' },
  { href: '/contas', label: 'Minhas contas', icon: 'wallet' },
  { href: '/formas-pagamento', label: 'Formas de pagamento', icon: 'card' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { usuario, logout } = useAuth();
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sair() {
    setLeaving(true);
    setError(null);
    try {
      await logout();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Não foi possível sair.',
      );
      setLeaving(false);
    }
  }

  return (
    <div className="app-layout">
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      <aside className="sidebar">
        <Link
          href="/visao-geral"
          className="brand-link"
          aria-label="Finanças, visão geral"
        >
          <Brand />
        </Link>
        <div className="navigation-label">SEU ESPAÇO</div>
        <nav aria-label="Navegação principal">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {pathname === item.href && <span className="nav-active-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="sidebar-note-icon">
            <Icon name="shield" size={24} />
          </span>
          <h3>Um passo de cada vez.</h3>
          <p>Cuidar das suas finanças começa com pequenas escolhas.</p>
        </div>
        <div className="sidebar-footer">
          <span className="avatar">{iniciais(usuario.nome)}</span>
          <div className="profile-text">
            <strong>{usuario.nome}</strong>
            <span>@{usuario.login}</span>
          </div>
          <button
            className="icon-button"
            onClick={() => void sair()}
            disabled={leaving}
            aria-label={leaving ? 'Saindo' : 'Sair da conta'}
            title="Sair da conta"
          >
            <Icon name="logout" />
          </button>
        </div>
        {error && (
          <p className="sidebar-error" role="alert">
            {error}
          </p>
        )}
      </aside>
      <div className="main-area">
        <header className="topbar">
          <span className="topbar-label">Seu dinheiro, com clareza.</span>
          <div className="topbar-right">
            <span className="workspace-pill">
              <span />
              Espaço pessoal
            </span>
            <span className="avatar small">{iniciais(usuario.nome)}</span>
          </div>
        </header>
        <main id="conteudo" className="page-content">
          {children}
        </main>
        <footer className="page-footer">
          <span>Organize hoje. Respire melhor amanhã.</span>
          <span>finanças.</span>
        </footer>
      </div>
    </div>
  );
}
