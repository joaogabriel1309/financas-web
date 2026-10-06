'use client';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="session-state">
      <h1>Não foi possível abrir esta página.</h1>
      <p>Ocorreu um problema inesperado. Tente novamente.</p>
      <button className="button primary" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
