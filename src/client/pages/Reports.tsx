import { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { Button, Input, Select, formatNumber, formatCurrency, KPICard } from '../components/ui';
import { useToastContext } from '../components/ui/Toast';

type ReportTab = 'valuation' | 'stockHealth' | 'stockMovements' | 'spillageAdjustments' | 'purchaseCostHistory';

export function Reports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('valuation');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { success, error: showError } = useToastContext();

  // Valuation
  const [valuation, setValuation] = useState<{ items: any[]; totalValue: number } | null>(null);
  // Stock Health
  const [stockHealth, setStockHealth] = useState<any[]>([]);
  // Stock Movements
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [movementsFilter, setMovementsFilter] = useState({ from: '', to: '', productId: '', type: '' });
  // Spillage & Adjustments
  const [spillageAdjustments, setSpillageAdjustments] = useState<any[]>([]);
  const [spillFilter, setSpillFilter] = useState({ from: '', to: '', type: '' });
  // Purchase Cost History
  const [purchaseCostHistory, setPurchaseCostHistory] = useState<any[]>([]);
  const [costFilter, setCostFilter] = useState({ productId: '', supplierId: '' });

  const loadValuation = useCallback(async () => {
    setBusy(true);
    try { setValuation(await api.valuation()); } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }, []);

  const loadStockHealth = useCallback(async () => {
    setBusy(true);
    try { setStockHealth(await api.stockHealth()); } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }, []);

  const loadStockMovements = useCallback(async () => {
    setBusy(true);
    try { setStockMovements(await api.stockMovements(movementsFilter)); } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }, [movementsFilter]);

  const loadSpillageAdjustments = useCallback(async () => {
    setBusy(true);
    try { setSpillageAdjustments(await api.spillageAdjustments(spillFilter)); } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }, [spillFilter]);

  const loadPurchaseCostHistory = useCallback(async () => {
    setBusy(true);
    try { setPurchaseCostHistory(await api.purchaseCostHistory(costFilter)); } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }, [costFilter]);

  useEffect(() => { void loadValuation(); }, [loadValuation]);
  useEffect(() => { void loadStockHealth(); }, [loadStockHealth]);
  useEffect(() => { void loadStockMovements(); }, [loadStockMovements]);
  useEffect(() => { void loadSpillageAdjustments(); }, [loadSpillageAdjustments]);
  useEffect(() => { void loadPurchaseCostHistory(); }, [loadPurchaseCostHistory]);

  const downloadCsv = async (blobPromise: Promise<Response>, filename: string) => {
    try {
      const res = await blobPromise;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      success('Export complete', filename);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const tabs = [
    { id: 'valuation', label: 'Valuation', icon: CurrencyIcon },
    { id: 'stockHealth', label: 'Stock Health', icon: HealthIcon },
    { id: 'stockMovements', label: 'Stock Movements', icon: MovementIcon },
    { id: 'spillageAdjustments', label: 'Spillage & Adjustments', icon: SpillIcon },
    { id: 'purchaseCostHistory', label: 'Purchase Cost History', icon: HistoryIcon },
  ];

  return (
    <section style={{ padding: 'var(--space-4) var(--page-gutter)' }}>
      <div className="page-header" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)'
      }}>
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Insights and exports for inventory management</p>
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

      <div className="card">
        {/* Tab Navigation */}
        <div className="category-nav" role="tablist" aria-label="Report types" style={{ 
          padding: 'var(--space-2) var(--space-3)',
          borderBottom: '1px solid var(--border-light)',
          scrollSnapType: 'x mandatory'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`category-chip ${activeTab === tab.id ? 'category-chip--active' : ''}`}
              style={{ 
                scrollSnapAlign: 'start',
                background: activeTab === tab.id ? 'var(--brand-600)' : 'var(--surface-elevated)',
                color: activeTab === tab.id ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                borderColor: activeTab === tab.id ? 'var(--brand-600)' : 'var(--border-default)'
              }}
            >
              <span className="category-chip__icon" style={{ width: 'var(--icon-sm)', height: 'var(--icon-sm)', flexShrink: 0 }}>
                <tab.icon />
              </span>
              <span className="category-chip__label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: 'var(--space-4)' }}>
          {activeTab === 'valuation' && (
            <ValuationReport data={valuation} busy={busy} onRefresh={loadValuation}
              onExport={() => downloadCsv(api.valuationCsv(), `inventory-valuation-${new Date().toISOString().slice(0,10)}.csv`)} />
          )}

          {activeTab === 'stockHealth' && (
            <StockHealthReport data={stockHealth} busy={busy} onRefresh={loadStockHealth}
              onExport={() => downloadCsv(api.stockHealthCsv(), `stock-health-${new Date().toISOString().slice(0,10)}.csv`)} />
          )}

          {activeTab === 'stockMovements' && (
            <StockMovementsReport data={stockMovements} busy={busy} filter={movementsFilter} onFilterChange={setMovementsFilter} onRefresh={loadStockMovements}
              onExport={() => downloadCsv(api.stockMovementsCsv(movementsFilter), `stock-movements-${movementsFilter.from || 'all'}-to-${movementsFilter.to || 'all'}.csv`)} />
          )}

          {activeTab === 'spillageAdjustments' && (
            <SpillageAdjustmentsReport data={spillageAdjustments} busy={busy} filter={spillFilter} onFilterChange={setSpillFilter} onRefresh={loadSpillageAdjustments}
              onExport={() => downloadCsv(api.spillageAdjustmentsCsv(spillFilter), `spillage-adjustments-${spillFilter.from || 'all'}-to-${spillFilter.to || 'all'}.csv`)} />
          )}

          {activeTab === 'purchaseCostHistory' && (
            <PurchaseCostHistoryReport data={purchaseCostHistory} busy={busy} filter={costFilter} onFilterChange={setCostFilter} onRefresh={loadPurchaseCostHistory}
              onExport={() => downloadCsv(api.purchaseCostHistoryCsv(costFilter), `purchase-cost-history-${new Date().toISOString().slice(0,10)}.csv`)} />
          )}
        </div>
      </div>
    </section>
  );
}

