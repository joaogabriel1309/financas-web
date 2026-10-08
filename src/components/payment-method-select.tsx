'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { FormaPagamento } from '@/lib/types';
import type { PaymentMethodAppearance } from '@/lib/payment-method-appearance';
import { PaymentMethodDisplay } from './payment-method-display';
import { Icon } from './icon';

type Choice = {
  id: string;
  label: string;
  method?: PaymentMethodAppearance;
  disabled?: boolean;
};

export function PaymentMethodSelect({
  methods,
  value,
  defaultValue = '',
  onChange,
  selectedMethod,
  name,
  id,
  label,
  describedBy,
  title,
  disabled = false,
  placeholder = 'Não informada',
}: {
  methods: FormaPagamento[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string | null) => void;
  selectedMethod?: PaymentMethodAppearance | null;
  name?: string;
  id?: string;
  label: string;
  describedBy?: string;
  title?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  const generatedId = useId();
  const triggerId = id || generatedId;
  const listId = `${triggerId}-options`;
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const options = useRef<(HTMLButtonElement | null)[]>([]);
  const search = useRef({ text: '', time: 0 });
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedId = value ?? internalValue;
  const [open, setOpen] = useState(false);
  const visible = open && !disabled;
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: 0,
    maxHeight: 0,
  });
  const choices: Choice[] = [
    { id: '', label: placeholder },
    ...methods.map((method) => ({ id: method.id, label: method.nome, method })),
  ];
  if (selectedId && !methods.some((method) => method.id === selectedId)) {
    choices.push({
      id: selectedId,
      label: selectedMethod?.nome || 'Forma indisponível',
      method: selectedMethod || undefined,
      disabled: true,
    });
  }
  const selected =
    choices.find((choice) => choice.id === selectedId) || choices[0];

  useEffect(() => {
    if (!visible) return;
    function outside(event: PointerEvent) {
      const target = event.target as Node;
      if (!trigger.current?.contains(target) && !menu.current?.contains(target))
        setOpen(false);
    }
    function scroll(event: Event) {
      if (menu.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    function resize() {
      setOpen(false);
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('scroll', scroll, true);
    window.addEventListener('resize', resize);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('scroll', scroll, true);
      window.removeEventListener('resize', resize);
    };
  }, [visible]);

  useEffect(() => {
    if (visible)
      options.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [visible, activeIndex]);

  function show(
    index = choices.findIndex((choice) => choice.id === selectedId),
  ) {
    if (disabled || !trigger.current) return;
    const rect = trigger.current.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 220), window.innerWidth - 16);
    const desiredHeight = Math.min(280, choices.length * 42 + 12);
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const useBelow = below >= Math.min(desiredHeight, 160) || below >= above;
    const maxHeight = Math.max(
      40,
      Math.min(desiredHeight, useBelow ? below : above),
    );
    setPosition({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      top: useBelow ? rect.bottom + 6 : Math.max(8, rect.top - maxHeight - 6),
      width,
      maxHeight,
    });
    setActiveIndex(Math.max(0, index));
    search.current = { text: '', time: 0 };
    setOpen(true);
  }

  function choose(index: number) {
    const choice = choices[index];
    if (disabled || !choice || choice.disabled) return;
    setOpen(false);
    if (value === undefined) setInternalValue(choice.id);
    if (choice.id !== selectedId) onChange?.(choice.id || null);
    trigger.current?.focus();
  }

  function move(step: number) {
    let index = activeIndex;
    for (let attempt = 0; attempt < choices.length; attempt++) {
      index = (index + step + choices.length) % choices.length;
      if (!choices[index].disabled) {
        setActiveIndex(index);
        break;
      }
    }
  }

  function keyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (visible) move(event.key === 'ArrowDown' ? 1 : -1);
      else show();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const enabled = choices
        .map((choice, index) => (choice.disabled ? -1 : index))
        .filter((index) => index >= 0);
      const index =
        event.key === 'Home' ? enabled[0] : enabled[enabled.length - 1];
      if (visible) setActiveIndex(index);
      else show(index);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (visible) choose(activeIndex);
      else show();
    } else if (event.key === 'Escape' && visible) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    } else if (event.key === 'Tab') {
      setOpen(false);
    } else if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const now = Date.now();
      search.current.text =
        now - search.current.time > 700
          ? event.key
          : search.current.text + event.key;
      search.current.time = now;
      const normalize = (text: string) =>
        text
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLocaleLowerCase('pt-BR');
      const query = normalize(search.current.text);
      const index = choices.findIndex(
        (choice) =>
          !choice.disabled && normalize(choice.label).startsWith(query),
      );
      if (index >= 0) {
        event.preventDefault();
        if (visible) setActiveIndex(index);
        else {
          const text = search.current;
          show(index);
          search.current = text;
        }
      }
    }
  }

  return (
    <div className="payment-method-select">
      {name && (
        <input
          type="hidden"
          name={name}
          value={selectedId}
          disabled={disabled}
        />
      )}
      <button
        ref={trigger}
        id={triggerId}
        type="button"
        role="combobox"
        className="payment-select-trigger"
        aria-label={label}
        aria-describedby={describedBy}
        aria-expanded={visible}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-activedescendant={visible ? `${listId}-${activeIndex}` : undefined}
        title={title}
        disabled={disabled}
        onClick={() => (visible ? setOpen(false) : show())}
        onKeyDown={keyDown}
        onBlur={(event) => {
          if (!menu.current?.contains(event.relatedTarget)) setOpen(false);
        }}
      >
        {selected.method ? (
          <PaymentMethodDisplay method={selected.method} />
        ) : (
          <span className="payment-select-placeholder">{selected.label}</span>
        )}
        <Icon name="chevron" size={14} className="payment-select-chevron" />
      </button>
      {visible &&
        createPortal(
          <div
            ref={menu}
            id={listId}
            role="listbox"
            aria-label={label}
            className="payment-select-listbox"
            style={position}
            onClick={(event) => event.stopPropagation()}
          >
            {choices.map((choice, index) => (
              <button
                ref={(element) => {
                  options.current[index] = element;
                }}
                id={`${listId}-${index}`}
                key={choice.id}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={choice.id === selectedId}
                aria-disabled={choice.disabled || undefined}
                className={`payment-select-option ${activeIndex === index ? 'active' : ''}`}
                onPointerDown={(event) => event.preventDefault()}
                onPointerMove={() => {
                  if (!choice.disabled) setActiveIndex(index);
                }}
                onClick={() => choose(index)}
              >
                {choice.method ? (
                  <PaymentMethodDisplay method={choice.method} />
                ) : (
                  <span className="payment-select-placeholder">
                    {choice.label}
                  </span>
                )}
                {choice.id === selectedId && <Icon name="check" size={15} />}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
