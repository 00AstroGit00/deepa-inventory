import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';
import { Button, Input } from '../components/ui';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh, 100dvh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 'var(--space-4) var(--page-gutter)',
      background: 'var(--bg-primary)'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '420px',
        padding: 'var(--space-8)',
        background: 'var(--surface-primary)',
        border: '1px solid var(--border-default)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{ 
            width: '4rem', 
            height: '4rem', 
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-4)',
            color: 'var(--text-on-brand)'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-display-small" style={{ marginBottom: 'var(--space-2)' }}>Deepa Inventory</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-base)' }}>Sign in to manage your beverage inventory</p>
        </div>

        <form onSubmit={submit}>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            required
            label="Email"
            placeholder="admin@deepa.local"
            value={email}
            onChange={e => setEmail(e.target.value)}
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
            }
          />

          <Input
            id="pw"
            type="password"
            autoComplete="current-password"
            required
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            }
            style={{ marginTop: 'var(--space-4)' }}
          />

          {error && (
            <div role="alert" style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-3)',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-main)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger-on)',
              fontSize: 'var(--text-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--inline-gap-sm)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={busy}
            style={{ marginTop: 'var(--space-6)' }}
          >
            {busy ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <div style={{
          marginTop: 'var(--space-6)',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid var(--border-light)',
          textAlign: 'center',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)'
        }}>
          Deepa Bar Inventory Management System
        </div>
      </div>
    </div>
  );
}