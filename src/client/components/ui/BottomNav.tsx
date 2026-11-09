import { NavLink, useLocation } from 'react-router-dom';

export interface BottomNavItem {
  path: string;
  label: string;
  icon: React.ReactNode | ((props: { className?: string }) => React.ReactNode);
  badge?: number;
  badgeColor?: 'danger' | 'warning';
  adminOnly?: boolean;
  userRole?: string | null;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  userRole?: string | null;
  className?: string;
}

const NAV_ITEMS: BottomNavItem[] = [
  { path: '/', label: 'Home', icon: HomeIcon },
  { path: '/inventory', label: 'Inventory', icon: InventoryIcon },
  { path: '/reconciliation', label: 'Stocktake', icon: ReconcileIcon },
  { path: '/reports', label: 'Reports', icon: ReportsIcon },
  { path: '/more', label: 'More', icon: MoreIcon },
];

export function HomeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function InventoryIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

export function ReconcileIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function ProductsIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 7l-8-4-8 4" />
      <path d="M4 15l8 4 8-4" />
      <path d="M12 3v18" />
    </svg>
  );
}

export function ReportsIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export function MoreIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

/* Enhanced BottomNav with inventory-specific variants */
interface InventoryBottomNavProps extends BottomNavProps {
  inventoryVariant?: 'shortage' | 'excess' | 'recorded-loss' | 'unexplained';
  className?: string;
}

export function InventoryBottomNav({ items = NAV_ITEMS, className = '', inventoryVariant }: InventoryBottomNavProps) {
  const location = useLocation();

  const variantClasses = {
    shortage: 'bottom-nav--inventory-shortage',
    excess: 'bottom-nav--inventory-excess',
    'recorded-loss': 'bottom-nav--inventory-recorded-loss',
    unexplained: 'bottom-nav--inventory-unexplained',
  };

  return (
    <nav className={`bottom-nav ${inventoryVariant ? variantClasses[inventoryVariant] : ''} ${className}`} aria-label="Main navigation">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
          aria-current={location.pathname === item.path ? 'page' : undefined}
        >
          {typeof item.icon === 'function' ? item.icon({ className: 'bottom-nav__icon' }) : item.icon}
          <span className="bottom-nav__label">{item.label}</span>
          {item.badge && (
            <span className={`bottom-nav__badge badge--${item.badgeColor || 'info'}`}>
              {item.badge}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function BottomNav({ items = NAV_ITEMS, className = '', userRole }: BottomNavProps & { userRole?: string | null }) {
  const location = useLocation();

  const filteredItems = items.filter(item => {
    if (item.adminOnly && userRole !== 'admin') return false;
    return true;
  });

  return (
    <nav className={`bottom-nav ${className}`} role="navigation" aria-label="Main navigation">
      {filteredItems.map((item) => {
        const isActive = location.pathname === item.path || 
          (item.path !== '/' && location.pathname.startsWith(item.path));
        
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            style={{ position: 'relative' }}
          >
            <span className="bottom-nav__icon" aria-hidden="true">
              {typeof item.icon === 'function' ? item.icon({ className: 'bottom-nav__icon-svg' }) : item.icon}
            </span>
            <span className="bottom-nav__label">{item.label}</span>
            {item.badge && (
              <span 
                className={`bottom-nav__badge badge badge--${item.badgeColor || 'danger'}`}
                aria-label={`${item.badge} notifications for ${item.label}`}
              >
                {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

export function useBottomNavItems(userRole?: string | null): BottomNavItem[] {
  return [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/inventory', label: 'Inventory', icon: InventoryIcon },
    { path: '/reconciliation', label: 'Stocktake', icon: ReconcileIcon },
    { path: '/reports', label: 'Reports', icon: ReportsIcon },
    { path: '/more', label: 'More', icon: MoreIcon, adminOnly: false, userRole },
  ];
}

function SuppliersIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function OrdersIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function ReceiptsIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 8V6a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 6v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
      <path d="M3.3 7 3 9" />
      <path d="M12 22v-8" />
      <path d="M5 11a2 2 0 0 1 2 2 3.9 3.9 0 0 0 1.7 2.9" />
    </svg>
  );
}

function AuditIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function UsersIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}