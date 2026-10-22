import { ProductCard, ProductCardProps } from './ProductCard';
import { formatNumber } from '../../utils/format';

export interface ProductGridProps {
  products: ProductCardProps[];
  loading?: boolean;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  onProductClick?: (product: ProductCardProps) => void;
  onQuantityChange?: (productId: string, quantity: number) => void;
  showActions?: boolean;
  compact?: boolean;
  columns?: { mobile?: number; tablet?: number; desktop?: number };
  className?: string;
}

export function ProductGrid({
  products,
  loading = false,
  emptyMessage = 'No products found',
  emptyAction,
  onProductClick,
  onQuantityChange,
  showActions = true,
  compact = false,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  className = '',
}: ProductGridProps) {
  // Render skeletons while loading
  if (loading) {
    return (
      <div className="product-grid" style={{ 
        display: 'grid',
        gridTemplateColumns: `repeat(${columns.tablet}, minmax(150px, 1fr))`,
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--page-gutter)'
      }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} compact={compact} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="empty-state" style={{ gridColumn: '1 / -1', padding: 'var(--space-12) var(--space-4)' }}>
        <div className="empty-state__icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="64" height="64">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
        <h3 className="empty-state__title">{emptyMessage}</h3>
        {emptyAction && (
          <div className="empty-state__action" style={{ marginTop: 'var(--space-3)' }}>
            {emptyAction}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`product-grid ${className}`}
      style={{ 
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(150px, 1fr))`,
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--page-gutter)'
      }}
      role="list"
      aria-label="Product list"
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          {...product}
          onClick={() => onProductClick?.(product)}
          onQuantityChange={onQuantityChange}
          showActions={showActions}
          compact={compact}
        />
      ))}
    </div>
  );
}

function ProductCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <article className="product-card" style={{ pointerEvents: 'none' }}>
      <div className="product-card__image skeleton" style={{ 
        aspectRatio: '1', 
        borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
        height: compact ? '6rem' : '8rem'
      }} />
      <div className="product-card__content" style={{ padding: 'var(--card-padding)' }}>
        <div className="skeleton" style={{ 
          height: '1.25rem', 
          width: '60%', 
          borderRadius: 'var(--radius-full)',
          marginBottom: 'var(--inline-gap-sm)'
        }} />
        <div className="skeleton" style={{ 
          height: '1.125rem', 
          width: '80%', 
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-3)'
        }} />
        <div className="skeleton" style={{ 
          height: '1rem', 
          width: '40%', 
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--inline-gap)'
        }} />
        <div className="skeleton" style={{ 
          height: '1rem', 
          width: '50%', 
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-3)'
        }} />
        <div className="skeleton" style={{ 
          height: '1.5rem', 
          width: '100%', 
          borderRadius: 'var(--radius-md)'
        }} />
      </div>
    </article>
  );
}

export function ProductList({
  products,
  loading = false,
  emptyMessage = 'No products found',
  emptyAction,
  onProductClick,
  onQuantityChange,
  showActions = true,
  className = '',
}: Omit<ProductGridProps, 'compact' | 'columns'>) {
  if (loading) {
    return (
      <div className="list" role="list" aria-label="Product list">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductListItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 'var(--space-12) var(--space-4)' }}>
        <div className="empty-state__icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="64" height="64">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
        <h3 className="empty-state__title">{emptyMessage}</h3>
        {emptyAction && (
          <div className="empty-state__action" style={{ marginTop: 'var(--space-3)' }}>
            {emptyAction}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`list ${className}`} role="list" aria-label="Product list">
      {products.map((product) => (
        <ProductListItem
          key={product.id}
          product={product}
          onClick={() => onProductClick?.(product)}
          onQuantityChange={onQuantityChange}
          showActions={showActions}
        />
      ))}
    </div>
  );
}

interface ProductListItemProps {
  product: ProductCardProps;
  onClick?: () => void;
  onQuantityChange?: (productId: string, quantity: number) => void;
  showActions?: boolean;
}

function ProductListItem({ product, onClick, onQuantityChange, showActions = true }: ProductListItemProps) {
  const { id, name, brand, category, stockUnit, stockQuantity, physicalQuantity, variance, status, imageUrl, isLiquor, bottleSizeMl } = product;
  const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  const categoryLabel = CATEGORY_LABELS[category] || category;
  const statusConfig = STATUS_CONFIG[status];

  return (
    <div 
      className="list-item"
      onClick={onClick}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }}}
      role={onClick ? 'button' : 'listitem'}
    >
      <div className="list-item__image" style={{ 
        width: '3.5rem', 
        height: '3.5rem', 
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0
      }}>
        {imageUrl ? (
          <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <CategoryIcon category={category} size="xl" />
        )}
      </div>
      
      <div className="list-item__content" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-gap)', flexWrap: 'wrap', marginBottom: 'var(--inline-gap-sm)' }}>
          <span 
            className="product-card__category"
            style={{ 
              background: `${categoryColor}15`, 
              color: categoryColor,
              border: `1px solid ${categoryColor}40`,
              fontSize: 'var(--text-xs)',
              padding: '0.125rem 0.5rem'
            }}
          >
            {categoryLabel}
          </span>
          {status !== 'in-stock' && status !== 'normal' && (
            <span className={`badge ${statusConfig.className.replace('product-card__status--', 'badge--')}`} style={{ fontSize: 'var(--text-xs)' }}>
              {statusConfig.label}
            </span>
          )}
        </div>
        
        <h4 className="list-item__title" style={{ marginBottom: 'var(--inline-gap-sm)' }}>
          {name}
        </h4>
        
        {brand && (
          <p className="list-item__subtitle">{brand}</p>
        )}
      </div>

      <div className="list-item__meta">
        <div style={{ textAlign: 'right' }}>
          <div className="list-item__value" style={{ 
            color: variance !== null && variance! < 0 ? 'var(--danger-main)' : 'var(--text-primary)' 
          }}>
            {formatNumber(physicalQuantity ?? stockQuantity)}
          </div>
          <div className="list-item__unit">{stockUnit}</div>
        </div>
        
        {variance !== null && physicalQuantity !== null && (
          <span className="badge" style={{ 
            fontSize: 'var(--text-xs)',
            background: variance! > 0 ? 'var(--success-bg)' : variance! < 0 ? 'var(--danger-bg)' : 'var(--surface-elevated)',
            color: variance! > 0 ? 'var(--success-on)' : variance! < 0 ? 'var(--danger-on)' : 'var(--text-tertiary)'
          }}>
            {variance! > 0 ? '+' : ''}{formatNumber(variance!)} {stockUnit}
          </span>
        )}

        {showActions && onQuantityChange && (
          <input
            type="number"
            step={isLiquor ? '0.001' : '1'}
            min="0"
            value={physicalQuantity ?? stockQuantity}
            onChange={(e) => { e.stopPropagation(); onQuantityChange(id, parseFloat(e.target.value) || 0); }}
            className="form-input"
            style={{ 
              width: '5.5rem',
              height: 'var(--control-height-sm)',
              padding: '0 var(--control-px-sm)',
              fontSize: 'var(--text-base)',
              fontFamily: 'var(--font-mono)',
              textAlign: 'right',
              marginTop: 'var(--inline-gap-sm)'
            }}
            aria-label={`Physical quantity for ${name}`}
          />
        )}
      </div>
    </div>
  );
}

function ProductListItemSkeleton() {
  return (
    <div className="list-item skeleton" style={{ 
      pointerEvents: 'none',
      padding: 'var(--space-3) var(--space-4)',
      borderRadius: 'var(--radius-lg)'
    }}>
      <div className="skeleton" style={{ width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-lg)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--inline-gap)' }}>
        <div className="skeleton" style={{ height: '1.25rem', width: '30%', borderRadius: 'var(--radius-full)' }} />
        <div className="skeleton" style={{ height: '1.125rem', width: '60%', borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ height: '0.875rem', width: '40%', borderRadius: 'var(--radius-md)' }} />
      </div>
      <div className="skeleton" style={{ width: '5rem', height: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'right' }} />
    </div>
  );
}

// Re-export constants for use in list item
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

function CategoryIcon({ category, size = 'lg' }: { category: string; size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' }) {
  const icons: Record<string, React.ReactNode> = {
    liquor: <LiquorIcon />,
    beer: <BeerIcon />,
    soda: <SodaIcon />,
    club_soda: <ClubSodaIcon />,
    water: <WaterIcon />,
    other: <OtherIcon />,
  };

  const Icon = icons[category] || icons.other;
  
  return (
    <span style={{ display: 'inline-flex', color: 'var(--text-quaternary)' }}>
      {Icon}
    </span>
  );
}

function LiquorIcon({ className = '' }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>;
}
function BeerIcon({ className = '' }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 22c-2.2 0-4-1.8-4-4v-5" /><path d="M10 15h.01" /><path d="M10 7h.01" /><path d="M14 7v8" /><path d="M6 7v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" /><path d="M6 7h12" /></svg>;
}
function SodaIcon({ className = '' }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><ellipse cx="12" cy="5" rx="5" ry="2" /><path d="M7 5V2" /><path d="M17 5V2" /><path d="M7 5v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V5" /></svg>;
}
function ClubSodaIcon({ className = '' }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>;
}
function WaterIcon({ className = '' }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>;
}
function OtherIcon({ className = '' }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
}