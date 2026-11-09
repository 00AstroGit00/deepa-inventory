import { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { Dialog, Button, Input, Select, Textarea, formatNumber, KPICard } from '../components/ui';
import { useToastContext } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  status: 'draft' | 'confirmed' | 'partial' | 'received' | 'cancelled';
  order_date: string;
  expected_date: string | null;
  notes: string | null;
  lines?: PoLine[];
}

interface PoLine {
  id: string;
  product_id: string;
  product_name: string;
  ordered_qty: number;
  received_qty: number;
  unit: string;
  unit_price: number;
  tax_treatment: string;
  stock_unit: string;
  line_total: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'var(--text-tertiary)' },
  confirmed: { label: 'Confirmed', color: 'var(--brand-500)' },
  partial: { label: 'Partial', color: 'var(--warning-main)' },
  received: { label: 'Received', color: 'var(--success-main)' },
  cancelled: { label: 'Cancelled', color: 'var(--danger-main)' },
};

const TAX_TREATMENTS = ['outside_gst_excise_vat', 'gst_5', 'gst_18', 'gst_28_cess'] as const;

type PoLineForm = { productId: string; orderedQty: number; unit: string; unitPrice: number; taxTreatment: string };

export function PurchaseOrders() {
  const [list, setList] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { success, error: showError } = useToastContext();
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{
    supplierId: string;
    expectedDate: string;
    notes: string;
    lines: PoLineForm[];
  }>({
    supplierId: '',
    expectedDate: '',
    notes: '',
    lines: [],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; poNumber: string } | null>(null);

  const load = useCallback(() => api.purchaseOrders({ status: filterStatus, supplierId: filterSupplier }).then(setList).catch(e => setError(e.message)), [filterStatus, filterSupplier]);
  const loadSuppliers = useCallback(() => api.suppliers().then(setSuppliers).catch(() => {}), []);
  const loadProducts = useCallback(() => api.products().then(setProducts).catch(() => {}), []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void loadSuppliers(); }, [loadSuppliers]);
  useEffect(() => { void loadProducts(); }, [loadProducts]);

  const addLine = () => {
    const newLine: PoLineForm = { productId: '', orderedQty: 1, unit: '', unitPrice: 0, taxTreatment: 'outside_gst_excise_vat' };
    setForm(prev => ({ ...prev, lines: [...prev.lines, newLine] }));
  };

  const updateLine = (idx: number, field: keyof PoLineForm, value: any) => {
    setForm(prev => {
      const lines = [...prev.lines];
      lines[idx] = { ...lines[idx], [field]: value } as PoLineForm;
      return { ...prev, lines };
    });
  };

  const removeLine = (idx: number) => {
    setForm(prev => ({ ...prev, lines: prev.lines.filter((_, i) => i !== idx) }));
  };

  const resetForm = () => {
    setForm({ supplierId: '', expectedDate: '', notes: '', lines: [] });
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const startEdit = (po: PurchaseOrder) => {
    setForm({
      supplierId: po.supplier_id,
      expectedDate: po.expected_date ?? '',
      notes: po.notes ?? '',
      lines: (po.lines ?? []).map(l => ({
        productId: l.product_id,
        orderedQty: l.ordered_qty,
        unit: l.unit,
        unitPrice: l.unit_price,
        taxTreatment: l.tax_treatment,
      } as PoLineForm)),
    });
    setEditingId(po.id);
    setShowForm(true);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.supplierId) { setError('Supplier required'); return; }
    if (form.lines.length === 0) { setError('At least one line required'); return; }
    for (const l of form.lines) {
      if (!l.productId || l.orderedQty <= 0 || l.unitPrice < 0) {
        setError('All lines must have product, qty > 0, and price >= 0');
        return;
      }
    }
    setBusy(true);
    try {
      const payload = {
        supplierId: form.supplierId,
        expectedDate: form.expectedDate || null,
        notes: form.notes || null,
        lines: form.lines.map(l => ({
          productId: l.productId,
          orderedQty: l.orderedQty,
          unit: l.unit,
          unitPrice: l.unitPrice,
          taxTreatment: l.taxTreatment,
        })),
      };
      if (editingId) {
        await api.updatePurchaseOrder(editingId, payload);
        success('Purchase order updated', payload.supplierId);
      } else {
        await api.createPurchaseOrder(payload);
        success('Purchase order created', payload.supplierId);
      }
      resetForm();
      await load();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };

  const confirmDelete = (id: string, poNumber: string) => {
    setShowDeleteConfirm({ id, poNumber });
  };

  const executeDelete = async () => {
    if (!showDeleteConfirm) return;
    setBusy(true);
    setError(null);
    try {
      await api.createPurchaseOrder(showDeleteConfirm.id);
      success('Purchase order deleted', showDeleteConfirm.poNumber);
      await load();
    } catch (err) { setError((err as Error).message); }
    finally { 
      setBusy(false);
      setShowDeleteConfirm(null);
    }
  };

  const changeStatus = async (id: string, newStatus: string) => {
    setBusy(true);
    try {
      await api.updatePoStatus(id, newStatus);
      await load();
      success('Status updated', newStatus);
    } catch (err) { showError('Status change failed', (err as Error).message); }
    finally { setBusy(false); }
  };

  // Stats
  const draftCount = list.filter(po => po.status === 'draft').length;
  const confirmedCount = list.filter(po => po.status === 'confirmed').length;
  const partialCount = list.filter(po => po.status === 'partial').length;
  const receivedCount = list.filter(po => po.status === 'received').length;
  const totalValue = list.reduce((sum, po) => sum + (po.lines?.reduce((s, l) => s + l.line_total, 0) ?? 0), 0);

  return (
    <section style={{ padding: 'var(--space-4) var(--page-gutter)' }}>
      <div className="page-header" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)'
      }}>
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">Manage purchase orders and supplier orders</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 'var(--inline-gap)', flexWrap: 'wrap' }}>
          {canManage && (
            <Button variant="primary" onClick={() => { resetForm(); setShowForm(true); }} leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }>
              New Purchase Order
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

      {/* KPI Summary */}
      <div className="kpi-grid">
        <KPICard
          label="Total Orders"
          value={list.length}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          }
        />
        <KPICard
          label="Draft"
          value={draftCount}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          }
          trend={{ value: draftCount > 0 ? 'Needs action' : 'None', type: draftCount > 0 ? 'warning' : 'positive' }}
          variant="info"
        />
        <KPICard
          label="Confirmed"
          value={confirmedCount}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          trend={{ value: 'Awaiting receipt', type: 'positive' }}
          variant="success"
        />
        <KPICard
          label="Total Value"
          value={formatCurrency(totalValue)}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          trend={{ value: 'All orders', type: 'positive' }}
        />
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'flex-end', padding: 'var(--space-3)' }}>
          <Input
            id="po-status"
            type="text"
            label="Status"
            placeholder="All Status"
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            }
          />
          <Select
            id="po-status-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'partial', label: 'Partial' },
              { value: 'received', label: 'Received' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            placeholder="All Status"
            style={{ maxWidth: '180px' }}
          />
          <Select
            id="po-supplier"
            value={filterSupplier}
            onChange={e => setFilterSupplier(e.target.value)}
            options={[
              { value: '', label: 'All Suppliers' },
              ...suppliers.map(s => ({ value: s.id, label: s.name }))
            ]}
            placeholder="All Suppliers"
            style={{ maxWidth: '250px' }}
          />
        </div>
      </div>

      {/* PO List */}
      <div className="card">
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📋</div>
            <h3 style={{ 
              font: 'var(--font-weight-semibold) var(--text-xl)/var(--leading-tight) var(--font-sans)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)'
            }}>No Purchase Orders</h3>
            <p style={{ color: 'var(--text-tertiary)' }}>Click "New Purchase Order" to create your first PO.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>PO Number</th>
                    <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Supplier</th>
                    <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Order Date</th>
                    <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Expected</th>
                    <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total</th>
                    <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(po => {
                    const statusConfig = STATUS_CONFIG[po.status] || { label: po.status, color: 'var(--text-tertiary)' };
                    const total = po.lines?.reduce((s, l) => s + l.line_total, 0) ?? 0;

                    return (
                      <tr key={po.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <div style={{ fontWeight: '500', fontFamily: 'var(--font-mono)' }}>{po.po_number}</div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{po.supplier_name}</td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', whiteSpace: 'nowrap' }}>{po.order_date}</td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', whiteSpace: 'nowrap' }}>{po.expected_date ?? '—'}</td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span className="badge" style={{ 
                            background: `${statusConfig.color}15`,
                            color: statusConfig.color,
                            border: `1px solid ${statusConfig.color}40`
                          }}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>₹{formatNumber(total, { decimals: 2 })}</td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <div style={{ display: 'flex', gap: 'var(--inline-gap)' }}>
                            {canManage && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => startEdit(po)} disabled={busy || po.status !== 'draft'} aria-label={`Edit ${po.po_number}`}>Edit</Button>
                                {po.status === 'draft' && (
                                  <Button variant="primary" size="sm" onClick={() => changeStatus(po.id, 'confirmed')} disabled={busy}>Confirm</Button>
                                )}
                                {po.status === 'confirmed' && (
                                  <Button variant="danger" size="sm" onClick={() => changeStatus(po.id, 'cancelled')} disabled={busy}>Cancel</Button>
                                )}
                                {(po.status === 'draft' || po.status === 'cancelled') && (
                                  <Button variant="danger" size="sm" onClick={() => confirmDelete(po.id, po.po_number)} disabled={busy} aria-label={`Delete ${po.po_number}`}>Delete</Button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* PO Form Dialog */}
      {canManage && showForm && (
        <Dialog
          isOpen={true}
          onClose={resetForm}
          title={editingId ? 'Edit Purchase Order' : 'New Purchase Order'}
          size="xl"
          footer={
            <>
              <Button variant="secondary" onClick={resetForm} disabled={busy}>Cancel</Button>
              <Button variant="primary" type="submit" form="po-form" disabled={busy}>
                {busy ? 'Saving…' : editingId ? 'Update PO' : 'Create PO'}
              </Button>
            </>
          }
        >
          <form id="po-form" onSubmit={submit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* Header Fields */}
              <div>
                <h3 style={{ 
                  font: 'var(--font-weight-semibold) var(--text-lg)/var(--leading-tight) var(--font-sans)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-4)',
                  paddingBottom: 'var(--space-3)',
                  borderBottom: '1px solid var(--border-light)'
                }}>Order Details</h3>
                <div className="form-grid">
                  <Select
                    label="Supplier"
                    required
                    value={form.supplierId}
                    onChange={e => setForm({ ...form, supplierId: e.target.value })}
                    options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                    placeholder="Select supplier"
                  />
                  <Input
                    label="Expected Date"
                    type="date"
                    value={form.expectedDate}
                    onChange={e => setForm({ ...form, expectedDate: e.target.value })}
                  />
                  <Textarea
                    label="Notes"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Optional notes"
                    rows={2}
                    className="form-grid--single"
                  />
                </div>
              </div>

              {/* Order Lines */}
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-4)'
                }}>
                  <h3 style={{ 
                    font: 'var(--font-weight-semibold) var(--text-lg)/var(--leading-tight) var(--font-sans)',
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>Order Lines ({form.lines.length})</h3>
                  <Button variant="ghost" size="sm" onClick={addLine} leftIcon={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  }>
                    Add Line
                  </Button>
                </div>

                {form.lines.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)', background: 'var(--surface-muted)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📦</div>
                    <p>Add at least one line item to your purchase order.</p>
                  </div>
                )}

                {form.lines.map((line, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', 
                      gap: 'var(--space-3)', 
                      alignItems: 'end', 
                      marginBottom: 'var(--space-3)', 
                      padding: 'var(--space-4)', 
                      background: 'var(--surface-muted)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <Select
                      label="Product"
                      required
                      value={line.productId}
                      onChange={e => updateLine(idx, 'productId', e.target.value)}
                      options={[
                        { value: '', label: 'Select product' },
                        ...products.map(p => ({ value: p.id, label: `${p.name} (${p.stock_unit})` }))
                      ]}
                      placeholder="Select product"
                    />
                    <Input
                      label="Qty"
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={line.orderedQty}
                      onChange={e => updateLine(idx, 'orderedQty', Number(e.target.value))}
                      required
                    />
                    <Input
                      label="Unit"
                      value={line.unit}
                      onChange={e => updateLine(idx, 'unit', e.target.value)}
                      required
                      placeholder="unit"
                    />
                    <Input
                      label="Unit Price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={e => updateLine(idx, 'unitPrice', Number(e.target.value))}
                      required
                    />
                    <Select
                      label="Tax"
                      value={line.taxTreatment}
                      onChange={e => updateLine(idx, 'taxTreatment', e.target.value)}
                      options={TAX_TREATMENTS.map(t => ({ value: t, label: t.replace(/_/g, ' ').toUpperCase() }))}
                      placeholder="Select tax"
                    />
                    <Button variant="danger" size="sm" onClick={() => removeLine(idx)} disabled={form.lines.length === 1} aria-label="Remove line">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {canManage && showDeleteConfirm && (
        <Dialog
          isOpen={true}
          onClose={() => setShowDeleteConfirm(null)}
          title="Delete Purchase Order"
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
            Are you sure you want to delete <strong>{showDeleteConfirm.poNumber}</strong>?
            This action cannot be undone.
          </p>
        </Dialog>
      )}
    </section>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}