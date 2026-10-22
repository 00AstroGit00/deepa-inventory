import { useEffect, useState } from 'react';
import { api } from '../api';
import { KPICard } from '../components/ui';
import { formatNumber } from '../utils/format';

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.dashboard().then(setData).catch(e => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="card" role="alert" style={{ 
        background: 'var(--danger-bg)', 
        borderColor: 'var(--danger-main)', 
        color: 'var(--danger-on)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        margin: 'var(--space-4) var(--page-gutter)'
      }}>
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="kpi-grid" style={{ padding: 'var(--space-3) var(--page-gutter)' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="kpi-card skeleton" style={{ height: '100px' }} />
        ))}
      </div>
    );
  }

  return (
    <section style={{ padding: 'var(--space-4) var(--page-gutter)' }}>
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Inventory overview and key metrics</p>
        </div>
      </div>

      <div className="kpi-grid">
        <KPICard
          label="Open Inventory Days"
          value={data.openInventoryDays}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
          trend={{ value: 'Active', type: 'positive' }}
        />
        
        <KPICard
          label="Unresolved Negative Stock"
          value={data.unresolvedNegativeStock}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
          trend={{ value: data.unresolvedNegativeStock > 0 ? 'Requires attention' : 'All clear', type: data.unresolvedNegativeStock > 0 ? 'negative' : 'positive' }}
          variant="danger"
        />
        
        <KPICard
          label="Counts in Last 24h"
          value={data.countsLast24h}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
          trend={{ value: 'Recent activity', type: 'positive' }}
          variant="success"
        />

        <KPICard
          label="Low Stock Items"
          value={data.lowStock?.length || 0}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
          trend={{ value: (data.lowStock?.length || 0) > 0 ? 'Needs attention' : 'All stocked', type: (data.lowStock?.length || 0) > 0 ? 'warning' : 'positive' }}
          variant="warning"
        />
      </div>

      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <div className="card__header">
          <h2 className="text-title-large" style={{ margin: 0 }}>Stock Below Reorder Level</h2>
          <span className="badge badge--warning">
            {data.lowStock?.length || 0} item{data.lowStock?.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="card__body" style={{ padding: 'var(--card-padding)' }}>
          {(!data.lowStock || data.lowStock.length === 0) ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>✓</div>
              <p>All products are above their reorder levels</p>
            </div>
          ) : (
            <div className="list" role="list" aria-label="Low stock products">
              {data.lowStock.map((p: any) => (
                <div key={p.id} className="list-item" style={{ gap: 'var(--space-3)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="list-item__title" style={{ fontSize: 'var(--text-base)' }}>{p.name}</div>
                    <div className="list-item__subtitle">{p.category || 'Unknown'} • {p.unit}</div>
                  </div>
                  <div className="list-item__meta" style={{ textAlign: 'right' }}>
                    <div className="list-item__value" style={{ color: 'var(--danger-main)' }}>
                      {formatNumber(p.onHand)}
                    </div>
                    <div className="list-item__unit">Reorder: {formatNumber(p.reorderLevel)}</div>
                  </div>
                  <span className="badge badge--danger">Low Stock</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}