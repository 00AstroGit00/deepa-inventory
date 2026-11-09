import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { api } from './api';
import { TopAppBar, BottomNav, ToastContainer, ConnectionStatus } from './components/ui';
import { Dashboard } from './pages/Dashboard';
import { DailyInventory } from './pages/DailyInventory';
import { Reconciliation } from './pages/Reconciliation';
import { Products } from './pages/Products';
import { Suppliers } from './pages/Suppliers';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { GoodsReceipts } from './pages/GoodsReceipts';
import { Reports } from './pages/Reports';
import { Users } from './pages/Users';
import { AuditLog } from './pages/AuditLog';
import { Login } from './pages/Login';
import { HomeIcon, InventoryIcon, ReconcileIcon, ReportsIcon } from './components/ui/BottomNav';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
        <div className="spinner" style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading Deepa Inventory...</div>
      </div>
    );
  }

  if (!user && currentPath !== '/login') {
    if (currentPath !== '/login') {
      setCurrentPath('/login');
    }
  }

  const renderPage = () => {
    if (!user || currentPath === '/login') {
      return <Login />;
    }
    switch (currentPath) {
      case '/':
      case '/dashboard':
        return <Dashboard />;
      case '/inventory':
        return <DailyInventory />;
      case '/reconciliation':
        return <Reconciliation />;
      case '/products':
        return <Products />;
      case '/suppliers':
        return <Suppliers />;
      case '/purchase-orders':
        return <PurchaseOrders />;
      case '/goods-receipts':
        return <GoodsReceipts />;
      case '/reports':
        return <Reports />;
      case '/users':
        return <Users />;
      case '/audit-log':
        return <AuditLog />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      {user && (
        <TopAppBar
          title="Deepa Liquor Inventory"
          userRole={user.role}
          onLogout={async () => {
            await logout();
            window.history.pushState({}, '', '/login');
            setCurrentPath('/login');
          }}
        />
      )}
      
      <main style={{ flex: 1, paddingBottom: user ? '5rem' : '0' }}>
        {renderPage()}
      </main>

      <ConnectionStatus />

      {user && <BottomNav items={[
        { path: '/', label: 'Home', icon: HomeIcon },
        { path: '/inventory', label: 'Inventory', icon: InventoryIcon },
        { path: '/reconciliation', label: 'Stocktake', icon: ReconcileIcon },
        { path: '/reports', label: 'Reports', icon: ReportsIcon },
      ]} />}

      {toastMessage && (
        <ToastContainer toasts={[{ id: '1', type: 'info', title: toastMessage }]} onDismiss={() => setToastMessage(null)} />
      )}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;