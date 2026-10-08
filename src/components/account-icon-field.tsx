'use client';

import { useId } from 'react';
import { ACCOUNT_ICONS, obterIconeConta } from '@/lib/account-icons';
import { Icon } from './icon';

export function AccountIconField({
  busy = false,
  defaultValue,
}: {
  busy?: boolean;
  defaultValue?: string;
}) {
  const hintId = useId();

  return (
    <fieldset
      className="account-icon-field"
      disabled={busy}
      aria-describedby={hintId}
    >
      <legend>Ícone da conta</legend>
      <div className="account-icon-options">
        {ACCOUNT_ICONS.map((icon) => (
          <label className="account-icon-option" key={icon.value}>
            <input
              type="radio"
              name="icone"
              value={icon.value}
              defaultChecked={icon.value === obterIconeConta(defaultValue)}
            />
            <Icon name={icon.value} size={22} />
            <span>{icon.label}</span>
          </label>
        ))}
      </div>
      <p id={hintId} className="account-icon-hint">
        Escolha o ícone que aparecerá na lista.
      </p>
    </fieldset>
  );
}
