import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../pages/Login';
import { AuthProvider } from '../hooks/useAuth';

describe('client smoke render', () => {
  it('renders the login page without throwing', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(html).toContain('Deepa Inventory');
    expect(html.length).toBeGreaterThan(500);
  });
});
