import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  persistent?: boolean;
}

export interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  className?: string;
}

function ToastItem({ 
  toast, 
  onDismiss 
}: { 
  toast: Toast; 
  onDismiss: (id: string) => void; 
}) {
  const icons = {
    success: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true" style={{ color: 'var(--success-main)', flexShrink: 0 }}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    error: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true" style={{ color: 'var(--danger-main)', flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    warning: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true" style={{ color: 'var(--warning-main)', flexShrink: 0 }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    info: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true" style={{ color: 'var(--info-main)', flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
  };

  return (
    <div 
      className={`toast toast--${toast.type}`}
      role="alert"
      aria-live="polite"
      style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'space-between', 
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-elevated)',
        border: `1px solid var(--border-default)`,
        boxShadow: 'var(--shadow-lg)',
        minWidth: '16rem',
        maxWidth: '28rem',
        animation: 'slideInToast var(--duration-normal) var(--ease-out)'
      }}
    >
      <div style={{ display: 'flex', gap: 'var(--space-3)', flex: 1 }}>
        {icons[toast.type]}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            font: 'var(--font-weight-semibold) var(--text-sm)/var(--leading-normal) var(--font-sans)',
            color: 'var(--text-primary)',
            marginBottom: toast.message ? 'var(--inline-gap-sm)' : 0
          }}>
            {toast.title}
          </div>
          {toast.message && (
            <div style={{ 
              font: 'var(--font-weight-normal) var(--text-sm)/var(--leading-normal) var(--font-sans)',
              color: 'var(--text-tertiary)'
            }}>
              {toast.message}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-gap)' }}>
        {toast.action && (
          <button
            className="toast__action"
            onClick={() => { toast.action.onClick(); onDismiss(toast.id); }}
            style={{
              padding: 'var(--inline-gap-sm) var(--inline-gap)',
              border: '1px solid currentColor',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              color: 'inherit',
              font: 'var(--font-weight-medium) var(--text-xs)/1 var(--font-sans)',
              cursor: 'pointer',
              transition: 'background var(--duration-fast) var(--ease-out)'
            }}
          >
            {toast.action.label}
          </button>
        )}
        {!toast.persistent && (
          <button
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '1.5rem',
              height: '1.5rem',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              transition: 'background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss, className = '' }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  const containerContent = (
    <div 
      className={`toast-container ${className}`}
      style={{
        position: 'fixed',
        bottom: 'calc(var(--bottom-nav-height) + var(--space-4))',
        left: 'var(--page-gutter)',
        right: 'var(--page-gutter)',
        zIndex: 'var(--z-toast)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        pointerEvents: 'none',
        maxHeight: '50vh',
        overflowY: 'auto',
      }}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );

  if (typeof window === 'undefined') {
    return containerContent;
  }

  return createPortal(containerContent, document.body);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    
    if (!toast.persistent && (toast.duration ?? 4000) > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration ?? 4000);
    }
    
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const success = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'success', title, message, ...options });
  }, [addToast]);

  const error = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'error', title, message, persistent: true, ...options });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'warning', title, message, ...options });
  }, [addToast]);

  const info = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'info', title, message, ...options });
  }, [addToast]);

  return {
    toasts,
    addToast,
    dismissToast,
    dismissAll,
    success,
    error,
    warning,
    info,
  };
}

// ToastProvider for context
import { createContext, useContext, ReactNode } from 'react';

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
  success: (title: string, message?: string, options?: Partial<Toast>) => string;
  error: (title: string, message?: string, options?: Partial<Toast>) => string;
  warning: (title: string, message?: string, options?: Partial<Toast>) => string;
  info: (title: string, message?: string, options?: Partial<Toast>) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}