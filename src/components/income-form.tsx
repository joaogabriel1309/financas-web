'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { MES_REGEX } from '@/lib/months';
import { lerValorConta, rascunhoValorConta } from '@/lib/account-value';
import type { Receita } from '@/lib/types';
import { ErrorMessage } from './modal';
import { Icon } from './icon';
import { useToast } from './toast-provider';

export function IncomeForm({
  mes,
  receita,
}: {
  mes: string;
  receita?: Receita;
}) {
  const router = useRouter();
  const toast = useToast();
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [recorrencia, setRecorrencia] = useState(receita?.recorrencia ?? false);
  const [error, setError] = useState<string | null>(null);

  function cancel() {
    if (!submitting.current) router.replace(`/receitas?mes=${mes}`);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = new FormData(event.currentTarget);
    const nome = String(form.get('nome') ?? '').trim();
    const valor = lerValorConta(String(form.get('valor') ?? ''));
    const referencia = String(form.get('mes') ?? '');
    if (nome.length < 2 || nome.length > 100) {
      setError('Informe um nome entre 2 e 100 caracteres.');
      return;
    }
    if (valor === null) {
      setError(
        'Informe um valor não negativo, com até duas casas decimais e no máximo R$ 9.999.999.999.999,99.',
      );
      return;
    }
    if (!MES_REGEX.test(referencia)) {
      setError('Informe um mês válido entre 1900 e 9999.');
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const atualizada = await api<Receita>(
        receita ? `/receitas/${receita.id}` : '/receitas',
        {
          method: receita ? 'PATCH' : 'POST',
          body: JSON.stringify({ nome, valor, mes: referencia, recorrencia }),
        },
      );
      toast.success(
        receita
          ? 'Receita atualizada com sucesso.'
          : 'Receita cadastrada com sucesso.',
      );
      const mesRetorno =
        atualizada.recorrencia && mes >= atualizada.mesReferencia
          ? mes
          : atualizada.mesReferencia;
      router.replace(`/receitas?mes=${mesRetorno}`);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a receita.',
      );
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="account-create-page income-create-page">
      <div className="account-create-heading">
        <div>
          <h1>{receita ? 'Editar receita' : 'Nova receita'}</h1>
          <p>Cadastre salário e outras entradas para planejar o mês.</p>
        </div>
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={cancel}
        >
          <Icon name="arrow" size={17} className="account-create-back-icon" />
          Voltar para receitas
        </button>
      </div>
      <form className="account-create-form" onSubmit={save} aria-busy={busy}>
        <section
          className="panel account-create-section form-stack"
          aria-label="Dados da receita"
        >
          <h2>Dados da receita</h2>
          <label>
            Nome
            <input
              name="nome"
              defaultValue={receita?.nome ?? ''}
              placeholder="Ex.: Salário, freelance, aluguel"
              minLength={2}
              maxLength={100}
              required
              disabled={busy}
            />
          </label>
          <label>
            Valor previsto (R$)
            <input
              name="valor"
              type="text"
              inputMode="decimal"
              defaultValue={receita ? rascunhoValorConta(receita.valor) : ''}
              placeholder="0,00"
              required
              disabled={busy}
            />
          </label>
          <label>
            {recorrencia ? 'Mês inicial' : 'Mês da receita'}
            <input
              name="mes"
              type="month"
              defaultValue={receita?.mesReferencia ?? mes}
              min="1900-01"
              max="9999-12"
              required
              disabled={busy}
            />
          </label>
          <label className="recurrence-field">
            <input
              type="checkbox"
              name="recorrencia"
              checked={recorrencia}
              onChange={(event) => setRecorrencia(event.target.checked)}
              disabled={busy}
            />
            <span>
              Recorrência mensal
              <small>Aparece em todos os meses a partir do mês inicial.</small>
            </span>
          </label>
          <p className="form-hint">
            {recorrencia
              ? 'O mesmo valor será previsto em cada mês. Editar ou excluir esta receita altera todos os meses, inclusive os anteriores.'
              : 'Esta entrada aparece somente no mês informado.'}
          </p>
          {receita && (
            <p className="form-hint">
              A edição altera a definição completa da receita e a previsão de
              todos os meses afetados.
            </p>
          )}
          <p className="form-hint">
            Este cadastro representa uma previsão de entrada, não confirma o
            recebimento do valor.
          </p>
        </section>
        <ErrorMessage message={error} />
        <div className="account-create-actions">
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={cancel}
          >
            Cancelar
          </button>
          <button type="submit" className="button primary" disabled={busy}>
            {busy
              ? 'Salvando…'
              : receita
                ? 'Salvar alterações'
                : 'Cadastrar receita'}
          </button>
        </div>
      </form>
    </div>
  );
}
