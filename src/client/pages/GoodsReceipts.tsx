import { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { Dialog, Button, Input, Select, Textarea, formatNumber, KPICard } from '../components/ui';
import { useToastContext } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';

interface GoodsReceipt {
  id: string;
  grn_number: string;
  po_id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  receipt_date: string;
  invoice_number: string | null;
  invoice_date: string | null;
  notes: string | null;
  lines?: GrLine[];
}

interface GrLine {
  id: string;
  po_line_id: string;
  product_id: string;
  product_name: string;
  received_qty: number;
  unit: string;
  unit_price: number;
  batch_number: string | null;
  expiry_date: string | null;
  quality_check: boolean;
  notes: string | null;
  stock_unit: string;
}

interface PoDetail {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  lines: { id: string; product_id: string; product_name: string; ordered_qty: number; received_qty: number; unit: string; unit_price: number; tax_treatment: string; stock_unit: string }[];
}

type GrLineForm = {
  poLineId: string;
  productId: string;
  productName: string;
  receivedQty: number;
  unit: string;
  unitPrice: number;
  batchNumber: string;
  expiryDate: string;
  qualityCheck: boolean;
  notes: string
};

export function GoodsReceipts() {
  const [list, setList] = useState<GoodsReceipt[]>([]);
  const [pos, setPos] = useState<PoDetail[]>([]);
  const [filterPo, setFilterPo] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { success, error: showError } = useToastContext();
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{
    poId: string;
    supplierId: string;
    receiptDate: string;
    invoiceNumber: string;
    invoiceDate: string;
    notes: string;
    lines: GrLineForm[];
  }>({
    poId: '',
    supplierId: '',
    receiptDate: new Date().toISOString().slice(0, 10),
    invoiceNumber: '',
    invoiceDate: '',
    notes: '',
    lines: [],
  });

  const load = useCallback(() => api.goodsReceipts({ poId: filterPo, supplierId: filterSupplier }).then(setList).catch(e => setError(e.message)), [filterPo, filterSupplier]);
  const loadPos = useCallback(() => api.purchaseOrders({ status: 'confirmed', limit: 100 }).then(setPos).catch(() => {}), []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void loadPos(); }, [loadPos]);

  const handlePoChange = (poId: string) => {
    const po = pos.find(p => p.id === poId);
    if (po) {
      const newLines: GrLineForm[] = po.lines
        .filter(l => l.received_qty < l.ordered_qty)
        .map(l => ({
          poLineId: l.id,
          productId: l.product_id,
          productName: l.product_name,
          receivedQty: l.ordered_qty - l.received_qty,
          unit: l.unit,
          unitPrice: l.unit_price,
          batchNumber: '',
          expiryDate: '',
          qualityCheck: true,
          notes: '',
        } as GrLineForm));
      setForm(prev => ({
        ...prev,
        poId,
        supplierId: po.supplier_id,
        lines: newLines,
      }));
    } else {
      setForm(prev => ({ ...prev, poId, supplierId: '', lines: [] }));
    }
  };

  const resetForm = () => {
    setForm({
      poId: '', supplierId: '',
      receiptDate: new Date().toISOString().slice(0, 10),
      invoiceNumber: '', invoiceDate: '', notes: '', lines: [],
    });
    setShowForm(false);
    setError(null);
  };

  const updateLine = (idx: number, field: keyof GrLineForm, value: any) => {
    setForm(prev => {
      const lines = [...prev.lines];
      lines[idx] = { ...lines[idx], [field]: value } as GrLineForm;
      return { ...prev, lines };
    });
  };

  const removeLine = (idx: number) => {
    setForm(prev => ({ ...prev, lines: prev.lines.filter((_, i) => i !== idx) }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.poId) { setError('Purchase order required'); return; }
    if (form.lines.length === 0) { setError('At least one line required'); return; }
    for (const l of form.lines) {
      if (!l.productId || l.receivedQty <= 0 || l.unitPrice < 0) {
        setError('All lines must have product, qty > 0, and price >= 0');
        return;
      }
    }
    setBusy(true);
    try {
      const payload = {
        poId: form.poId,
        supplierId: form.supplierId,
        receiptDate: form.receiptDate || null,
        invoiceNumber: form.invoiceNumber || null,
        invoiceDate: form.invoiceDate || null,
        notes: form.notes || null,
        lines: form.lines.map(l => ({
          poLineId: l.poLineId,
          productId: l.productId,
          receivedQty: l.receivedQty,
          unit: l.unit,
          unitPrice: l.unitPrice,
          batchNumber: l.batchNumber || null,
          expiryDate: l.expiryDate || null,
          qualityCheck: l.qualityCheck,
          notes: l.notes || null,
        })),
      };
      await api.createGoodsReceipt(payload);
      success('Goods receipt created', `GRN created from ${form.poId}`);
      resetForm();
      await load();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <section style={{ padding: 'var(--space-4) var(--page-gutter)' }}>
      <div className="page-header" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)'
      }}>
        <div>
          <h1 className="page-title">Goods Receipts</h1>
          <p className="page-subtitle">Record received goods against purchase orders</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 'var(--inline-gap)', flexWrap: 'wrap' }}>
          {canManage && (
            <Button variant="primary" onClick={() => { resetForm(); setShowForm(true); }} leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            }>
              New Receipt
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

      {/* Filters */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'flex-end', padding: 'var(--space-3)' }}>
          <Select
            id="gr-po"
            value={filterPo}
            onChange={e => setFilterPo(e.target.value)}
            options={[
              { value: '', label: 'All Purchase Orders' },
              ...pos.map(p => ({ value: p.id, label: `${p.po_number} — ${p.supplier_name}` }))
            ]}
            placeholder="All Purchase Orders"
            style={{ maxWidth: '350px' }}
          />
          <Select
            id="gr-supplier"
            value={filterSupplier}
            onChange={e => setFilterSupplier(e.target.value)}
            options={[
              { value: '', label: 'All Suppliers' },
              ...Array.from(new Map(pos.map(p => [p.supplier_id, p.supplier_name])).entries()).map(([id, name]) => ({ value: id, label: name }))
            ]}
            placeholder="All Suppliers"
            style={{ maxWidth: '250px' }}
          />
        </div>
      </div>

      {/* GR List */}
      <div className="card">
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📥</div>
            <h3 style={{ 
              font: 'var(--font-weight-semibold) var(--text-xl)/var(--leading-tight) var(--font-sans)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)'
            }}>No Goods Receipts</h3>
            <p style={{ color: 'var(--text-tertiary)' }}>Click "New Receipt" to create your first goods receipt.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>GRN</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>PO Number</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Supplier</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Receipt Date</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Invoice</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Lines</th>
                </tr>
              </thead>
              <tbody>
                {list.map(gr => (
                  <tr key={gr.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ fontWeight: '500', fontFamily: 'var(--font-mono)' }}>{gr.grn_number}</div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{gr.po_number}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{gr.supplier_name}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', whiteSpace: 'nowrap' }}>{gr.receipt_date}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{gr.invoice_number ?? '—'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{gr.lines?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GR Form Dialog */}
      {canManage && showForm && (
        <Dialog
          isOpen={true}
          onClose={resetForm}
          title="New Goods Receipt"
          size="xl"
          footer={
            <>
              <Button variant="secondary" onClick={resetForm} disabled={busy}>Cancel</Button>
              <Button variant="primary" type="submit" form="gr-form" disabled={busy}>
                {busy ? 'Saving…' : 'Save Receipt'}
              </Button>
            </>
          }
        >
          <form id="gr-form" onSubmit={submit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {error && (
                <div role="alert" style={{
                  padding: 'var(--space-3)',
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-main)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--danger-on)',
                  fontSize: 'var(--text-sm)'
                }}>
                  {error}
                </div>
              )}

              {/* Header Fields */}
              <div>
                <h3 style={{ 
                  font: 'var(--font-weight-semibold) var(--text-lg)/var(--leading-tight) var(--font-sans)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-4)',
                  paddingBottom: 'var(--space-3)',
                  borderBottom: '1px solid var(--border-light)'
                }}>Receipt Details</h3>
                <div className="form-grid">
                  <Select
                    label="Purchase Order"
                    required
                    value={form.poId}
                    onChange={e => { handlePoChange(e.target.value); setForm(prev => ({ ...prev, poId: e.target.value })); }}
                    options={[
                      { value: '', label: 'Select PO' },
                      ...pos.map(p => ({ value: p.id, label: `${p.po_number} — ${p.supplier_name}` }))
                    ]}
                    placeholder="Select PO"
                  />
                  <Input
                    label="Receipt Date"
                    type="date"
                    required
                    value={form.receiptDate}
                    onChange={e => setForm(prev => ({ ...prev, receiptDate: e.target.value }))}
                  />
                  <Input
                    label="Invoice Number"
                    value={form.invoiceNumber}
                    onChange={e => setForm({ ...form, invoiceNumber: e.target.value })}
                    placeholder="Optional"
                  />
                  <Input
                    label="Invoice Date"
                    type="date"
                    value={form.invoiceDate}
                    onChange={e => setForm({ ...form, invoiceDate: e.target.value })}
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

              {/* Receipt Lines */}
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
                  }}>Receipt Lines ({form.lines.length})</h3>
                </div>

                {form.lines.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)', background: 'var(--surface-muted)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📦</div>
                    <p>Select a PO to auto-populate lines with pending quantities.</p>
                  </div>
                )}

                {form.lines.map((line, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', 
                      gap: 'var(--space-3)', 
                      alignItems: 'end', 
                      marginBottom: 'var(--space-3)', 
                      padding: 'var(--space-4)', 
                      background: 'var(--surface-muted)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <Input
                      label="Product"
                      value={line.productName}
                      readOnly
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                    />
                    <Input
                      label="PO Line ID"
                      value={line.poLineId}
                      readOnly
                      style={{ background: 'var(--bg-tertiary)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}
                    />
                    <Input
                      label="Qty Received"
                      type="number"
                      min="0.001"
                      step="0.001"
                      required
                      value={line.receivedQty}
                      onChange={e => updateLine(idx, 'receivedQty', Number(e.target.value))}
                    />
                    <Input
                      label="Unit"
                      required
                      value={line.unit}
                      onChange={e => updateLine(idx, 'unit', e.target.value)}
                    />
                    <Input
                      label="Unit Price"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={line.unitPrice}
                      onChange={e => updateLine(idx, 'unitPrice', Number(e.target.value))}
                    />
                    <Input
                      label="Batch #"
                      value={line.batchNumber}
                      onChange={e => updateLine(idx, 'batchNumber', e.target.value)}
                      placeholder="Optional"
                    />
                    <Input
                      label="Expiry Date"
                      type="date"
                      value={line.expiryDate}
                      onChange={e => updateLine(idx, 'expiryDate', e.target.value)}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-gap-sm)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={line.qualityCheck}
                        onChange={e => updateLine(idx, 'qualityCheck', e.target.checked)}
                        style={{ width: '1.125rem', height: '1.125rem', accentColor: 'var(--brand-500)' }}
                      />
                      Quality OK
                    </label>
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
    </section>
  );
}