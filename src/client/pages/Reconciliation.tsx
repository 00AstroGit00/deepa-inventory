import { useEffect, useState } from 'react';
import { api, DayResponse } from '../api';
import { formatNumber, KPICard, Button } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

const today = () => new Date().toISOString().slice(0, 10);

export function Reconciliation() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'manager';
  const [date, setDate] = useState(today());
  const [day, setDay] = useState<DayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.day(date).then(setDay).catch(e => setError((e as Error).message));
  }, [date]);

  const rows = (day?.rows ?? []).filter(r => r.variance != null && r.variance !== 0);
  const shortageCount = rows.filter(r => r.variance! < 0).length;
  const overageCount = rows.filter(r => r.variance! > 0).length;
  const totalVariance = rows.reduce((sum, r) => sum + Math.abs(r.variance || 0), 0);

  return (
    <section style={{ padding: 'var(--space-4) var(--page-gutter)' }}>
      <div className="page-header" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)'
      }}>
        <div>
          <h1 className="page-title">Reconciliation</h1>
          <p className="page-subtitle">Review and resolve inventory variances for {date}</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 'var(--inline-gap)', flexWrap: 'wrap' }}>
          {canManage && (
            <a 
              className="btn btn-secondary" 
              href={`/api/reports/reconciliation.csv?date=${date}`}
              download
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </a>
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

      {!day ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div className="skeleton" style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-full)', margin: '0 auto var(--space-4)' }} />
          <p style={{ color: 'var(--text-tertiary)' }}>Loading reconciliation data...</p>
        </div>
      ) : (
        <>
          {/* KPI Summary */}
          <div className="kpi-grid">
            <KPICard
              label="Total Variances"
              value={rows.length}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="M12 6v6l4 2" />
                </svg>
              }
              trend={{ value: rows.length > 0 ? 'Needs review' : 'All matched', type: rows.length > 0 ? 'warning' : 'positive' }}
            />
            <KPICard
              label="Shortages"
              value={shortageCount}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              }
              trend={{ value: shortageCount > 0 ? 'Investigate' : 'None', type: shortageCount > 0 ? 'negative' : 'positive' }}
              variant="danger"
            />
            <KPICard
              label="Overages"
              value={overageCount}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="M8 12h8" />
                  <path d="M12 8v8" />
                </svg>
              }
              trend={{ value: overageCount > 0 ? 'Investigate' : 'None', type: overageCount > 0 ? 'warning' : 'positive' }}
              variant="warning"
            />
            <KPICard
              label="Total Variance"
              value={formatNumber(totalVariance)}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
                  <line x1="18" y1="20" x2="6" y2="20" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <path d="M8 10h8" />
                  <path d="M8 14h8" />
                </svg>
              }
              trend={{ value: totalVariance > 0 ? 'Review required' : 'Perfect match', type: totalVariance > 0 ? 'warning' : 'positive' }}
              variant="info"
            />
          </div>

          {/* Toolbar */}
          <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="toolbar" style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 'var(--space-3)', 
              alignItems: 'flex-end',
              padding: 'var(--space-3)'
            }}>
              <label className="form-label" style={{ flex: '1 1 180px' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--text-secondary)' }}>Date</span>
                <input
                  id="rec-date"
                  type="date"
                  value={date}
                  min="2026-08-31"
                  onChange={e => setDate(e.target.value)}
                  className="form-input"
                  style={{ maxWidth: '200px', width: '100%' }}
                />
              </label>
              <div style={{ flex: '1 1 300px', display: 'flex', gap: 'var(--inline-gap)', flexWrap: 'wrap' }}>
                <Button variant="ghost" size="sm" onClick={() => window.open(`/api/reports/stock-movements.csv?date=${date}`, '_blank')}>
                  Movement History
                </Button>
              </div>
            </div>
          </div>

          {/* Variance List */}
          <div className="card">
            {rows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>✓</div>
                <h3 style={{ 
                  font: 'var(--font-weight-semibold) var(--text-xl)/var(--leading-tight) var(--font-sans)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-2)'
                }}>No Variances</h3>
                <p style={{ color: 'var(--text-tertiary)' }}>All products match their expected quantities for {date}.</p>
              </div>
            ) : (
              <div className="list" role="list" aria-label="Variance items">
                {rows.map(r => {
                  const variance = r.variance!;
                  const isShortage = variance < 0;
                  const absVariance = Math.abs(variance);
                  
                  return (
                    <div key={r.productId} className="list-item" style={{ 
                      borderLeft: `4px solid ${isShortage ? 'var(--danger-main)' : 'var(--warning-main)'}`,
                      gap: 'var(--space-4)'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="inventory-heading">{r.productName}</div>
                        <div className="inventory-label" style={{ marginTop: 'var(--space-1)' }}>
                          Expected: <span className="inventory-num">{formatNumber(r.expectedClosing)}</span> {r.unit} •
                          Physical: <span className="inventory-num">{formatNumber(r.physicalCount ?? 0)}</span> {r.unit}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--inline-gap-sm)' }}>
                        <div style={{
                          font: 'var(--font-weight-bold) var(--inventory-num)/var(--leading-tight) var(--font-family-mono)',
                          color: isShortage ? 'var(--inventory-shortage)' : 'var(--inventory-excess)'
                        }}>
                          {isShortage ? '−' : '+'}{formatNumber(absVariance)} {r.unit}
                        </div>
                        <span className={`badge ${isShortage ? 'badge--danger' : 'badge--warning'}`}>
                          {isShortage ? 'Shortage' : 'Overage'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}