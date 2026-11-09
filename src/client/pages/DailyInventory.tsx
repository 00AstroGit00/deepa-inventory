import { useCallback, useEffect, useState } from 'react';
import { api, DayResponse, Row, Movement, MovementsResponse } from '../api';
import { ProductCard, ProductGrid, Dialog, Button, formatNumber, getStockStatus } from '../components/ui';
import { useToastContext } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';

const today = () => new Date().toISOString().slice(0, 10);

type SaveStatus = 'idle' | 'pending' | 'saved' | 'error';

export function DailyInventory() {
  const [date, setDate] = useState(today());
  const [day, setDay] = useState<DayResponse | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});
  const [showMovementDialog, setShowMovementDialog] = useState<{
    open: boolean;
    product?: Row;
    type?: Movement['type'];
  }>({ open: false });
  const { success, error: showError } = useToastContext();
const { user } = useAuth();
const canManage = user?.role === 'admin' || user?.role === 'manager';

  const load = useCallback(async () => {
    setError(null);
    try {
      const [dayRes, movRes] = await Promise.all([
        api.day(date),
        api.movements(date),
      ]);
      setDay(dayRes);
      setMovements(movRes.movements);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [date]);

  useEffect(() => { void load(); }, [load]);

  const onSave = async (row: Row, value: string) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) return;
    setSaveStatus(prev => ({ ...prev, [row.productId]: 'pending' }));
    try {
      await api.saveCount(date, row.productId, amount, row.unit);
      setSaveStatus(prev => ({ ...prev, [row.productId]: 'saved' }));
      success('Count saved', `${row.productName}: ${formatNumber(amount)} ${row.unit}`);
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [row.productId]: 'idle' }));
      }, 2000);
      await load();
    } catch (e) {
      setSaveStatus(prev => ({ ...prev, [row.productId]: 'error' }));
      showError('Save failed', (e as Error).message);
    }
  };

  const onMovementSave = async (productId: string, type: Movement['type'], amount: number, unit: string, reason: string) => {
    setBusy(true);
    try {
      await api.createMovement(date, productId, type, amount, unit, reason);
      await load();
      setShowMovementDialog({ open: false });
      success(`${type === 'spillage' ? 'Spillage' : 'Adjustment'} recorded`, reason);
    } catch (e) {
      showError('Failed to record', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onSync = async () => {
    setBusy(true);
    try {
      const r = await api.syncOpening(date);
      await load();
      success('Opening carried forward', `${r.applied} applied, ${r.skipped} skipped`);
    } catch (e) {
      showError('Sync failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const openMovementDialog = (row: Row, type: Movement['type']) => {
    setShowMovementDialog({ open: true, product: row, type });
  };

  const rows = (day?.rows ?? []).filter(r =>
    r.productName.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedCategory === 'all' || r.category === selectedCategory)
  );

  const productMovements = (productId: string) =>
    movements.filter(m => m.productId === productId) as Movement[];

  const getSaveStatusIndicator = (productId: string) => {
    const status = saveStatus[productId];
    if (status === 'pending') return <span className="save-indicator save-indicator--pending" title="Saving…" aria-label="Saving">⟳</span>;
    if (status === 'saved') return <span className="save-indicator save-indicator--saved" title="Saved" aria-label="Saved">✓</span>;
    if (status === 'error') return <span className="save-indicator save-indicator--error" title="Save failed" aria-label="Save failed">✗</span>;
    return null;
  };

  // Get unique categories from products
  const categories = useCallback(() => {
    const cats = new Set<string>();
    day?.rows.forEach(r => cats.add(r.category || 'other'));
    return Array.from(cats).sort();
  }, [day]);

  return (
    <section style={{ padding: 'var(--space-4) var(--page-gutter)' }}>
      <div className="page-header" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)'
      }}>
        <div>
          <h1 className="page-title">Daily Inventory</h1>
          <p className="page-subtitle">Physical count and reconciliation for {date}</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 'var(--inline-gap)', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={onSync} disabled={busy} leftIcon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          }>
            Sync Opening
          </Button>
          <Button variant="secondary" onClick={() => window.open(`/api/reports/reconciliation.csv?date=${date}`, '_blank')} leftIcon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          }>
            Export CSV
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

      {!day ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div className="skeleton" style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-full)', margin: '0 auto var(--space-4)' }} />
          <p style={{ color: 'var(--text-tertiary)' }}>Loading inventory data...</p>
        </div>
      ) : (
        <>
          {/* Toolbar with date picker and search */}
          <div className="toolbar" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 'var(--space-3)',
            padding: 'var(--space-3)',
            background: 'var(--surface-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-4)'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
              <label className="form-label" style={{ flex: '1 1 180px' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--text-secondary)' }}>Inventory Date</span>
                <input
                  id="inv-date"
                  type="date"
                  value={date}
                  min="2026-08-31"
                  onChange={e => setDate(e.target.value)}
                  className="form-input"
                  style={{ maxWidth: '200px', width: '100%' }}
                />
              </label>
              <label className="form-label" style={{ flex: '1 1 250px' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--text-secondary)' }}>Search Products</span>
                <input
                  id="inv-search"
                  type="search"
                  placeholder="Search by name, brand, or barcode..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </label>
            </div>
            
            {/* Category filter chips */}
            <div className="category-nav" style={{ 
              display: 'flex', 
              gap: 'var(--inline-gap-sm)', 
              overflowX: 'auto',
              paddingBottom: 'var(--space-1)',
              scrollbarWidth: 'none'
            }}>
<button
                className={`category-chip ${selectedCategory === 'all' ? 'category-chip--active' : ''}`}
                onClick={() => setSelectedCategory('all')}
                style={{
                  background: selectedCategory === 'all' ? 'var(--brand-600)' : 'var(--surface-elevated)',
                  color: selectedCategory === 'all' ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                  borderColor: selectedCategory === 'all' ? 'var(--brand-600)' : 'var(--border-default)',
                } as React.CSSProperties & { '--chipColor'?: string }}
              >
                All
                <span className="category-chip__count">{rows.length}</span>
              </button>
              {categories().map(cat => (
                <button
                  key={cat}
                  className={`category-chip ${selectedCategory === cat ? 'category-chip--active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: selectedCategory === cat ? `var(--cat-${cat})` : 'var(--surface-elevated)',
                    color: selectedCategory === cat ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                    borderColor: selectedCategory === cat ? `var(--cat-${cat})` : 'var(--border-default)',
                  } as React.CSSProperties & { '--chipColor'?: string }}
                >
                  {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  <span className="category-chip__count">
                    {rows.filter(r => r.category === cat).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid - Shopping app style */}
          <ProductGrid
            products={rows.map(r => {
              const pm = productMovements(r.productId);
              const spillage = pm.filter(m => m.type === 'spillage').reduce((s, m) => s + m.amount, 0);
              const adjustments = pm.filter(m => m.type === 'adjustment').reduce((s, m) => s + m.amount, 0);
              const transfersIn = pm.filter(m => m.type === 'transfer_in').reduce((s, m) => s + m.amount, 0);
              const transfersOut = pm.filter(m => m.type === 'transfer_out').reduce((s, m) => s + m.amount, 0);
              const receipts = pm.filter(m => m.type === 'receipt').reduce((s, m) => s + m.amount, 0);
              const consumption = pm.filter(m => m.type === 'consumption').reduce((s, m) => s + m.amount, 0);
              const isLiquor = !!(r.unit === 'ml' && r.bottleSizeMl);
              const stockQty = r.physicalCount ?? r.expectedClosing ?? 0;
              const status = getStockStatus(stockQty, r.reorderLevel ?? 0, isLiquor);
              
              return {
                id: r.productId,
                name: r.productName,
                brand: r.brand,
                category: r.category || 'other',
                stockUnit: r.unit,
                packageSizeAmount: r.packageSizeAmount,
                packageSizeUnit: r.packageSizeUnit,
                bottleSizeMl: r.bottleSizeMl,
                stockQuantity: stockQty,
                physicalQuantity: r.physicalCount,
                expectedQuantity: r.expectedClosing,
                variance: r.variance,
                status: status as 'in-stock' | 'low-stock' | 'critical-stock' | 'out-of-stock' | 'pending' | 'normal',
                isLiquor: Boolean(isLiquor),
                onQuantityChange: (id: string, qty: number) => onSave(r, qty.toString()),
              };
            })}
            loading={!day}
            emptyMessage="No products found"
            emptyAction={
              <Button variant="ghost" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                Clear filters
              </Button>
            }
            onProductClick={(p) => console.log('Product clicked', p)}
            onQuantityChange={(id, qty) => {
              const row = rows.find(r => r.productId === id);
              if (row) onSave(row, qty.toString());
            }}
            showActions={true}
          />

          {/* Also keep table view for desktop */}
          <div style={{ display: 'none' }} className="table-view">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="num">Opening</th>
                    <th className="num">Receipts</th>
                    <th className="num">Consumed</th>
                    <th className="num">Spillage</th>
                    <th className="num">Adjustments</th>
                    <th className="num">Transfers</th>
                    <th className="num">Expected</th>
                    <th>Physical</th>
                    <th className="num">Variance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const pm = productMovements(r.productId);
                    const spillage = pm.filter(m => m.type === 'spillage').reduce((s, m) => s + m.amount, 0);
                    const adjustments = pm.filter(m => m.type === 'adjustment').reduce((s, m) => s + m.amount, 0);
                    const transfersIn = pm.filter(m => m.type === 'transfer_in').reduce((s, m) => s + m.amount, 0);
                    const transfersOut = pm.filter(m => m.type === 'transfer_out').reduce((s, m) => s + m.amount, 0);
                    const receipts = pm.filter(m => m.type === 'receipt').reduce((s, m) => s + m.amount, 0);
                    const consumption = pm.filter(m => m.type === 'consumption').reduce((s, m) => s + m.amount, 0);

                    const variance = r.variance ?? 0;
                    const varianceClass = variance < 0 ? 'neg' : variance > 0 ? 'pos' : '';

                    return (
                      <tr key={r.productId}>
                        <td className="product-cell">
                          <div style={{ fontWeight: '500' }}>{r.productName}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{r.unit}</div>
                        </td>
                        <td className="num">{r.opening}</td>
                        <td className="num">{receipts || r.receipts}</td>
                        <td className="num">{consumption || r.consumption}</td>
                        <td className="num neg">{spillage || r.spillage || 0}</td>
                        <td className="num">{adjustments || r.adjustments || 0}</td>
                        <td className="num">{transfersIn - transfersOut || (r.transferIn || 0) - (r.transferOut || 0)}</td>
                        <td className="num strong">{r.expectedClosing}</td>
                        <td>
                          <CountInput row={r} disabled={busy} onCommit={v => onSave(r, v)} />
                          {getSaveStatusIndicator(r.productId)}
                        </td>
                        <td className={`num ${varianceClass}`}>
                          {r.variance == null ? '—' : variance > 0 ? '+' + variance : variance}
                        </td>
                        <td className="actions">
                          {canManage && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => openMovementDialog(r, 'spillage')} disabled={busy} aria-label={`Record spillage for ${r.productName}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                                </svg>
                                Spill
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openMovementDialog(r, 'adjustment')} disabled={busy} aria-label={`Record adjustment for ${r.productName}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Adj
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-tertiary)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📦</div>
                        <p>No products found matching your search.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {canManage && showMovementDialog.open && showMovementDialog.product && (
        <MovementDialog
          product={showMovementDialog.product}
          type={showMovementDialog.type!}
          onClose={() => setShowMovementDialog({ open: false })}
          onSave={onMovementSave}
          disabled={busy}
        />
      )}
    </section>
  );
}

function CountInput(props: {
  row: Row; disabled: boolean; onCommit: (v: string) => void;
}) {
  const [value, setValue] = useState(props.row.physicalCount?.toString() ?? '');
  useEffect(() => {
    setValue(props.row.physicalCount?.toString() ?? '');
  }, [props.row.physicalCount]);
  const isVolume = props.row.unit === 'ml';

  return (
    <div className="count-field" style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-gap-sm)' }}>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step={isVolume ? '1' : '1'}
        aria-label={`Physical count for ${props.row.productName} in ${props.row.unit}`}
        value={value}
        disabled={props.disabled}
        onChange={e => setValue(e.target.value)}
        onBlur={() => {
          if (value !== '' && value !== (props.row.physicalCount?.toString() ?? '')) {
            props.onCommit(value);
          }
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' && value !== '' && value !== (props.row.physicalCount?.toString() ?? '')) {
            props.onCommit(value);
          }
        }}
        className="form-input"
        style={{ width: '80px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-base)' }}
      />
      <span className="unit-pill" style={{ 
        fontSize: 'var(--text-xs)', 
        padding: '0.125rem 0.375rem',
        background: 'var(--surface-elevated)',
        borderRadius: 'var(--radius-full)',
        color: 'var(--text-tertiary)'
      }}>{props.row.unit}</span>
    </div>
  );
}

function MovementDialog(props: {
  product: Row;
  type: Movement['type'];
  onClose: () => void;
  onSave: (productId: string, type: Movement['type'], amount: number, unit: string, reason: string) => void;
  disabled: boolean;
}) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isVolume = props.product.unit === 'ml';
  const isAdjustment = props.type === 'adjustment';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (!Number.isFinite(val) || (val <= 0 && !isAdjustment)) {
      setError(isAdjustment ? 'Amount is required' : 'Amount must be positive');
      return;
    }
    if (isAdjustment && val === 0) {
      setError('Amount must not be zero');
      return;
    }
    setError(null);
    props.onSave(props.product.productId, props.type, val, props.product.unit, reason.trim());
  };

  return (
    <Dialog
      isOpen={true}
      onClose={props.onClose}
      title={`Record ${props.type === 'spillage' ? 'Spillage' : 'Adjustment'}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={props.onClose} disabled={props.disabled}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={props.disabled} loading={props.disabled}>
            Save {props.type === 'spillage' ? 'Spillage' : 'Adjustment'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            <strong>{props.product.productName}</strong> — Unit: {props.product.unit}
          </p>
        </div>

        {error && (
          <div role="alert" style={{
            padding: 'var(--space-3)',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-main)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-on)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-4)'
          }}>
            {error}
          </div>
        )}

        <div className="form-grid" style={{ marginBottom: 'var(--space-4)' }}>
          <label className="form-label required">
            Amount <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>({props.product.unit})</span>
            <input
              type="number"
              inputMode="decimal"
              min={isAdjustment ? '-999999' : '0'}
              step={isVolume ? '1' : '1'}
              value={amount}
              onChange={e => { setAmount(e.target.value); setError(null); }}
              disabled={props.disabled}
              autoFocus
              required
              aria-describedby={isAdjustment ? 'adj-hint' : undefined}
              className="form-input"
              placeholder={isAdjustment ? 'Enter amount (negative for reduction)' : 'Enter positive amount'}
            />
            {isAdjustment && (
              <span id="adj-hint" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Use negative for reduction, positive for increase</span>
            )}
          </label>
          <label className="form-label">
            Reason
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={props.type === 'spillage' ? 'e.g., broken bottle, overpour' : 'e.g., stock correction, recount'}
              rows={3}
              maxLength={500}
              disabled={props.disabled}
              className="form-textarea"
            />
          </label>
        </div>
      </form>
    </Dialog>
  );
}