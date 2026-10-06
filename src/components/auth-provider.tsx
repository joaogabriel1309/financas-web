'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { Usuario } from '@/lib/types';
import { LoadingState } from './modal';

const AuthContext = createContext<{
  usuario: Usuario;
  logout: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadSession = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const result = await api<Usuario>('/auth/me', { signal });
        setUsuario(result);
        setError(null);
      } catch (error) {
        if (signal?.aborted) return;
        if (error instanceof ApiError && error.status === 401) {
          router.replace('/login');
          router.refresh();
        } else {
          setError(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar sua sessão.',
          );
        }
      }
    },
    [router],
  );

  useEffect(() => {
    const controller = new AbortController();
    void api<Usuario>('/auth/me', { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) {
          setUsuario(result);
          setError(null);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) {
          router.replace('/login');
          router.refresh();
        } else
          setError(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar sua sessão.',
          );
      });
    const expired = () => {
      setUsuario(null);
      router.replace('/login');
      router.refresh();
    };
    window.addEventListener('sessao-expirada', expired);
    return () => {
      controller.abort();
      window.removeEventListener('sessao-expirada', expired);
    };
  }, [router]);

  async function logout() {
    await api<void>('/auth/logout', { method: 'POST' });
    setUsuario(null);
    router.replace('/login');
    router.refresh();
  }

  if (!usuario)
    return (
      <div className="session-state">
        {error ? (
          <>
            <h1>Vamos tentar novamente?</h1>
            <p role="alert">{error}</p>
            <button
              className="button primary"
              onClick={() => void loadSession()}
            >
              Tentar novamente
            </button>
          </>
        ) : (
          <LoadingState />
        )}
      </div>
    );
  return (
    <AuthContext.Provider value={{ usuario, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve estar dentro de AuthProvider');
  return context;
}
