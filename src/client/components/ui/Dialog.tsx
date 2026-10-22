import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      dialogRef.current?.focus();
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }

      // Trap focus
      if (e.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const sizeStyles: Record<string, { maxWidth: string }> = {
    sm: { maxWidth: '20rem' },
    md: { maxWidth: '28rem' },
    lg: { maxWidth: '40rem' },
    xl: { maxWidth: '56rem' },
    full: { maxWidth: 'calc(100vw - 2rem)' },
  };

  const dialogContent = (
    <div className="dialog-backdrop" onClick={closeOnOverlayClick ? onClose : undefined} aria-hidden="true" />
  );

  const dialog = (
    <div
      ref={dialogRef}
      className={`dialog ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      style={{ ...sizeStyles[size] }}
      tabIndex={-1}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="dialog__header">
        <h2 id="dialog-title" className="dialog__title">{title}</h2>
        {showCloseButton && (
          <button
            className="dialog__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      <div className="dialog__body">
        {children}
      </div>
      {footer && (
        <div className="dialog__footer">
          {footer}
        </div>
      )}
    </div>
  );

  if (typeof window === 'undefined') {
    return dialogContent;
  }

  return createPortal(
    <>
      {dialogContent}
      {dialog}
    </>,
    document.body
  );
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'warning';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
}: ConfirmDialogProps) {
  const variantClasses = {
    danger: 'btn--danger',
    primary: 'btn--primary',
    warning: 'btn--warning',
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="dialog__body" style={{ padding: 'var(--space-4)' }}>
        <p style={{ 
          font: 'var(--font-weight-normal) var(--text-base)/var(--leading-relaxed) var(--font-sans)',
          color: 'var(--text-secondary)',
          margin: 0
        }}>
          {message}
        </p>
      </div>
      <div className="dialog__footer">
        <button 
          className="btn btn--secondary"
          onClick={onClose}
          disabled={loading}
        >
          {cancelLabel}
        </button>
        <button 
          className={`btn ${variantClasses[variant]}`}
          onClick={onConfirm}
          disabled={loading}
          autoFocus
        >
          {loading ? (
            <>
              <svg className="btn__icon animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Processing...
            </>
          ) : (
            confirmLabel
          )}
        </button>
      </div>
    </Dialog>
  );
}

export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel = 'OK',
  variant = 'info',
}: AlertDialogProps) {
  const variantIcons = {
    info: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="48" height="48" aria-hidden="true" style={{ color: 'var(--info-main)' }}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
    success: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="48" height="48" aria-hidden="true" style={{ color: 'var(--success-main)' }}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    warning: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="48" height="48" aria-hidden="true" style={{ color: 'var(--warning-main)' }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    danger: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="48" height="48" aria-hidden="true" style={{ color: 'var(--danger-main)' }}>
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={false}
    >
      <div className="dialog__body" style={{ 
        padding: 'var(--space-6) var(--space-4)', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-3)'
      }}>
        <div>{variantIcons[variant]}</div>
        <p style={{ 
          font: 'var(--font-weight-normal) var(--text-base)/var(--leading-relaxed) var(--font-sans)',
          color: 'var(--text-secondary)',
          margin: 0
        }}>
          {message}
        </p>
      </div>
      <div className="dialog__footer" style={{ justifyContent: 'center' }}>
        <button 
          className="btn btn--primary"
          onClick={onClose}
          autoFocus
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}