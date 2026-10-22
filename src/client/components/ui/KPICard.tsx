export interface KPICardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  variant?: 'default' | 'danger' | 'success' | 'warning' | 'info';
  className?: string;
}

export function KPICard({ 
  label, 
  value, 
  icon, 
  trend, 
  variant = 'default', 
  className = '' 
}: KPICardProps) {
  const variantClasses = {
    default: '',
    danger: 'kpi-card--danger',
    success: 'kpi-card--success',
    warning: 'kpi-card--warning',
    info: 'kpi-card--info',
  };

  const trendClasses = {
    positive: 'kpi-card__change--positive',
    negative: 'kpi-card__change--negative',
    neutral: 'kpi-card__change--neutral',
  };

  const iconColors = {
    default: 'var(--text-secondary)',
    danger: 'var(--danger-on)',
    success: 'var(--success-on)',
    warning: 'var(--warning-on)',
    info: 'var(--info-on)',
  };

  const iconBackgrounds = {
    default: 'var(--surface-elevated)',
    danger: 'var(--danger-bg)',
    success: 'var(--success-bg)',
    warning: 'var(--warning-bg)',
    info: 'var(--info-bg)',
  };

  return (
    <div className={`kpi-card ${variantClasses[variant]} ${className}`}>
      <div className="kpi-card__icon" style={{ 
        background: iconBackgrounds[variant], 
        color: iconColors[variant] 
      }}>
        {icon || (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
            <path d="M18 20V10" />
            <path d="M12 20V4" />
            <path d="M6 20v-6" />
          </svg>
        )}
      </div>
      <div className="kpi-card__label">{label}</div>
      <div className="kpi-card__value" style={{ fontFamily: 'var(--font-mono)' }}>
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </div>
      {trend && (
        <div className={`kpi-card__change ${trendClasses[trend.type]}`}>
          {trend.value}
        </div>
      )}
    </div>
  );
}