import { Outlet, useLocation } from 'react-router-dom';
import { TopAppBar } from './ui/TopAppBar';
import { BottomNav, useBottomNavItems } from './ui/BottomNav';
import { MobileNavigationDrawer, MobileNavigationTrigger } from './ui/MobileNavigationDrawer';
import { ToastProvider } from './ui/Toast';
import { ConnectionStatus } from './ui/ConnectionStatus';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

function InnerLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const navItems = useBottomNavItems(user?.role || null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Pages that don't need the top app bar
  const noHeaderPages = ['/login'];
  const showHeader = !noHeaderPages.includes(location.pathname);

  // Pages that don't need bottom nav
  const noBottomNavPages = ['/login'];
  const showBottomNav = !noBottomNavPages.includes(location.pathname);

  return (
    <div className="app-layout" style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)'
    } as React.CSSProperties}>
      {showHeader && (
        <TopAppBar
          title={getPageTitle(location.pathname)}
          showSearch={shouldShowSearch(location.pathname)}
          actions={
            <MobileNavigationTrigger 
              onClick={() => setDrawerOpen(true)} 
              userRole={user?.role || null} 
            />
          }
        />
      )}

      <main
        className="app-main"
        role="main"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          paddingBottom: showBottomNav ? 'calc(var(--bottom-nav-height) + var(--space-4))' : 'var(--space-4)'
        }}
      >
        <Outlet />
      </main>

      {showBottomNav && <BottomNav items={navItems} userRole={user?.role || null} />}
      <ConnectionStatus showWhenOnline={false} />
      <MobileNavigationDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        userRole={user?.role || null} 
      />
    </div>
  );
}

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/': 'Dashboard',
    '/inventory': 'Daily Inventory',
    '/reconciliation': 'Reconciliation',
    '/products': 'Products',
    '/suppliers': 'Suppliers',
    '/purchase-orders': 'Purchase Orders',
    '/goods-receipts': 'Goods Receipts',
    '/reports': 'Reports',
    '/audit-log': 'Audit Log',
    '/users': 'User Management',
  };

  // Check for exact matches first
  if (titles[pathname]) return titles[pathname];

  // Check for nested routes
  for (const [path, title] of Object.entries(titles)) {
    if (path !== '/' && pathname.startsWith(path)) {
      return title;
    }
  }

  return 'Deepa Inventory';
}

function shouldShowSearch(pathname: string): boolean {
  const searchPages = ['/', '/inventory', '/products', '/reports'];
  return searchPages.some(page => pathname === page || pathname.startsWith(page + '/'));
}

export function AppLayout() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <InnerLayout />
      </ToastProvider>
    </ThemeProvider>
  );
}