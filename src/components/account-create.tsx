'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useResource } from '@/lib/use-resource';
import type { Conta, FormaPagamento } from '@/lib/types';
import { MES_REGEX } from '@/lib/months';
import { obterIconeConta } from '@/lib/account-icons';
import { ErrorMessage } from './modal';
import { Icon } from './icon';
import { PaymentMethodField } from './payment-method-field';
import { AccountIconField } from './account-icon-field';
import { useToast } from './toast-provider';

export function AccountCreate({ mes, conta }: { mes: string; conta?: Conta }) {
  const router = useRouter();
  const toast = useToast();
  const formas = useResource<FormaPagamento[]>('/formas-pagamento');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [tipoConta, setTipoConta] = useState(
    conta?.recorrencia
      ? 'recorrente'
      : (conta?.parcela ?? 1) > 1
        ? 'parcelada'
        : 'unica',
  );

  function cancel() {
    if (!busy && !submitting.current) router.replace(`/contas?mes=${mes}`);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || submitting.current) return;
    const form = new FormData(event.currentTarget);
    const nome = String(form.get('nome')).trim();
    const icone = obterIconeConta(form.get('icone'));
    const valor = Number(form.get('valor'));
    const referencia = String(form.get('mes'));
    const recorrencia = tipoConta === 'recorrente';
    const parcela = tipoConta === 'parcelada' ? Number(form.get('parcela')) : 1;
    const formaPagamentoId =
      String(form.get('formaPagamentoId') || '').trim() || null;
    if (nome.length < 2 || !Number.isFinite(valor) || valor < 0) {
      setFormError(
        'Informe um nome com pelo menos 2 caracteres e um valor válido.',
      );
      return;
    }
    if (
      !MES_REGEX.test(referencia) ||
      !Number.isInteger(parcela) ||
      parcela < 1 ||
      parcela > 360
    ) {
      setFormError(
        'Informe um mês válido e uma quantidade inteira de até 360 parcelas.',
      );
      return;
    }
    submitting.current = true;
    setBusy(true);
    setFormError(null);
    try {
      const atualizado = await api<Conta>(
        conta ? `/contas/${conta.id}/dados` : '/contas',
        {
          method: conta ? 'PATCH' : 'POST',
          body: JSON.stringify({
            nome,
            icone,
            valor,
            mes: referencia,
            recorrencia,
            parcela,
            // Se o seletor estiver indisponível, a edição preserva o vínculo atual.
            ...(form.has('formaPagamentoId') || !conta
              ? { formaPagamentoId }
              : {}),
          }),
        },
      );
      toast.success(
        conta
          ? 'Conta atualizada com sucesso.'
          : 'Conta cadastrada com sucesso.',
      );
      // Mantém o formulário bloqueado até sair da página, evitando duplicatas.
      const mesRetorno =
        conta &&
        mes >= atualizado.mesReferencia &&
        (atualizado.recorrencia ||
          (atualizado.mesFim !== null && mes <= atualizado.mesFim))
          ? mes
          : referencia;
      router.replace(`/contas?mes=${mesRetorno}`);
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a conta.',
      );
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="account-create-page">
      <div className="account-create-heading">
        <div>
          <h1>{conta ? 'Editar conta' : 'Nova conta'}</h1>
          <p>
            {conta
              ? 'Atualize os dados da conta. As alterações valem para todos os meses e parcelas.'
              : 'Preencha os dados e escolha como a conta aparecerá na sua lista.'}
          </p>
        </div>
        <button
          type="button"
          className="button secondary"
          onClick={cancel}
          disabled={busy}
        >
          <Icon name="arrow" size={17} className="account-create-back-icon" />
          Voltar para contas
        </button>
      </div>
      <form className="account-create-form" onSubmit={save} aria-busy={busy}>
        <div className="account-create-grid">
          <section
            className="panel account-create-section"
            aria-labelledby="account-details-title"
          >
            <h2 id="account-details-title">Dados da conta</h2>
            <div className="form-stack">
              <label>
                Nome da conta
                <input
                  name="nome"
                  defaultValue={conta?.nome}
                  placeholder="Ex.: Internet de casa"
                  minLength={2}
                  maxLength={100}
                  required
                  disabled={busy}
                />
              </label>
              <div className="form-stack account-create-fields">
                <label>
                  {tipoConta === 'parcelada'
                    ? 'Valor de cada parcela (R$)'
                    : 'Valor mensal (R$)'}
                  <input
                    name="valor"
                    defaultValue={conta?.valor}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="9999999999999.99"
                    step="0.01"
                    placeholder="0,00"
                    required
                    disabled={busy}
                  />
                </label>
                <label>
                  {tipoConta === 'unica' ? 'Mês da conta' : 'Mês inicial'}
                  <input
                    name="mes"
                    type="month"
                    defaultValue={conta?.mesReferencia ?? mes}
                    min="1900-01"
                    max="9999-12"
                    required
                    disabled={busy}
                  />
                </label>
              </div>
              <label className="recurrence-field">
                <input
                  name="recorrencia"
                  type="checkbox"
                  disabled={busy}
                  checked={tipoConta === 'recorrente'}
                  onChange={(event) =>
                    setTipoConta(event.target.checked ? 'recorrente' : 'unica')
                  }
                />
                <span>
                  Recorrência{' '}
                  <small>Aparece todos os meses a partir do mês inicial.</small>
                </span>
              </label>
              <label className="recurrence-field">
                <input
                  name="parcelado"
                  type="checkbox"
                  disabled={busy}
                  checked={tipoConta === 'parcelada'}
                  onChange={(event) =>
                    setTipoConta(event.target.checked ? 'parcelada' : 'unica')
                  }
                />
                <span>
                  Parcelas <small>Uma parcela por mês até terminar.</small>
                </span>
              </label>
              {tipoConta === 'parcelada' && (
                <label>
                  Quantidade de parcelas
                  <input
                    name="parcela"
                    type="number"
                    inputMode="numeric"
                    min="2"
                    max="360"
                    step="1"
                    defaultValue={
                      conta && conta.parcela > 1 ? conta.parcela : 2
                    }
                    required
                    disabled={busy}
                  />
                </label>
              )}
              <PaymentMethodField
                defaultValue={conta?.formaPagamentoId ?? ''}
                selectedMethod={conta?.formaPagamento}
                methods={formas.data}
                loading={formas.loading}
                error={formas.error}
                busy={busy}
                onRetry={() => void formas.reload()}
              />
              <p className="form-hint">
                {tipoConta === 'recorrente'
                  ? 'Cada mês tem seu próprio pagamento. Marcar recorrência desmarca parcelas.'
                  : tipoConta === 'parcelada'
                    ? 'O valor informado é de cada parcela. Marcar parcelas desmarca recorrência.'
                    : 'Esta conta aparece somente no mês escolhido.'}
              </p>
              {conta && (
                <p className="form-hint">
                  Os pagamentos já registrados serão mantidos. O período da
                  conta deve incluir todos os meses já pagos.
                </p>
              )}
            </div>
          </section>
          <section className="panel account-create-section form-stack">
            <AccountIconField busy={busy} defaultValue={conta?.icone} />
          </section>
        </div>
        <ErrorMessage message={formError} />
        <div className="account-create-actions">
          <button
            type="button"
            className="button secondary"
            onClick={cancel}
            disabled={busy}
          >
            Cancelar
          </button>
          <button type="submit" className="button primary" disabled={busy}>
            {busy
              ? 'Salvando…'
              : conta
                ? 'Salvar alterações'
                : 'Cadastrar conta'}
          </button>
        </div>
      </form>
    </div>
  );
}
