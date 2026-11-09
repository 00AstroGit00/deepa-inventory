import { useEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BottomNavItem, useBottomNavItems } from './BottomNav';

interface MobileNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string | null;
}

function MenuIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function MobileNavigationDrawer({ isOpen, onClose, userRole }: MobileNavigationDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const location = useLocation();
  const navItems = useBottomNavItems(userRole);

  const filteredItems = navItems.filter(item => {
    if (item.adminOnly && userRole !== 'admin') return false;
    return true;
  });

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      
      // Focus the close button or first nav item
      setTimeout(() => {
        const closeButton = drawerRef.current?.querySelector('.mobile-drawer__close') as HTMLElement;
        closeButton?.focus();
      }, 0);
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Combined keyboard handler for Escape and focus trap
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    // Escape key to close
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    // Focus trap on Tab
    if (event.key !== 'Tab') return;

    const focusableElements = drawerRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements?.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement || !lastElement) return;

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="mobile-drawer__backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={drawerRef}
        className="mobile-drawer open"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <header className="mobile-drawer__header">
          <h2 className="mobile-drawer__title">Navigation</h2>
          <button
            className="mobile-drawer__close"
            onClick={onClose}
            aria-label="Close navigation drawer"
          >
            <CloseIcon className="mobile-drawer__icon" />
          </button>
        </header>
        
        <nav className="mobile-drawer__nav">
          <ul className="mobile-drawer__list" role="list">
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              
              return (
                <li key={item.path} className="mobile-drawer__list-item">
                  <NavLink
                    to={item.path}
                    className={`mobile-drawer__link ${isActive ? 'mobile-drawer__link--active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={onClose}
                  >
                    <span className="mobile-drawer__icon" aria-hidden="true">
                      {typeof item.icon === 'function' 
                        ? item.icon({ className: 'mobile-drawer__icon-svg' }) 
                        : item.icon}
                    </span>
                    <span className="mobile-drawer__label">{item.label}</span>
                    {item.badge && (
                      <span 
                        className={`mobile-drawer__badge badge badge--${item.badgeColor || 'danger'}`}
                        aria-label={`${item.badge} notifications for ${item.label}`}
                      >
                        {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <footer className="mobile-drawer__footer">
          <p className="mobile-drawer__version">Deepa Inventory v1.0</p>
        </footer>
      </aside>
    </>
  );
}

export function MobileNavigationTrigger({ onClick, userRole }: { onClick: () => void; userRole?: string | null }) {
  return (
    <button
      className="mobile-drawer__trigger"
      onClick={onClick}
      aria-label="Open navigation menu"
      aria-expanded="false"
      aria-controls="mobile-drawer"
      type="button"
    >
      <MenuIcon className="mobile-drawer__trigger-icon" />
    </button>
  );
}