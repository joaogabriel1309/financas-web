'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { Conta } from '@/lib/types';
import { lerValorConta, rascunhoValorConta } from '@/lib/account-value';
import { Icon } from './icon';
import { moeda } from '@/lib/format';

export function AccountValueDisplay({
  conta,
  disabled,
  onEdit,
}: {
  conta: Conta;
  disabled: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="account-value-display">
      <button
        type="button"
        className="editable-value"
        disabled={disabled}
        title="Dê dois cliques para editar o valor"
        aria-label={`Editar valor de ${conta.nome}: ${moeda(conta.valor)}`}
        onDoubleClick={onEdit}
        onKeyDown={(event) => {
          if (['Enter', ' ', 'F2'].includes(event.key)) {
            event.preventDefault();
            onEdit();
          }
        }}
      >
        {moeda(conta.valor)}
      </button>
    </div>
  );
}

export function AccountValueEditor({
  conta,
  busy,
  onSave,
  onCancel,
}: {
  conta: Conta;
  busy: boolean;
  onSave: (valor: number) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(() => rascunhoValorConta(conta.valor));
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const saving = useRef(false);
  const hintId = useId();
  const errorId = useId();
  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || saving.current) return;
    const valor = lerValorConta(draft);
    if (valor === null) {
      setError(
        'Informe um valor válido, não negativo, com até duas casas decimais.',
      );
      return;
    }
    setError(null);
    saving.current = true;
    try {
      if (!(await onSave(valor)))
        setError('Não foi possível salvar. Tente novamente ou cancele.');
    } catch {
      setError('Não foi possível salvar. Tente novamente ou cancele.');
    } finally {
      saving.current = false;
    }
  }

  return (
    <form
      className="account-value-editor"
      onSubmit={(event) => void submit(event)}
      noValidate
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !busy && !saving.current) {
          event.preventDefault();
          event.stopPropagation();
          onCancel();
        }
      }}
    >
      <div className="account-value-controls">
        <input
          ref={input}
          type="text"
          inputMode="decimal"
          aria-label={`Novo valor de ${conta.nome} em reais`}
          aria-describedby={`${hintId}${error ? ` ${errorId}` : ''}`}
          aria-invalid={!!error}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          disabled={busy}
          maxLength={30}
        />
        <button
          type="submit"
          className="icon-button value-save"
          aria-label={`Salvar valor de ${conta.nome}`}
          title="Salvar valor (Enter)"
          disabled={busy}
        >
          <Icon name="check" size={17} />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label={`Cancelar edição de valor de ${conta.nome}`}
          title="Cancelar (Esc)"
          disabled={busy}
          onClick={onCancel}
        >
          <Icon name="close" size={17} />
        </button>
      </div>
      <small id={hintId}>
        {busy ? (
          <span role="status">Salvando…</span>
        ) : (
          'Enter salva · Esc cancela'
        )}
      </small>
      {error && (
        <small className="value-edit-error" id={errorId} role="alert">
          {error}
        </small>
      )}
    </form>
  );
}