// Tab Icons
function CurrencyIcon({ className = '' }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
}
function HealthIcon({ className = '' }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
}
function MovementIcon({ className = '' }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>;
}
function SpillIcon({ className = '' }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>;
}
function HistoryIcon({ className = '' }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}

function ValuationReport(props: { data: { items: any[]; totalValue: number } | null; busy: boolean; onRefresh: () => void; onExport: () => void }) {
  if (!props.data) return <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>Loading…</div>;
  
  return (
    <div>
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-4)' }}>
        <KPICard
          label="Total Inventory Value"
          value={formatCurrency(props.data.totalValue)}
          icon={<CurrencyIcon />}
          trend={{ value: `${props.data.items.length} products`, type: 'positive' }}
        />
        <KPICard
          label="Products in Stock"
          value={props.data.items.length}
          icon={<HealthIcon />}
          trend={{ value: 'Active items', type: 'positive' }}
          variant="success"
        />
      </div>
      
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <Button variant="primary" onClick={props.onExport} disabled={props.busy} leftIcon={<DownloadIcon />}>Export CSV</Button>
        <Button variant="ghost" onClick={props.onRefresh} disabled={props.busy} leftIcon={<RefreshIcon />}>Refresh</Button>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Product</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Category</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Unit</th>
              <th style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>On Hand</th>
              <th style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Latest Cost</th>
              <th style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {props.data.items.map((r: any) => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ fontWeight: '500' }}>{r.name}</div></td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-secondary)' }}>{r.category}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ 
                    fontSize: 'var(--text-sm)', 
                    padding: '0.125rem 0.5rem',
                    background: 'var(--surface-elevated)',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-primary)'
                  }}>{r.unit}</span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{formatNumber(r.onHand)}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₹{r.latestCost.toFixed(2)}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>₹{formatNumber(r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StockHealthReport(props: { data: any[]; busy: boolean; onRefresh: () => void; onExport: () => void }) {
  const statusColors = {
    in_stock: 'var(--inv-in-stock)',
    low_stock: 'var(--inv-low-stock)',
    critical_stock: 'var(--inv-critical-stock)',
    out_of_stock: 'var(--inv-out-of-stock)',
    pending: 'var(--inv-pending)',
    normal: 'var(--inv-normal)',
  };
  
  const statusLabels = {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    critical_stock: 'Critical',
    out_of_stock: 'Out of Stock',
    pending: 'Pending Sync',
    normal: 'Normal',
  };

  return (
    <div>
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-4)' }}>
        <KPICard
          label="In Stock"
          value={props.data.filter(d => d.status === 'in_stock').length}
          icon={<HealthIcon />}
          trend={{ value: 'Good', type: 'positive' }}
          variant="success"
        />
        <KPICard
          label="Low Stock"
          value={props.data.filter(d => d.status === 'low_stock').length}
          icon={<HealthIcon />}
          trend={{ value: 'Needs attention', type: 'warning' }}
          variant="warning"
        />
        <KPICard
          label="Critical"
          value={props.data.filter(d => d.status === 'critical_stock').length}
          icon={<HealthIcon />}
          trend={{ value: 'Urgent', type: 'negative' }}
          variant="danger"
        />
        <KPICard
          label="Out of Stock"
          value={props.data.filter(d => d.status === 'out_of_stock').length}
          icon={<HealthIcon />}
          trend={{ value: 'Urgent', type: 'negative' }}
          variant="danger"
        />
      </div>
      
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <Button variant="primary" onClick={props.onExport} disabled={props.busy} leftIcon={<DownloadIcon />}>Export CSV</Button>
        <Button variant="ghost" onClick={props.onRefresh} disabled={props.busy} leftIcon={<RefreshIcon />}>Refresh</Button>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Product</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Category</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Unit</th>
              <th style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>On Hand</th>
              <th style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Reorder</th>
              <th style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Latest Cost</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {props.data.map((r: any) => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ fontWeight: '500' }}>{r.name}</div></td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-secondary)' }}>{r.category}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ 
                    fontSize: 'var(--text-sm)', 
                    padding: '0.125rem 0.5rem',
                    background: 'var(--surface-elevated)',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-primary)'
                  }}>{r.unit}</span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{formatNumber(r.onHand)}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{r.reorderLevel ?? '—'}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₹{r.latestCost.toFixed(2)}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span className="badge" style={{ 
                    background: `${statusColors[r.status as keyof typeof statusColors] || statusColors.normal}15`,
                    color: statusColors[r.status as keyof typeof statusColors] || statusColors.normal,
                    border: `1px solid ${statusColors[r.status as keyof typeof statusColors] || statusColors.normal}40`
                  }}>
                    {statusLabels[r.status as keyof typeof statusLabels] || r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StockMovementsReport(props: { data: any[]; busy: boolean; filter: any; onFilterChange: (f: any) => void; onRefresh: () => void; onExport: () => void }) {
  const MOVEMENT_TYPES = ['opening','receipt','consumption','spillage','adjustment','transfer_in','transfer_out'];
  
  return (
    <div>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
          <label className="form-label" style={{ flex: '1 1 180px' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--text-secondary)' }}>From</span>
            <Input id="sm-from" type="date" value={props.filter.from} onChange={e => props.onFilterChange({ ...props.filter, from: e.target.value })} />
          </label>
          <label className="form-label" style={{ flex: '1 1 180px' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--text-secondary)' }}>To</span>
            <Input id="sm-to" type="date" value={props.filter.to} onChange={e => props.onFilterChange({ ...props.filter, to: e.target.value })} />
          </label>
          <label className="form-label" style={{ flex: '1 1 200px' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--text-secondary)' }}>Type</span>
            <Select id="sm-type" value={props.filter.type} onChange={e => props.onFilterChange({ ...props.filter, type: e.target.value })}
              options={[{ value: '', label: 'All' }, ...MOVEMENT_TYPES.map(t => ({ value: t, label: t }))]}
              placeholder="All types"
            />
          </label>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <Button variant="primary" onClick={props.onExport} disabled={props.busy} leftIcon={<DownloadIcon />}>Export CSV</Button>
        <Button variant="ghost" onClick={props.onRefresh} disabled={props.busy} leftIcon={<RefreshIcon />}>Refresh</Button>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Date</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Product</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Type</th>
              <th style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Amount</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Unit</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Reason</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>By</th>
            </tr>
          </thead>
          <tbody>
            {props.data.map((r: any) => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)', whiteSpace: 'nowrap' }}>{r.date}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ fontWeight: '500' }}>{r.product}</div></td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span className="badge" style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }}>{r.movement_type}</span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{formatNumber(r.amount)}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{r.movement_unit}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-tertiary)' }}>{r.reason ?? '—'}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-tertiary)' }}>{r.created_by ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SpillageAdjustmentsReport(props: { data: any[]; busy: boolean; filter: any; onFilterChange: (f: any) => void; onRefresh: () => void; onExport: () => void }) {
  return (
    <div>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
          <label className="form-label" style={{ flex: '1 1 180px' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--text-secondary)' }}>From</span>
            <Input id="sa-from" type="date" value={props.filter.from} onChange={e => props.onFilterChange({ ...props.filter, from: e.target.value })} />
          </label>
          <label className="form-label" style={{ flex: '1 1 180px' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--text-secondary)' }}>To</span>
            <Input id="sa-to" type="date" value={props.filter.to} onChange={e => props.onFilterChange({ ...props.filter, to: e.target.value })} />
          </label>
          <label className="form-label" style={{ flex: '1 1 200px' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--text-secondary)' }}>Type</span>
            <Select id="sa-type" value={props.filter.type} onChange={e => props.onFilterChange({ ...props.filter, type: e.target.value })}
              options={[{ value: '', label: 'All' }, { value: 'spillage', label: 'Spillage' }, { value: 'adjustment', label: 'Adjustment' }]}
              placeholder="All types"
            />
          </label>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <Button variant="primary" onClick={props.onExport} disabled={props.busy} leftIcon={<DownloadIcon />}>Export CSV</Button>
        <Button variant="ghost" onClick={props.onRefresh} disabled={props.busy} leftIcon={<RefreshIcon />}>Refresh</Button>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Date</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Product</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Type</th>
              <th style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Amount</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Unit</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Reason</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>By</th>
            </tr>
          </thead>
          <tbody>
            {props.data.map((r: any) => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)', whiteSpace: 'nowrap' }}>{r.date}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ fontWeight: '500' }}>{r.product}</div></td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <span className="badge" style={{ 
                    background: r.movement_type === 'spillage' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                    color: r.movement_type === 'spillage' ? 'var(--danger-on)' : 'var(--warning-on)',
                    border: r.movement_type === 'spillage' ? '1px solid var(--danger-main)' : '1px solid var(--warning-main)'
                  }}>{r.movement_type}</span>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{formatNumber(r.amount)}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{r.unit}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-tertiary)' }}>{r.reason ?? '—'}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-tertiary)' }}>{r.created_by ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PurchaseCostHistoryReport(props: { data: any[]; busy: boolean; filter: any; onFilterChange: (f: any) => void; onRefresh: () => void; onExport: () => void }) {
  return (
    <div>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <label className="form-label" style={{ flex: '1 1 250px' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--text-secondary)' }}>Product</span>
            <Select id="pch-product" value={props.filter.productId} onChange={e => props.onFilterChange({ ...props.filter, productId: e.target.value })}
              options={[{ value: '', label: 'All' }, ...Array.from(new Map(props.data.map((r: any) => [r.product_id, r.product_name])).entries()).map(([id, name]) => ({ value: id, label: name }))]}
              placeholder="All products"
            />
          </label>
          <label className="form-label" style={{ flex: '1 1 250px' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--text-secondary)' }}>Supplier</span>
            <Select id="pch-supplier" value={props.filter.supplierId} onChange={e => props.onFilterChange({ ...props.filter, supplierId: e.target.value })}
              options={[{ value: '', label: 'All' }, ...Array.from(new Set(props.data.map((r: any) => r.supplier_name))).map(name => ({ value: name, label: name }))]}
              placeholder="All suppliers"
            />
          </label>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <Button variant="primary" onClick={props.onExport} disabled={props.busy} leftIcon={<DownloadIcon />}>Export CSV</Button>
        <Button variant="ghost" onClick={props.onRefresh} disabled={props.busy} leftIcon={<RefreshIcon />}>Refresh</Button>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Product</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Supplier</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Supplier SKU</th>
              <th style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Purchase Price</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Price Unit</th>
              <th style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Min Order</th>
              <th style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Lead Time</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Preferred</th>
              <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Effective From</th>
            </tr>
          </thead>
          <tbody>
            {props.data.map((r: any) => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ fontWeight: '500' }}>{r.product_name}</div></td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{r.supplier_name}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-tertiary)' }}>{r.supplier_sku ?? '—'}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₹{Number(r.purchase_price).toFixed(2)}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{r.price_unit}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.min_order_qty}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.lead_time_days} days</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{r.is_preferred ? '★' : '—'}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{r.effective_from}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DownloadIcon({ className = '' }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
}
function RefreshIcon({ className = '' }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true"><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>;
}