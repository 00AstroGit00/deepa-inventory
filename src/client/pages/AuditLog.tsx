import { useEffect, useState } from 'react';
import { api } from '../api';
import { Input, Select, Button, formatNumber, KPICard, Dialog } from '../components/ui';

interface AuditLogEntry {
  id: number;
  actor_id: string;
  actor_email: string;
  occurred_at: string;
  entity_type: string;
  entity_id: string;
  operation: string;
  previous_state: any;
  new_state: any;
  reason: string | null;
  operation_id: string | null;
  prev_hash: string;
  row_hash: string;
}

export function AuditLog() {
  const [list, setList] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filters, setFilters] = useState({
    entityType: '',
    operation: '',
    actorEmail: '',
    dateFrom: '',
    dateTo: '',
  });
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const load = async () => {
    setBusy(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (filters.entityType) params.set('entityType', filters.entityType);
      if (filters.operation) params.set('operation', filters.operation);
      if (filters.actorEmail) params.set('actorEmail', filters.actorEmail);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);

      const res = await fetch(`/api/audit-log?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setList(data.entries);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { void load(); }, [page, pageSize, filters]);

  const showDetails = (entry: AuditLogEntry) => {
    setSelectedEntry(entry);
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
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">Tamper-evident audit trail for all system changes</p>
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
            id="al-entity"
            value={filters.entityType}
            onChange={e => setFilters({ ...filters, entityType: e.target.value })}
            options={[
              { value: '', label: 'All Entities' },
              { value: 'product', label: 'Product' },
              { value: 'supplier', label: 'Supplier' },
              { value: 'product_supplier', label: 'Product-Supplier' },
              { value: 'purchase_order', label: 'Purchase Order' },
              { value: 'goods_receipt', label: 'Goods Receipt' },
              { value: 'inventory_day', label: 'Inventory Day' },
              { value: 'movement', label: 'Movement' },
              { value: 'physical_count', label: 'Physical Count' },
            ]}
            placeholder="All Entities"
            style={{ maxWidth: '200px' }}
          />
          <Select
            id="al-op"
            value={filters.operation}
            onChange={e => setFilters({ ...filters, operation: e.target.value })}
            options={[
              { value: '', label: 'All Operations' },
              { value: 'create', label: 'Create' },
              { value: 'update', label: 'Update' },
              { value: 'deactivate', label: 'Deactivate' },
              { value: 'status_change', label: 'Status Change' },
              { value: 'upsert', label: 'Upsert' },
              { value: 'sync_opening', label: 'Sync Opening' },
            ]}
            placeholder="All Operations"
            style={{ maxWidth: '200px' }}
          />
          <Input
            id="al-actor"
            type="text"
            placeholder="Filter by actor email"
            value={filters.actorEmail}
            onChange={e => setFilters({ ...filters, actorEmail: e.target.value })}
            style={{ maxWidth: '250px' }}
          />
          <Input
            id="al-from"
            type="date"
            placeholder="From"
            value={filters.dateFrom}
            onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
            style={{ maxWidth: '180px' }}
          />
          <Input
            id="al-to"
            type="date"
            placeholder="To"
            value={filters.dateTo}
            onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
            style={{ maxWidth: '180px' }}
          />
          <Button variant="ghost" onClick={load} disabled={busy} leftIcon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          }>
            Refresh
          </Button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Time</th>
                <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Actor</th>
                <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Entity</th>
                <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Operation</th>
                <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Entity ID</th>
                <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(entry => (
                <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
                    {new Date(entry.occurred_at).toLocaleString()}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                    {entry.actor_email}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span className="badge" style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
                      {entry.entity_type}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span className="badge" style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
                      {entry.operation}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.entity_id}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Button variant="ghost" size="sm" onClick={() => showDetails(entry)}>View</Button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-tertiary)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📜</div>
                    <p>No audit entries found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Dialog */}
      {selectedEntry && (
        <Dialog
          isOpen={true}
          onClose={() => setSelectedEntry(null)}
          title="Audit Entry Details"
          size="lg"
          footer={
            <Button variant="primary" onClick={() => setSelectedEntry(null)}>Close</Button>
          }
        >
          <pre style={{ 
            fontSize: 'var(--text-xs)', 
            fontFamily: 'var(--font-mono)', 
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-word',
            color: 'var(--text-primary)',
            lineHeight: '1.5'
          }}>
            {JSON.stringify(selectedEntry, null, 2)}
          </pre>
        </Dialog>
      )}
    </section>
  );
}