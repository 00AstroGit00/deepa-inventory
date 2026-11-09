import { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { Dialog, Button, Input, Select, Textarea, formatNumber, KPICard } from '../components/ui';
import { useToastContext } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'counter';
  is_active: boolean;
  created_at: string;
}

export function Users() {
  const [list, setList] = useState<User[]>([]);
  const [form, setForm] = useState({ email: '', password: '', role: 'counter' as 'admin' | 'manager' | 'counter' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; email: string } | null>(null);
  const { success, error: showError } = useToastContext();
const { user } = useAuth();
const canManage = user?.role === 'admin';

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setList(await res.json());
    } catch (e) { setError((e as Error).message); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const resetForm = () => {
    setForm({ email: '', password: '', role: 'counter' });
    setEditingId(null);
    setError(null);
  };

  const startEdit = (u: User) => {
    setForm({ email: u.email, password: '', role: u.role });
    setEditingId(u.id);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.email || (!editingId && !form.password)) { setError('Email and password required'); return; }
    setBusy(true);
    try {
      const payload = { email: form.email, role: form.role, ...(form.password ? { password: form.password } : {}) };
      const url = editingId ? `/api/user/${editingId}` : '/api/users';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const body = await res.json().catch(() => ({ error: res.statusText })); throw new Error(body.error ?? `HTTP ${res.status}`); }
      success(editingId ? 'User updated' : 'User created', form.email);
      resetForm();
      await load();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !isActive }) });
      if (!res.ok) throw new Error(`Failed to update user`);
      success(isActive ? 'User deactivated' : 'User activated', '');
      await load();
    } catch (e) { showError('Update failed', (e as Error).message); }
    finally { setBusy(false); }
  };

  const confirmDelete = (id: string, email: string) => {
    setShowDeleteConfirm({ id, email });
  };

  const executeDelete = async () => {
    if (!showDeleteConfirm) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${showDeleteConfirm.id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to delete user`);
      success('User deleted', showDeleteConfirm.email);
      await load();
    } catch (e) { setError((e as Error).message); }
    finally { 
      setBusy(false);
      setShowDeleteConfirm(null);
    }
  };

  const activeUsers = list.filter(u => u.is_active);
  const inactiveUsers = list.filter(u => !u.is_active);

  return (
    <section style={{ padding: 'var(--space-4) var(--page-gutter)' }}>
      <div className="page-header" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)'
      }}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage system users and permissions</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 'var(--inline-gap)', flexWrap: 'wrap' }}>
          {canManage && (
            <Button variant="primary" onClick={() => { resetForm(); }} leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            }>
              Add User
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="card" role="alert" style={{ 
          background: 'var(--danger-bg)', 
          borderColor: 'var(--danger-main)', 
          color: 'var(--danger-on)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-4)'
        }}>
          {error}
        </div>
      )}

      {/* Create/Edit User Form */}
      {canManage && (
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 'var(--space-4)',
          paddingBottom: 'var(--space-3)',
          borderBottom: '1px solid var(--border-light)'
        }}>
          <h3 style={{ 
            font: 'var(--font-weight-semibold) var(--text-lg)/var(--leading-tight) var(--font-sans)',
            color: 'var(--text-primary)',
            margin: 0
          }}>{editingId ? 'Edit User' : 'Create New User'}</h3>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={resetForm} disabled={busy}>Cancel</Button>
          )}
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-grid">
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="user@deepa.local"
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder={editingId ? 'Leave blank to keep current' : 'Required'}
              required={!editingId}
            />
            <Select
              label="Role"
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value as 'admin' | 'manager' | 'counter' })}
              options={[
                { value: 'counter', label: 'Counter' },
                { value: 'manager', label: 'Manager' },
                { value: 'admin', label: 'Admin' },
              ]}
              placeholder="Select role"
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--inline-gap)', justifyContent: 'flex-end' }}>
            {editingId && <Button variant="secondary" type="button" onClick={resetForm} disabled={busy}>Cancel</Button>}
            <Button variant="primary" type="submit" disabled={busy}>
              {busy ? 'Saving…' : editingId ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </form>
        </div>
      )}

      {/* User List */}
      <div className="card">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 'var(--space-4)',
          paddingBottom: 'var(--space-3)',
          borderBottom: '1px solid var(--border-light)'
        }}>
          <h3 style={{ 
            font: 'var(--font-weight-semibold) var(--text-lg)/var(--leading-tight) var(--font-sans)',
            color: 'var(--text-primary)',
            margin: 0
          }}>All Users ({list.length})</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Email</th>
                <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Role</th>
                <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Created</th>
                <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ fontWeight: '500' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span className="badge" style={{ 
                      background: 'var(--surface-elevated)', 
                      color: 'var(--text-secondary)', 
                      border: '1px solid var(--border-default)' 
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span className="badge badge--success">Active</span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
<td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', gap: 'var(--inline-gap)' }}>
                        {canManage && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => startEdit(u)} disabled={busy} aria-label={`Edit ${u.email}`}>Edit</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleToggleActive(u.id, u.is_active)} disabled={busy} aria-label={`Deactivate ${u.email}`}>Deactivate</Button>
                            <Button variant="danger" size="sm" onClick={() => confirmDelete(u.id, u.email)} disabled={busy} aria-label={`Delete ${u.email}`}>Delete</Button>
                          </>
                        )}
                      </div>
                    </td>
                </tr>
              ))}
              {inactiveUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)', opacity: 0.5 }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ fontWeight: '500' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span className="badge" style={{ 
                      background: 'var(--surface-elevated)', 
                      color: 'var(--text-tertiary)', 
                      border: '1px solid var(--border-default)' 
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span className="badge badge--warning">Inactive</span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
<td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', gap: 'var(--inline-gap)' }}>
                        {canManage && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => startEdit(u)} disabled={busy} aria-label={`Edit ${u.email}`}>Edit</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleToggleActive(u.id, u.is_active)} disabled={busy} aria-label={`Activate ${u.email}`}>Activate</Button>
                          </>
                        )}
                      </div>
                    </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-tertiary)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>👥</div>
                    <p>No users found. Click "Add User" to create your first user.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {canManage && showDeleteConfirm && (
        <Dialog
          isOpen={true}
          onClose={() => setShowDeleteConfirm(null)}
          title="Delete User"
          size="sm"
          variant="danger"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={executeDelete} loading={busy}>
                Delete
              </Button>
            </>
          }
        >
          <p style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete <strong>{showDeleteConfirm.email}</strong>?
            This action cannot be undone.
          </p>
        </Dialog>
      )}
    </section>
  );
}