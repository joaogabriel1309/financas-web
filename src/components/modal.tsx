'use client';

import { useEffect, useId, useRef } from 'react';
import { Icon } from './icon';

export function Modal({
  title,
  description,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={id}
      aria-describedby={description ? `${id}-description` : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="modal-content">
        <div className="modal-heading">
          <h2 id={id}>{title}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Fechar"
            disabled={busy}
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        {description && (
          <p id={`${id}-description`} className="muted">
            {description}
          </p>
        )}
        {children}
      </div>
    </dialog>
  );
}

export function ErrorMessage({ message }: { message: string | null }) {
  return message ? (
    <div className="error-message" role="alert">
      {message}
    </div>
  ) : null;
}

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name="wallet" size={28} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" />
      Carregando suas informações…
    </div>
  );
}
