import type { CSSProperties } from 'react';

export type IconName =
  | 'menu'
  | 'chart'
  | 'wallet'
  | 'card'
  | 'home'
  | 'car'
  | 'motorcycle'
  | 'fuel'
  | 'loan'
  | 'health-plan'
  | 'cart'
  | 'heart'
  | 'book'
  | 'wifi'
  | 'bolt'
  | 'coffee'
  | 'phone'
  | 'receipt'
  | 'plus'
  | 'arrow'
  | 'check'
  | 'clock'
  | 'logout'
  | 'search'
  | 'trash'
  | 'edit'
  | 'close'
  | 'chevron'
  | 'shield'
  | 'eye'
  | 'eye-off'
  | 'refresh';

const paths: Record<IconName, React.ReactNode> = {
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  chart: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  wallet: (
    <>
      <path d="M20 7V5a2 2 0 0 0-2-2H6a3 3 0 0 0 0 6h14v12H6a3 3 0 0 1-3-3V6" />
      <path d="M20 11h-5a2 2 0 0 0 0 4h5" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="M2 9h20M6 15h4" />
    </>
  ),
  home: (
    <>
      <path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8" />
    </>
  ),
  car: (
    <>
      <path d="m5 10 2-6h10l2 6M3 10h18v8H3zM5 18v3M19 18v3M6 14h2M16 14h2" />
    </>
  ),
  motorcycle: (
    <>
      <circle cx="5" cy="17" r="3" />
      <circle cx="19" cy="17" r="3" />
      <path d="m5 17 4-7h5M9 10l3 7H5M12 17h3M19 17 14 6h-3M14 6h3M8 7h4" />
    </>
  ),
  fuel: (
    <>
      <rect x="4" y="3" width="10" height="18" rx="2" />
      <rect x="6" y="6" width="6" height="5" rx="1" />
      <path d="M2 21h14M14 10h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V7l-3-3M19 5v4h2" />
    </>
  ),
  loan: (
    <>
      <circle cx="16" cy="5" r="3" />
      <path d="M16 4v2M2 12h4v10H2zM6 13h3a3 3 0 0 1 3 3h3a2 2 0 0 1 0 4h-4M6 22h11l5-7a2 2 0 0 0-3-2l-3 4" />
    </>
  ),
  'health-plan': (
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM12 8v7M8.5 11.5h7" />
    </>
  ),
  cart: (
    <>
      <path d="M3 3h2l3 13h11l2-9H6" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </>
  ),
  heart: (
    <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
  ),
  book: (
    <>
      <path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1ZM12 5v15" />
    </>
  ),
  wifi: (
    <>
      <path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8.5 16a5.5 5.5 0 0 1 7 0" />
      <circle cx="12" cy="20" r=".7" />
    </>
  ),
  bolt: <path d="m13 2-9 12h7l-1 8 10-12h-7z" />,
  coffee: (
    <>
      <path d="M5 8h12v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4ZM17 9h2a3 3 0 0 1 0 6h-2M4 22h16M8 2v3M12 2v3" />
    </>
  ),
  phone: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M10 5h4M11 19h2" />
    </>
  ),
  receipt: (
    <>
      <path d="m5 2 2 2 2-2 3 2 3-2 2 2 2-2v20l-2-2-2 2-3-2-3 2-2-2-2 2ZM9 8h6M9 12h6M9 16h4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M9 12h12m-4-4 4 4-4 4" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
    </>
  ),
  edit: (
    <>
      <path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  shield: (
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  'eye-off': (
    <>
      <path d="m3 3 18 18M10 5h2c7 0 10 7 10 7a17 17 0 0 1-4 5M6 6a20 20 0 0 0-4 6s3 7 10 7a11 11 0 0 0 5-1" />
      <path d="M10 10a3 3 0 0 0 4 4" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 14-1l1 6M4 12l1 6a8 8 0 0 0 14-1" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {paths[name]}
    </svg>
  );
}

export function Brand() {
  return (
    <span className="brand">
      <span className="brand-symbol">
        <span />
        <span />
        <span />
      </span>
      finanças<span className="brand-dot">.</span>
    </span>
  );
}
