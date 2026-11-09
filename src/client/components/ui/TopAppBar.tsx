import { useRef, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSearch } from '../../hooks/useSearch';

export interface TopAppBarProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  showBarcodeScanner?: boolean;
  onBarcodeScan?: (barcode: string) => void;
  userRole?: string | null;
  onLogout?: () => void;
}

export function TopAppBar({
  title,
  subtitle,
  showSearch = true,
  onSearch,
  searchPlaceholder = 'Search products, barcode, SKU...',
  actions,
  showBackButton = false,
  onBack,
  showBarcodeScanner = true,
  onBarcodeScan,
}: TopAppBarProps) {
  const location = useLocation();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { searchQuery, setSearchQuery, clearSearch } = useSearch();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleBarcodeScan = (barcode: string) => {
    setSearchQuery(barcode);
    onSearch?.(barcode);
    onBarcodeScan?.(barcode);
  };

  const handleSearchFocus = () => setIsSearchFocused(true);
  const handleSearchBlur = () => setIsSearchFocused(false);

  const handleClearSearch = () => {
    clearSearch();
    onSearch?.('');
    searchInputRef.current?.focus();
  };

  return (
    <header className="top-app-bar" role="banner">
      <div className="top-app-bar__start" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1 }}> 
        {showBackButton ? (
          <button
            className="icon-button"
            onClick={onBack}
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        ) : (
          <NavLink to="/" className="top-app-bar__brand" aria-label="Deepa Inventory Home">
            <div className="top-app-bar__logo" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="top-app-bar__title">Deepa</span>
          </NavLink>
        )}

        {showSearch && (
          <div className="search-bar" style={{ flex: 1, maxWidth: isSearchFocused ? 'none' : '400px', transition: 'max-width var(--duration-normal) var(--ease-out)' }}>
            <svg className="search-bar__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={searchInputRef}
              type="search"
              className="search-bar__input"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              aria-label="Search inventory"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            {searchQuery && (
              <button
                className="search-bar__clear"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="top-app-bar__actions" style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-gap-sm)' }}>
        {actions}
        {/* Theme toggle will be added here */}
        <ThemeToggle />
      </div>
    </header>
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('deepa-theme') === 'dark' ||
        (!localStorage.getItem('deepa-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('deepa-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('deepa-theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      className="icon-button"
      onClick={() => setIsDark(!isDark)}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
    >
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}