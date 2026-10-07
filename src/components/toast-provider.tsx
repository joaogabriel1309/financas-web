'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  createToastTimer,
  toastReducer,
  TOAST_DURATION,
  type Toast,
  type ToastType,
} from '@/lib/toasts';
import { Icon, type IconName } from './icon';

type ToastApi = Record<ToastType, (message: string) => void>;
const ToastContext = createContext<ToastApi | null>(null);
const icons: Record<ToastType, IconName> = {
  success: 'check',
  error: 'close',
  warning: 'shield',
  info: 'shield',
};
const labels: Record<ToastType, string> = {
  success: 'Sucesso',
  error: 'Erro',
  warning: 'Atenção',
  info: 'Informação',
};

// A apresentação fica separada do timer para verificar o HTML acessível nos testes.
export function ToastCard({
  toast,
  paused = false,
  onDismiss,
}: {
  toast: Toast;
  paused?: boolean;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`toast toast-${toast.type}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-atomic="true"
    >
      <span className="toast-icon" aria-hidden="true">
        <Icon name={icons[toast.type]} size={20} />
      </span>
      <p>
        <span className="sr-only">{labels[toast.type]}: </span>
        {toast.message}
      </p>
      <button
        type="button"
        className="icon-button toast-close"
        aria-label={`Dispensar notificação: ${toast.message}`}
        onClick={onDismiss}
      >
        <Icon name="close" size={17} />
      </button>
      <span
        className="toast-progress"
        aria-hidden="true"
        style={
          {
            '--toast-duration': `${toast.duration}ms`,
            animationPlayState: paused ? 'paused' : 'running',
          } as CSSProperties
        }
      />
    </div>
  );
}

function ToastItem({
  toast,
  dismiss,
}: {
  toast: Toast;
  dismiss: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const timer = useRef<ReturnType<typeof createToastTimer> | null>(null);
  const paused = hovered || focused;
  useEffect(() => {
    timer.current = createToastTimer(() => dismiss(toast.id), toast.duration);
    return () => {
      timer.current?.dispose();
    };
  }, [toast.id, toast.duration, dismiss]);
  useEffect(() => {
    if (paused) timer.current?.pause();
    else timer.current?.resume();
  }, [paused]);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      <ToastCard
        toast={toast}
        paused={paused}
        onDismiss={() => dismiss(toast.id)}
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const nextId = useRef(0);
  const dismiss = useCallback(
    (id: string) => dispatch({ type: 'dismiss', id }),
    [],
  );
  const show = useCallback((type: ToastType, message: string) => {
    dispatch({
      type: 'add',
      toast: {
        id: `toast-${++nextId.current}`,
        type,
        message,
        duration: TOAST_DURATION[type],
      },
    });
  }, []);
  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => show('success', message),
      error: (message) => show('error', message),
      warning: (message) => show('warning', message),
      info: (message) => show('info', message),
    }),
    [show],
  );
  return (
    <ToastContext.Provider value={api}>
      {children}
      <section className="toast-viewport" aria-label="Notificações">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} dismiss={dismiss} />
        ))}
      </section>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const toast = useContext(ToastContext);
  if (!toast)
    throw new Error('useToast deve ser usado dentro de ToastProvider.');
  return toast;
}
