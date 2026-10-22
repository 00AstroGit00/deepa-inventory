import { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { Dialog, Button, Input, Textarea, formatNumber, KPICard } from '../components/ui';
import { useToastContext } from '../components/ui/Toast';

const EMPTY = {
  name: '', contact_info: '', address: '', phone: '', email: '', gstin: '', payment_terms: '',
};

interface Supplier {
  id: string;
  name: string;
  contact_info: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  payment_terms: string | null;
  is_active: boolean;
}

export function Suppliers() {
  const [list, setList] = useState<Supplier[]>([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState<Record<string, string>>({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const { success, error: showError } = useToastContext();

  const load = useCallback(() => api.suppliers(q).then(setList).catch(e => setError(e.message)), [q]);
  useEffect(() => { void load(); }, [load]);

  const resetForm = () => {
    setForm({ ...EMPTY });
    setEditingId(null);
    setError(null);
    setShowForm(false);
  };

  const startEdit = (s: Supplier) => {
    setForm({
      name: s.name,
      contact_info: s.contact_info ?? '',
      address: s.address ?? '',
      phone: s.phone ?? '',
      email: s.email ?? '',
      gstin: s.gstin ?? '',
      payment_terms: s.payment_terms ?? '',
    });
    setEditingId(s.id);
    setShowForm(true);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload = { 
        ...form, 
        contact_info: form.contact_info || null, 
        address: form.address || null,
        phone: form.phone || null, 
        email: form.email || null, 
        gstin: form.gstin || null,
        payment_terms: form.payment_terms || null 
      };
      if (editingId) {
        await api.updateSupplier(editingId, payload);
        success('Supplier updated', payload.name);
      } else {
        await api.createSupplier(payload);
        success('Supplier created', payload.name);
      }
      resetForm();
      await load();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };

  const confirmDelete = (id: string, name: string) => {
    setShowDeleteConfirm({ id, name });
  };

  const executeDelete = async () => {
    if (!showDeleteConfirm) return;
    setBusy(true);
    setError(null);
    try {
      await api.deleteSupplier(showDeleteConfirm.id);
      success('Supplier deactivated', showDeleteConfirm.name);
      await load();
    } catch (err) { setError((err as Error).message); }
    finally { 
      setBusy(false);
      setShowDeleteConfirm(null);
    }
  };

  const activeSuppliers = list.filter(s => s.is_active);
  const inactiveSuppliers = list.filter(s => !s.is_active);

  return (
    <section style={{ padding: 'var(--space-4) var(--page-gutter)' }}>
      <div className="page-header" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)'
      }}>
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">Manage supplier relationships and contact information</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 'var(--inline-gap)', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => { resetForm(); setShowForm(true); }} leftIcon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }>
            Add Supplier
          </Button>
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

      {/* Search */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <Input
          type="search"
          placeholder="Search by name, phone, email, or GSTIN..."
          value={q}
          onChange={e => setQ(e.target.value)}
          leftIcon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          }
          style={{ maxWidth: '100%' }}
        />
      </div>

      {/* Supplier List */}
      <div className="card">
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🚛</div>
            <h3 style={{ 
              font: 'var(--font-weight-semibold) var(--text-xl)/var(--leading-tight) var(--font-sans)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)'
            }}>No Suppliers</h3>
            <p style={{ color: 'var(--text-tertiary)' }}>Click "Add Supplier" to create your first supplier.</p>
          </div>
        ) : (
          <>
            {/* Active Suppliers */}
            {activeSuppliers.length > 0 && (
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)',
                  borderBottom: '1px solid var(--border-light)'
                }}>
                  <h3 style={{ 
                    font: 'var(--font-weight-semibold) var(--text-lg)/var(--leading-tight) var(--font-sans)',
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>Active Suppliers ({activeSuppliers.length})</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Phone</th>
                        <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Email</th>
                        <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>GSTIN</th>
                        <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Payment Terms</th>
                        <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSuppliers.map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            <div style={{ fontWeight: '500' }}>{s.name}</div>
                            {(s.contact_info || s.address) && (
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {s.contact_info || s.address}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{s.phone ?? '—'}</td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{s.email ?? '—'}</td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{s.gstin ?? '—'}</td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{s.payment_terms ?? '—'}</td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            <span className="badge badge--success">Active</span>
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            <div style={{ display: 'flex', gap: 'var(--inline-gap)' }}>
                              <Button variant="ghost" size="sm" onClick={() => startEdit(s)} disabled={busy} aria-label={`Edit ${s.name}`}>Edit</Button>
                              <Button variant="danger" size="sm" onClick={() => confirmDelete(s.id, s.name)} disabled={busy} aria-label={`Deactivate ${s.name}`}>Deactivate</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Inactive Suppliers */}
            {inactiveSuppliers.length > 0 && (
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)',
                  borderBottom: '1px solid var(--border-light)',
                  background: 'var(--surface-muted)'
                }}>
                  <h3 style={{ 
                    font: 'var(--font-weight-semibold) var(--text-lg)/var(--leading-tight) var(--font-sans)',
                    color: 'var(--text-tertiary)',
                    margin: 0
                  }}>Inactive Suppliers ({inactiveSuppliers.length})</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Phone</th>
                        <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Email</th>
                        <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>GSTIN</th>
                        <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Payment Terms</th>
                        <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inactiveSuppliers.map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)', opacity: 0.5 }}>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            <div style={{ fontWeight: '500' }}>{s.name}</div>
                            {(s.contact_info || s.address) && (
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {s.contact_info || s.address}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{s.phone ?? '—'}</td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{s.email ?? '—'}</td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{s.gstin ?? '—'}</td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{s.payment_terms ?? '—'}</td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            <span className="badge badge--warning">Inactive</span>
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            <Button variant="ghost" size="sm" onClick={() => startEdit(s)} disabled={busy} aria-label={`Edit ${s.name}`}>Edit</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Supplier Form Dialog */}
      {showForm && (
        <Dialog
          isOpen={true}
          onClose={resetForm}
          title={editingId ? 'Edit Supplier' : 'Add Supplier'}
          size="lg"
          footer={
            <>
              {editingId && <Button variant="secondary" onClick={resetForm} disabled={busy}>Cancel</Button>}
              <Button variant="primary" type="submit" form="supplier-form" disabled={busy}>
                {busy ? 'Saving…' : editingId ? 'Update Supplier' : 'Create Supplier'}
              </Button>
            </>
          }
        >
          <form id="supplier-form" onSubmit={submit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div>
                <h3 style={{ 
                  font: 'var(--font-weight-semibold) var(--text-lg)/var(--leading-tight) var(--font-sans)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-4)',
                  paddingBottom: 'var(--space-3)',
                  borderBottom: '1px solid var(--border-light)'
                }}>Basic Information</h3>
                <div className="form-grid">
                  <Input
                    label="Name"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Supplier name"
                  />
                  <Textarea
                    label="Contact Info"
                    value={form.contact_info}
                    onChange={e => setForm({ ...form, contact_info: e.target.value })}
                    placeholder="Contact person, notes, etc."
                    rows={2}
                  />
                  <Textarea
                    label="Address"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="Full address"
                    rows={2}
                  />
                </div>
              </div>

              <div>
                <h3 style={{ 
                  font: 'var(--font-weight-semibold) var(--text-lg)/var(--leading-tight) var(--font-sans)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-4)',
                  paddingBottom: 'var(--space-3)',
                  borderBottom: '1px solid var(--border-light)'
                }}>Contact Details</h3>
                <div className="form-grid">
                  <Input
                    label="Phone"
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                  <Input
                    label="GSTIN"
                    value={form.gstin}
                    onChange={e => setForm({ ...form, gstin: e.target.value })}
                    placeholder="GST Identification Number"
                  />
                  <Input
                    label="Payment Terms"
                    value={form.payment_terms}
                    onChange={e => setForm({ ...form, payment_terms: e.target.value })}
                    placeholder="e.g., Net 30, COD, etc."
                  />
                </div>
              </div>
            </div>
          </form>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <Dialog
          isOpen={true}
          onClose={() => setShowDeleteConfirm(null)}
          title="Deactivate Supplier"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={executeDelete} loading={busy}>
                Deactivate
              </Button>
            </>
          }
        >
          <p style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to deactivate <strong>{showDeleteConfirm.name}</strong>?
            This will hide it from active lists but preserve all history.
          </p>
        </Dialog>
      )}
    </section>
  );
}