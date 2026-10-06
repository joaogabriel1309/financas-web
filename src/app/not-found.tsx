import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="session-state">
      <span className="eyebrow">404</span>
      <h1>Esta página não foi encontrada.</h1>
      <p>Vamos voltar para o seu espaço financeiro?</p>
      <Link className="button primary" href="/">
        Voltar para o início
      </Link>
    </main>
  );
}
