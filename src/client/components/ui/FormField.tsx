import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, useEffect } from 'react';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, required, helpText, error, children, className = '' }: FormFieldProps) {
  const errorId = error ? `error-${Math.random().toString(36).slice(2, 9)}` : undefined;
  const helpId = helpText ? `help-${Math.random().toString(36).slice(2, 9)}` : undefined;

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label className="form-label" style={{ display: 'block' }}>
          {label}
          {required && <span className="form-label__required" aria-hidden="true">*</span>}
        </label>
      )}
      <div>
        {typeof children === 'function' 
          ? children({ errorId, helpId }) 
          : children
        }
      </div>
      {helpText && !error && (
        <p id={helpId} className="form-help" style={{ margin: 'var(--inline-gap-sm) 0 0' }}>
          {helpText}
        </p>
      )}
      {error && (
        <p id={errorId} className="form-error" role="alert" style={{ margin: 'var(--inline-gap-sm) 0 0' }}>
          {error}
        </p>
      )}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      required,
      helpText,
      error,
      leftIcon,
      rightIcon,
      leftElement,
      rightElement,
      className = '',
      style,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    const errorId = error ? `error-${inputId}` : undefined;
    const helpId = helpText ? `help-${inputId}` : undefined;

    const hasLeftElement = leftIcon || leftElement;
    const hasRightElement = rightIcon || rightElement;

    return (
      <FormField label={label} required={required} helpText={!error ? helpText : undefined} error={error}>
        {({ errorId: ctxErrorId, helpId: ctxHelpId }: { errorId: string; helpId: string }) => (
          <div className="form-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}> 
            {hasLeftElement && (
              <div className="form-input__left" style={{ 
                position: 'absolute', 
                left: 'var(--input-px)', 
                display: 'flex', 
                alignItems: 'center', 
                color: 'var(--text-tertiary)',
                pointerEvents: 'none',
                zIndex: 1
              }}>
                {leftElement || leftIcon}
              </div>
            )}
            <input
              ref={ref}
              id={inputId}
              className={`form-input ${error ? 'form-input--error' : ''} ${className}`}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? ctxErrorId : helpText ? ctxHelpId : undefined}
              style={{
                paddingLeft: hasLeftElement ? 'calc(var(--input-px) + 1.5rem + var(--inline-gap))' : 'var(--input-px)',
                paddingRight: hasRightElement ? 'calc(var(--input-px) + 1.5rem + var(--inline-gap))' : 'var(--input-px)',
                ...style,
              }}
              {...props}
            />
            {hasRightElement && (
              <div className="form-input__right" style={{ 
                position: 'absolute', 
                right: 'var(--input-px)', 
                display: 'flex', 
                alignItems: 'center', 
                color: 'var(--text-tertiary)',
                pointerEvents: 'none',
                zIndex: 1
              }}>
                {rightElement || rightIcon}
              </div>
            )}
          </div>
        )}
      </FormField>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
  helpText?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      required,
      helpText,
      error,
      className = '',
      style,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;
    const errorId = error ? `error-${textareaId}` : undefined;
    const helpId = helpText ? `help-${textareaId}` : undefined;

    return (
      <FormField label={label} required={required} helpText={!error ? helpText : undefined} error={error}>
        {({ errorId: ctxErrorId, helpId: ctxHelpId }: { errorId: string; helpId: string }) => (
          <textarea
            ref={ref}
            id={textareaId}
            className={`form-textarea ${error ? 'form-input--error' : ''} ${className}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? ctxErrorId : helpText ? ctxHelpId : undefined}
            style={{
              minHeight: '100px',
              resize: 'vertical',
              fontFamily: 'inherit',
              ...style,
            }}
            {...props}
          />
        )}
      </FormField>
    );
  }
);

Textarea.displayName = 'Textarea';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      required,
      helpText,
      error,
      options,
      placeholder,
      className = '',
      style,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`;
    const errorId = error ? `error-${selectId}` : undefined;
    const helpId = helpText ? `help-${selectId}` : undefined;

    return (
      <FormField label={label} required={required} helpText={!error ? helpText : undefined} error={error}>
        {({ errorId: ctxErrorId, helpId: ctxHelpId }: { errorId: string; helpId: string }) => (
          <select
            ref={ref}
            id={selectId}
            className={`form-input ${error ? 'form-input--error' : ''} ${className}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? ctxErrorId : helpText ? ctxHelpId : undefined}
            style={{
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right var(--input-px) center',
              paddingRight: 'calc(var(--input-px) + 1.5rem)',
              ...style,
            }}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </FormField>
    );
  }
);

Select.displayName = 'Select';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export function Checkbox({ label, description, className = '', id, ...props }: CheckboxProps) {
  const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2, 9)}`;
  const descId = description ? `desc-${checkboxId}` : undefined;

  return (
    <div className="form-checkbox" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--inline-gap)', cursor: 'pointer' }}>
      <input
        type="checkbox"
        id={checkboxId}
        className="form-checkbox__input"
        style={{
          width: '1.125rem',
          height: '1.125rem',
          marginTop: '0.125rem',
          flexShrink: 0,
          accentColor: 'var(--brand-500)',
        }}
        {...props}
      />
      <label htmlFor={checkboxId} style={{ flex: 1, cursor: 'pointer' }}>
        <span className="form-checkbox__label" style={{ 
          display: 'block',
          font: 'var(--font-weight-medium) var(--text-sm)/var(--leading-normal) var(--font-sans)',
          color: 'var(--text-primary)'
        }}>
          {label}
        </span>
        {description && (
          <span id={descId} className="form-checkbox__description" style={{ 
            display: 'block',
            font: 'var(--font-weight-normal) var(--text-xs)/var(--leading-normal) var(--font-sans)',
            color: 'var(--text-tertiary)',
            marginTop: 'var(--inline-gap-sm)'
          }}>
            {description}
          </span>
        )}
      </label>
    </div>
  );
}

export interface RadioGroupProps {
  label?: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  options: { value: string; label: string; description?: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function RadioGroup({ label, required, helpText, error, options, value, onChange, className = '' }: RadioGroupProps) {
  const groupId = `radio-group-${Math.random().toString(36).slice(2, 9)}`;
  const errorId = error ? `error-${groupId}` : undefined;
  const helpId = helpText ? `help-${groupId}` : undefined;

  return (
    <FormField label={label} required={required} helpText={!error ? helpText : undefined} error={error}>
      {({ errorId: ctxErrorId, helpId: ctxHelpId }: { errorId: string; helpId: string }) => (
        <div className="form-radio-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }} role="radiogroup" aria-labelledby={label ? undefined : groupId} aria-describedby={error ? ctxErrorId : helpText ? ctxHelpId : undefined}>
          {options.map((option) => (
            <label key={option.value} className="form-radio" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--inline-gap)', cursor: 'pointer' }}>
              <input
                type="radio"
                name={groupId}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="form-radio__input"
                style={{
                  width: '1.125rem',
                  height: '1.125rem',
                  marginTop: '0.125rem',
                  flexShrink: 0,
                  accentColor: 'var(--brand-500)',
                }}
              />
              <div style={{ flex: 1 }}>
                <span className="form-radio__label" style={{ 
                  display: 'block',
                  font: 'var(--font-weight-medium) var(--text-sm)/var(--leading-normal) var(--font-sans)',
                  color: 'var(--text-primary)'
                }}>
                  {option.label}
                </span>
                {option.description && (
                  <span className="form-radio__description" style={{ 
                    display: 'block',
                    font: 'var(--font-weight-normal) var(--text-xs)/var(--leading-normal) var(--font-sans)',
                    color: 'var(--text-tertiary)',
                    marginTop: 'var(--inline-gap-sm)'
                  }}>
                    {option.description}
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>
      )}
    </FormField>
  );
}

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export function Switch({ label, description, className = '', id, ...props }: SwitchProps) {
  const switchId = id || `switch-${Math.random().toString(36).slice(2, 9)}`;
  const descId = description ? `desc-${switchId}` : undefined;

  useSwitchStyles();

  return (
    <div className="form-switch" style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-gap)', cursor: 'pointer' }}>
      <label htmlFor={switchId} style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
        <input
          type="checkbox"
          id={switchId}
          className="form-switch__input"
          style={{
            position: 'absolute',
            opacity: 0,
            width: 0,
            height: 0,
          }}
          {...props}
        />
        <span className="form-switch__track" style={{
          display: 'block',
          width: '2.75rem',
          height: '1.5rem',
          borderRadius: 'var(--radius-full)',
          background: 'var(--border-default)',
          transition: 'background var(--duration-fast) var(--ease-out)',
          position: 'relative',
        }}>
          <span className="form-switch__thumb" style={{
            position: 'absolute',
            top: '0.125rem',
            left: '0.125rem',
            width: '1.25rem',
            height: '1.25rem',
            borderRadius: 'var(--radius-full)',
            background: 'white',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform var(--duration-fast) var(--ease-out)',
          }} />
        </span>
      </label>
      <div style={{ flex: 1 }}>
        <span className="form-switch__label" style={{ 
          display: 'block',
          font: 'var(--font-weight-medium) var(--text-sm)/var(--leading-normal) var(--font-sans)',
          color: 'var(--text-primary)'
        }}>
          {label}
        </span>
        {description && (
          <span id={descId} className="form-switch__description" style={{ 
            display: 'block',
            font: 'var(--font-weight-normal) var(--text-xs)/var(--leading-normal) var(--font-sans)',
            color: 'var(--text-tertiary)',
            marginTop: 'var(--inline-gap-sm)'
          }}>
            {description}
          </span>
        )}
      </div>
    </div>
  );
}

// Add CSS for switch checked state (injected once on mount)
const SWITCH_STYLE_ID = 'deepa-switch-styles';

function useSwitchStyles() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(SWITCH_STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = SWITCH_STYLE_ID;
    el.textContent = `
      .form-switch__input:checked + .form-switch__track {
        background: var(--brand-500);
      }
      .form-switch__input:checked + .form-switch__track .form-switch__thumb {
        transform: translateX(1.25rem);
      }
      .form-switch__input:focus-visible + .form-switch__track {
        box-shadow: var(--shadow-focus);
      }
    `;
    document.head.appendChild(el);
  }, []);
}