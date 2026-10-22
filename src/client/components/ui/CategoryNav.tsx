import { useMemo } from 'react';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';

export interface Category {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  count?: number;
}

export interface CategoryNavProps {
  categories: Category[];
  currentCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  showAll?: boolean;
  allLabel?: string;
  allCount?: number;
  className?: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'liquor', label: 'Liquor & Spirits', color: '#f59e0b' },
  { id: 'beer', label: 'Beer', color: '#8b5cf6' },
  { id: 'soda', label: 'Soda', color: '#06b6d4' },
  { id: 'club_soda', label: 'Club Soda', color: '#10b981' },
  { id: 'water', label: 'Mineral Water', color: '#3b82f6' },
  { id: 'other', label: 'Other', color: '#94a3b8' },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  liquor: <LiquorIcon />,
  beer: <BeerIcon />,
  soda: <SodaIcon />,
  club_soda: <ClubSodaIcon />,
  water: <WaterIcon />,
  other: <OtherIcon />,
};

function LiquorIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function BeerIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="5" ry="2" />
      <path d="M7 5V2" />
      <path d="M17 5V2" />
      <path d="M7 5v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V5" />
    </svg>
  );
}

function ClubSodaIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function WaterIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function OtherIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function CategoryNav({
  categories = DEFAULT_CATEGORIES,
  currentCategory,
  onCategoryChange,
  showAll = true,
  allLabel = 'All',
  allCount,
  className = '',
}: CategoryNavProps) {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const activeCategory = currentCategory || searchParams.get('category') || 'all';

  const allCategories = useMemo(() => {
    const cats = [...categories];
    if (showAll) {
      cats.unshift({ id: 'all', label: allLabel, count: allCount });
    }
    return cats;
  }, [categories, showAll, allLabel, allCount]);

  const handleCategoryClick = (categoryId: string) => {
    onCategoryChange?.(categoryId);
    
    // Update URL search params
    const newParams = new URLSearchParams(searchParams);
    if (categoryId === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', categoryId);
    }
    // Navigate with new search params
    window.history.pushState({}, '', `${location.pathname}?${newParams.toString()}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <nav 
      className={`category-nav ${className}`} 
      role="navigation" 
      aria-label="Product categories"
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 'var(--inline-gap-sm)',
        padding: 'var(--space-3) var(--page-gutter)',
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {allCategories.map((category) => {
        const isActive = activeCategory === category.id;
        const categoryColor = category.color || 'var(--cat-other)';
        
        return (
          <NavLink
            key={category.id}
            to={category.id === 'all' ? location.pathname : `${location.pathname}?category=${category.id}`}
            className={`category-chip ${isActive ? 'category-chip--active' : ''}`}
            style={{ 
              scrollSnapAlign: 'start',
            } as React.CSSProperties}
            onClick={(e) => {
              e.preventDefault();
              handleCategoryClick(category.id);
            }}
            aria-current={isActive ? 'true' : undefined}
            aria-label={`${category.label}${category.count !== undefined ? `, ${category.count} products` : ''}`}
          >
            {category.icon || CATEGORY_ICONS[category.id] || (
              <span 
                className="category-chip__icon" 
                style={{ 
                  width: 'var(--icon-sm)', 
                  height: 'var(--icon-sm)', 
                  color: isActive ? 'var(--text-on-brand)' : categoryColor 
                }}
                aria-hidden="true"
              >
                {CATEGORY_ICONS[category.id]}
              </span>
            )}
            <span className="category-chip__label">{category.label}</span>
            {category.count !== undefined && (
              <span 
                className="category-chip__count"
                style={{ 
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--surface-active)',
                  color: isActive ? 'var(--text-on-brand)' : 'var(--text-tertiary)'
                }}
              >
                {category.count}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

export function useCategoryFilter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || 'all';
  
  const setCategory = (newCategory: string) => {
    const params = new URLSearchParams(searchParams);
    if (newCategory === 'all') {
      params.delete('category');
    } else {
      params.set('category', newCategory);
    }
    setSearchParams(params);
  };
  
  return { category, setCategory };
}