import { formatNumber } from '../../utils/format';

export interface ProductCardProps {
  id: string;
  name: string;
  brand?: string | null;
  category: string;
  stockUnit: string;
  packageSizeAmount?: number | null;
  packageSizeUnit?: string | null;
  bottleSizeMl?: number | null;
  stockQuantity: number;
  physicalQuantity?: number | null;
  expectedQuantity?: number | null;
  variance?: number | null;
  status: 'in-stock' | 'low-stock' | 'critical-stock' | 'out-of-stock' | 'pending' | 'normal';
  imageUrl?: string;
  onClick?: () => void;
  onQuantityChange?: (productId: string, quantity: number) => void;
  showActions?: boolean;
  compact?: boolean;
  isLiquor?: boolean;
  className?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  liquor: 'Liquor & Spirits',
  beer: 'Beer',
  soda: 'Soda',
  club_soda: 'Club Soda',
  water: 'Mineral Water',
  other: 'Other',
};

const CATEGORY_COLORS: Record<string, string> = {
  liquor: 'var(--cat-liquor)',
  beer: 'var(--cat-beer)',
  soda: 'var(--cat-soda)',
  club_soda: 'var(--cat-club_soda)',
  water: 'var(--cat-water)',
  other: 'var(--cat-other)',
};

const STATUS_CONFIG = {
  'in-stock': { label: 'In Stock', className: 'product-card__status--in-stock' },
  'low-stock': { label: 'Low Stock', className: 'product-card__status--low-stock' },
  'critical-stock': { label: 'Critical', className: 'product-card__status--critical-stock' },
  'out-of-stock': { label: 'Out of Stock', className: 'product-card__status--out-of-stock' },
  'pending': { label: 'Pending Sync', className: 'product-card__status--pending' },
  'normal': { label: 'Normal', className: 'product-card__status--normal' },
};

