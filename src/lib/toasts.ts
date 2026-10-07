export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

export const TOAST_DURATION = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: 6000,
} as const;
export const MAX_TOASTS = 4;

export function toastReducer(
  state: Toast[],
  action: { type: 'add'; toast: Toast } | { type: 'dismiss'; id: string },
): Toast[] {
  return action.type === 'add'
    ? [action.toast, ...state].slice(0, MAX_TOASTS)
    : state.filter((toast) => toast.id !== action.id);
}

interface TimerClock {
  now: () => number;
  schedule: (
    callback: () => void,
    delay: number,
  ) => ReturnType<typeof setTimeout>;
  cancel: (timer: ReturnType<typeof setTimeout>) => void;
}

// O mesmo prazo controla o desaparecimento; pausar não reinicia a duração.
export function createToastTimer(
  onExpire: () => void,
  duration: number,
  clock: TimerClock = {
    now: Date.now,
    schedule: (callback, delay) => setTimeout(callback, delay),
    cancel: (timer) => clearTimeout(timer),
  },
) {
  let remaining = duration;
  let started = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  const pause = () => {
    if (timer === undefined) return;
    clock.cancel(timer);
    timer = undefined;
    remaining = Math.max(0, remaining - (clock.now() - started));
  };
  const resume = () => {
    if (disposed || timer !== undefined) return;
    started = clock.now();
    timer = clock.schedule(() => {
      timer = undefined;
      disposed = true;
      onExpire();
    }, remaining);
  };
  resume();
  return {
    pause,
    resume,
    dispose: () => {
      pause();
      disposed = true;
    },
  };
}
