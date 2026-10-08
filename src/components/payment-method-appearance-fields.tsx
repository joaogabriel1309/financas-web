'use client';

import { useState } from 'react';
import {
  PAYMENT_METHOD_ICONS,
  PAYMENT_METHOD_COLORS,
  paymentMethodColor,
  paymentMethodIcon,
} from '@/lib/payment-method-appearance';
import { PaymentMethodSymbol } from './payment-method-display';

export function PaymentMethodAppearanceFields({
  cor,
  icone,
  busy = false,
}: {
  cor?: string;
  icone?: string;
  busy?: boolean;
}) {
  const [color, setColor] = useState(() => paymentMethodColor(cor));
  const [icon, setIcon] = useState(() => paymentMethodIcon(icone));
  return (
    <>
      <fieldset className="payment-appearance-field" disabled={busy}>
        <legend>Cor</legend>
        <label className="payment-color-input">
          <input
            type="color"
            name="cor"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            aria-label="Escolher cor da forma de pagamento"
          />
          <span>{color.toUpperCase()}</span>
        </label>
        <div
          className="payment-color-palette"
          role="group"
          aria-label="Cores sugeridas"
        >
          {PAYMENT_METHOD_COLORS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="payment-color-swatch"
              style={{ backgroundColor: option.value }}
              title={option.label}
              aria-label={option.label}
              aria-pressed={color === option.value}
              onClick={() => setColor(option.value)}
            />
          ))}
        </div>
      </fieldset>
      <fieldset
        className="account-icon-field payment-appearance-field"
        disabled={busy}
      >
        <legend>Ícone</legend>
        <div className="account-icon-options payment-icon-options">
          {PAYMENT_METHOD_ICONS.map((option) => (
            <label className="account-icon-option" key={option.value}>
              <input
                type="radio"
                name="icone"
                value={option.value}
                checked={icon === option.value}
                onChange={() => setIcon(option.value)}
              />
              <PaymentMethodSymbol
                method={{ cor: color, icone: option.value }}
                size={20}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="payment-appearance-preview">
        <PaymentMethodSymbol method={{ cor: color, icone: icon }} size={22} />
        <div>
          <strong>Prévia da forma de pagamento</strong>
          <small>
            Esta cor e este ícone aparecerão nos seletores de contas.
          </small>
        </div>
      </div>
    </>
  );
}
