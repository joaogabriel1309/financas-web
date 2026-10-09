'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { iniciais } from '@/lib/format';
import { useAuth } from './auth-provider';
import { Brand, Icon, type IconName } from './icon';
import { useToast } from './toast-provider';

const navigation: { href: string; label: string; icon: IconName }[] = [
  { href: '/visao-geral', label: 'Visão geral', icon: 'chart' },
  { href: '/contas', label: 'Minhas contas', icon: 'wallet' },
  { href: '/formas-pagamento', label: 'Formas de pagamento', icon: 'card' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const toast = useToast();
  const { usuario, logout } = useAuth();
  const [leaving, setLeaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const currentSection = navigation.find(
    (item) => item.href === pathname || pathname.startsWith(`${item.href}/`),
  );
  const currentPage =
    pathname === '/contas/nova'
      ? 'Nova conta'
      : /^\/contas\/[^/]+\/editar$/.test(pathname)
        ? 'Editar conta'
        : currentSection?.label;

  useEffect(() => {
    menu.current?.close();
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  function openMenu() {
    if (!menu.current || menu.current.open) return;
    menu.current.showModal();
    setMenuOpen(true);
  }

  function closeMenu() {
    menu.current?.close();
    menuButton.current?.focus();
  }

  async function sair() {
    setLeaving(true);
    try {
      await logout();
    } catch (error) {
      toast.error(
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
      <dialog
        ref={menu}
        id={menuId}
        className="navigation-drawer"
        aria-label="Menu de navegação"
        onClose={() => setMenuOpen(false)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            closeMenu();
        }}
      >
        <div className="drawer-heading">
          <Link
            href="/visao-geral"
            className="drawer-brand"
            aria-label="Finanças, visão geral"
            onClick={closeMenu}
          >
            <Brand />
          </Link>
          <button
            type="button"
            className="icon-button"
            aria-label="Fechar menu"
            title="Fechar menu"
            onClick={closeMenu}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="drawer-body">
          <div className="navigation-label">Navegação</div>
          <nav aria-label="Navegação principal">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${currentSection?.href === item.href ? 'active' : ''}`}
                aria-current={
                  pathname === item.href
                    ? 'page'
                    : currentSection?.href === item.href
                      ? 'location'
                      : undefined
                }
                onClick={closeMenu}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {currentSection?.href === item.href && (
                  <span className="nav-active-dot" />
                )}
              </Link>
            ))}
          </nav>
        </div>
      </dialog>
      <div className="main-area">
        <header className="app-header">
          <button
            ref={menuButton}
            type="button"
            className="icon-button menu-toggle"
            aria-label="Abrir menu de navegação"
            title="Abrir menu"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-haspopup="dialog"
            onClick={openMenu}
          >
            <Icon name="menu" size={20} />
          </button>
          <Link
            href="/visao-geral"
            className="header-brand"
            aria-label="Finanças, visão geral"
          >
            <Brand />
          </Link>
          <nav className="header-navigation" aria-label="Navegação principal">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  currentSection?.href === item.href ? 'page' : undefined
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <span className="header-page-name">{currentPage}</span>
          <div
            className="header-profile"
            title={`${usuario.nome} (@${usuario.login})`}
          >
            <span className="avatar">{iniciais(usuario.nome)}</span>
            <div className="profile-text">
              <strong>{usuario.nome}</strong>
              <span>@{usuario.login}</span>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => void sair()}
              disabled={leaving}
              aria-label={leaving ? 'Saindo' : 'Sair da conta'}
              title="Sair da conta"
            >
              <Icon name="logout" />
            </button>
          </div>
        </header>
        <main id="conteudo" className="page-content">
          {children}
        </main>
        <footer className="page-footer">
          <span>Seu controle financeiro</span>
          <span>finanças.</span>
        </footer>
      </div>
    </div>
  );
}
