import type { IconName } from './icon';
import { Icon } from './icon';
import { moeda } from '@/lib/format';

export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  description,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  description: string;
  icon: IconName;
  tone?: 'neutral' | 'green' | 'amber';
}) {
  return (
    <article className={`stat-card ${tone}`}>
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">
          <Icon name={icon} size={21} />
        </span>
      </div>
      <strong className="stat-value">{moeda(value)}</strong>
      <span className="stat-description">{description}</span>
    </article>
  );
}
