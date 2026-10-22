import { forwardRef, ButtonHTMLAttributes, useEffect } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      primary: 'btn--primary',
      secondary: 'btn--secondary',
      ghost: 'btn--ghost',
      danger: 'btn--danger',
      outline: 'btn--outline',
      success: 'btn--success',
    };

    const sizeClasses = {
      xs: 'btn--xs',
      sm: 'btn--sm',
      md: '',
      lg: 'btn--lg',
      xl: 'btn--xl',
    };

    const widthClass = fullWidth ? 'btn--full' : '';

    return (
      <button
        ref={ref}
        className={`btn ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
        disabled={disabled || loading}
        style={style}
        {...props}
      >
        {loading ? (
          <svg
            className="btn__icon animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          leftIcon
        )}
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          {children}
        </span>
        {!loading && rightIcon}
      </button>
    );
  }
);

// Enhanced button component with inventory-specific variants
Button.displayName = 'Button';

interface InventoryButtonProps extends ButtonProps {
  inventoryVariant?: 'shortage' | 'excess' | 'recorded-loss' | 'unexplained';
}

export const InventoryButton = forwardRef<HTMLButtonElement, InventoryButtonProps>(
  (
    {
      inventoryVariant,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const inventoryVariantClasses = {
      shortage: 'btn--inventory-shortage',
      excess: 'btn--inventory-excess',
      'recorded-loss': 'btn--inventory-recorded-loss',
      unexplained: 'btn--inventory-unexplained',
    };

    const variantClasses = {
      primary: 'btn--primary',
      secondary: 'btn--secondary',
      ghost: 'btn--ghost',
      danger: 'btn--danger',
      outline: 'btn--outline',
      success: 'btn--success',
    };

    const sizeClasses = {
      xs: 'btn--xs',
      sm: 'btn--sm',
      md: '',
      lg: 'btn--lg',
      xl: 'btn--xl',
    };

    const widthClass = fullWidth ? 'btn--full' : '';

    return (
      <button
        ref={ref}
        className={`btn ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${inventoryVariant ? inventoryVariantClasses[inventoryVariant] : ''} ${className}`}
        disabled={disabled || loading}
        style={style}
        {...props}
      >
        {loading ? (
          <svg
            className="btn__icon animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          leftIcon
        )}
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          {children}
        </span>
        {!loading && rightIcon}
      </button>
    );
  }
);

InventoryButton.displayName = 'InventoryButton';

Button.displayName = 'Button';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  'aria-label': string;
  children: React.ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'md', 'aria-label': ariaLabel, children, className = '', style, ...props }, ref) => {
    const sizeClasses = {
      xs: { width: 'var(--control-height-xs)', height: 'var(--control-height-xs)', iconSize: 'var(--icon-sm)' },
      sm: { width: 'var(--control-height-sm)', height: 'var(--control-height-sm)', iconSize: 'var(--icon-md)' },
      md: { width: 'var(--control-height-md)', height: 'var(--control-height-md)', iconSize: 'var(--icon-lg)' },
      lg: { width: 'var(--control-height-lg)', height: 'var(--control-height-lg)', iconSize: 'var(--icon-xl)' },
    };

    const sizes = sizeClasses[size];

    return (
      <button
        ref={ref}
        className={`icon-button ${className}`}
        aria-label={ariaLabel}
        style={{
          ...sizes,
          ...style,
        } as React.CSSProperties}
        {...props}
      >
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: sizes.iconSize, height: sizes.iconSize }}>
          {children}
        </span>
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function ButtonGroup({ children, orientation = 'horizontal', className = '' }: ButtonGroupProps) {
  return (
    <div
      className={`btn-group ${className}`}
      role="group"
      style={{
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        gap: 'var(--inline-gap-sm)',
      }}
    >
      {children}
    </div>
  );
}

// Loading spinner keyframes are injected once the component mounts (browser only).
const SPIN_STYLE_ID = 'deepa-spin-keyframes';

function useSpinKeyframes() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(SPIN_STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = SPIN_STYLE_ID;
    el.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .animate-spin {
        animation: spin 1s linear infinite;
      }
    `;
    document.head.appendChild(el);
  }, []);
}