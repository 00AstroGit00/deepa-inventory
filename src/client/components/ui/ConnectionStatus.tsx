import { useEffect, useState } from 'react';

export function ConnectionStatus({ 
  showWhenOnline = false, 
  className = '' 
}: { 
  showWhenOnline?: boolean; 
  className?: string; 
}) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show anything if online and not configured to show
  if (isOnline && !showWhenOnline && !wasOffline) {
    return null;
  }

  // Don't show if online and was never offline (unless showWhenOnline)
  if (isOnline && !showWhenOnline && !wasOffline) {
    return null;
  }

  return (
    <div
      className={`connection-status ${className}`}
      style={{
        position: 'fixed',
        bottom: 'calc(var(--bottom-nav-height) + var(--space-3))',
        left: 'var(--page-gutter)',
        right: 'var(--page-gutter)',
        zIndex: 'var(--z-toast)',
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        animation: 'slideInToast var(--duration-normal) var(--ease-out)',
      }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        style={{
          pointerEvents: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--inline-gap-sm)',
          padding: 'var(--space-2) var(--space-3)',
          borderRadius: 'var(--radius-full)',
          background: isOnline ? 'var(--success-bg)' : 'var(--danger-bg)',
          border: `1px solid ${isOnline ? 'var(--success-main)' : 'var(--danger-main)'}`,
          color: isOnline ? 'var(--success-on)' : 'var(--danger-on)',
          font: 'var(--font-weight-medium) var(--text-sm)/1 var(--font-sans)',
          boxShadow: 'var(--shadow-lg)',
          maxWidth: '28rem',
        }}
      >
        {isOnline ? (
          <>
            <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Back online - syncing data...</span>
          </>
        ) : (
          <>
            <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 12 18.75a10.94 10.94 0 0 1-4.72-7.69" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
            <span>Offline - changes saved locally</span>
          </>
        )}
      </div>
    </div>
  );
}

// Hook for components that need connection state
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}