export function ProductCard({
  id,
  name,
  brand,
  category,
  stockUnit,
  packageSizeAmount,
  packageSizeUnit,
  bottleSizeMl,
  stockQuantity,
  physicalQuantity,
  expectedQuantity,
  variance,
  status,
  imageUrl,
  onClick,
  onQuantityChange,
  showActions = true,
  compact = false,
  isLiquor = false,
  className = '',
}: ProductCardProps) {
  const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  const categoryLabel = CATEGORY_LABELS[category] || category;
  const statusConfig = STATUS_CONFIG[status];
  const isLowOrOut = status === 'low-stock' || status === 'critical-stock' || status === 'out-of-stock';
  
  // For liquor, calculate full bottles and loose ml
  const liquorBreakdown = isLiquor && bottleSizeMl ? {
    fullBottles: Math.floor(stockQuantity / bottleSizeMl),
    looseMl: stockQuantity % bottleSizeMl,
    bottleSizeMl,
  } : null;

  const handleClick = () => {
    onClick?.();
  };

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onQuantityChange?.(id, value);
  };

  return (
    <article 
      className={`product-card ${compact ? 'product-card--compact' : ''} ${className}`}
      onClick={onClick ? handleClick : undefined}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); }}}
      role={onClick ? 'button' : 'article'}
      aria-label={`${name}, ${categoryLabel}, ${formatNumber(stockQuantity)} ${stockUnit}`}
    >
      {/* Product Image */}
      <div className="product-card__image" aria-hidden="true">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="" 
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="product-card__image-placeholder">
            <CategoryIcon category={category} size={compact ? '2xl' : '3xl'} />
          </div>
        )}
        
        {/* Status badge on image */}
        {(isLowOrOut || status === 'pending') && (
          <span 
            className={`product-card__status ${statusConfig.className}`}
            style={{ 
              position: 'absolute', 
              top: 'var(--space-2)', 
              right: 'var(--space-2)',
              zIndex: 1,
              fontSize: compact ? 'var(--text-xs)' : 'var(--text-sm)',
              padding: compact ? '0.125rem 0.375rem' : '0.25rem 0.5rem'
            }}
          >
            {statusConfig.label}
          </span>
        )}
      </div>

      {/* Product Content */}
      <div className="product-card__content">
        {/* Category Badge */}
        <span 
          className="product-card__category" 
          style={{ 
            background: `${categoryColor}15`, 
            color: categoryColor,
            border: `1px solid ${categoryColor}40`
          }}
        >
          {categoryLabel}
        </span>

        {/* Product Name */}
        <h3 className="product-card__name">{name}</h3>
        
        {/* Brand */}
        {brand && (
          <p className="product-card__brand" style={{ 
            font: 'var(--font-weight-normal) var(--text-sm)/var(--leading-normal) var(--font-sans)',
            color: 'var(--text-tertiary)',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {brand}
          </p>
        )}

        {/* Product Details */}
        <div className="product-card__details">
          {/* Package Info for non-liquor */}
          {!isLiquor && packageSizeAmount && packageSizeUnit && (
            <div className="product-card__detail">
              <span className="product-card__detail-label">Pack:</span>
              <span className="product-card__detail-value">
                {formatNumber(packageSizeAmount)} {packageSizeUnit}
              </span>
            </div>
          )}

          {/* Bottle Size for liquor */}
          {isLiquor && bottleSizeMl && (
            <div className="product-card__detail">
              <span className="product-card__detail-label">Bottle:</span>
              <span className="product-card__detail-value">
                {formatNumber(bottleSizeMl)} ml
              </span>
            </div>
          )}

          {/* Stock Unit */}
          <div className="product-card__detail">
            <span className="product-card__detail-label">Unit:</span>
            <span className="product-card__detail-value" style={{ fontFamily: 'var(--font-sans)' }}>
              {stockUnit}
            </span>
          </div>
        </div>

        {/* Quantity Display */}
        <div className="product-card__quantity">
          <span className="inventory-label">
            {physicalQuantity !== null ? 'Physical:' : 'Stock:'}
          </span>

          {isLiquor && liquorBreakdown && !compact ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                <span className="inventory-num" style={{ color: 'var(--text-primary)' }}>
                  {formatNumber(liquorBreakdown.fullBottles)}
                </span>
                <span className="inventory-unit">btl</span>
                <span className="inventory-num" style={{ color: 'var(--text-secondary)' }}>
                  {formatNumber(liquorBreakdown.looseMl)}
                </span>
                <span className="inventory-unit">ml</span>
              </div>
              <div style={{
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-tertiary)',
                fontSize: 'var(--text-xs)'
              }}>
                = {formatNumber(stockQuantity)} ml
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
              <span className="inventory-num" style={{
                color: (variance ?? 0) < 0 ? 'var(--inventory-shortage)' : 'var(--text-primary)'
              }}>
                {formatNumber(physicalQuantity ?? stockQuantity)}
              </span>
              <span className="inventory-unit">{stockUnit}</span>
            </div>
          )}

          {/* Variance indicator */}
          {variance !== null && variance !== undefined && physicalQuantity !== null && (
            <span 
              className="product-card__variance"
              style={{ 
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-weight-medium)',
                color: variance > 0 ? 'var(--success-main)' : variance < 0 ? 'var(--danger-main)' : 'var(--text-tertiary)',
                marginLeft: 'var(--inline-gap-sm)'
              }}
            >
              {variance > 0 ? '+' : ''}{formatNumber(variance)} {stockUnit}
            </span>
          )}
        </div>

        {/* Status badge (when not on image) */}
        {!isLowOrOut && status !== 'pending' && (
          <span className={`product-card__status ${statusConfig.className}`}>
            {statusConfig.label}
          </span>
        )}
      </div>

      {/* Actions */}
      {showActions && !compact && (
        <div className="product-card__actions">
          <button
            className="btn btn--secondary btn--sm btn--full"
            onClick={(e) => { e.stopPropagation(); onQuantityChange?.(id, physicalQuantity ?? stockQuantity); }}
            aria-label={`Edit quantity for ${name}`}
          >
            <svg className="btn__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Count
          </button>
        </div>
      )}

      {/* Compact action for mobile list view */}
      {showActions && compact && onQuantityChange && (
        <div className="product-card__actions" style={{ padding: 'var(--space-2) var(--card-padding) var(--card-padding)', borderTop: 'none' }}>
          <input
            type="number"
            step={isLiquor ? '0.001' : '1'}
            min="0"
            value={physicalQuantity ?? stockQuantity}
            onChange={handleQuantityInput}
            onClick={(e) => e.stopPropagation()}
            className="form-input form-input--compact"
            style={{ 
              width: 'auto', 
              minWidth: '5rem',
              height: 'var(--control-height-sm)',
              padding: '0 var(--control-px-sm)',
              fontSize: 'var(--text-base)',
              fontFamily: 'var(--font-mono)',
              textAlign: 'right'
            }}
            aria-label={`Physical quantity for ${name}`}
          />
          <span className="product-card__quantity-unit" style={{ fontSize: 'var(--text-sm)' }}>{stockUnit}</span>
        </div>
      )}
    </article>
  );
}

interface CategoryIconProps {
  category: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

function CategoryIcon({ category, size = 'lg' }: CategoryIconProps) {
  const icons: Record<string, React.ReactNode> = {
    liquor: <LiquorIcon />,
    beer: <BeerIcon />,
    soda: <SodaIcon />,
    club_soda: <ClubSodaIcon />,
    water: <WaterIcon />,
    other: <OtherIcon />,
  };

  const Icon = icons[category] || icons.other;
  const sizeClass = `icon-${size}`;

  return (
    <span className={sizeClass} style={{ display: 'inline-flex', color: CATEGORY_COLORS[category] || 'var(--text-quaternary)' }}>
      {Icon}
    </span>
  );
}

function LiquorIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function BeerIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 22c-2.2 0-4-1.8-4-4v-5" />
      <path d="M10 15h.01" />
      <path d="M10 7h.01" />
      <path d="M14 7v8" />
      <path d="M6 7v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
      <path d="M6 7h12" />
    </svg>
  );
}

function SodaIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="5" ry="2" />
      <path d="M7 5V2" />
      <path d="M17 5V2" />
      <path d="M7 5v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V5" />
    </svg>
  );
}

function ClubSodaIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function WaterIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function OtherIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}