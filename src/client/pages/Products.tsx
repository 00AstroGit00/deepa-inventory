import { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { BarcodeScanner, KeyboardScanner } from '../components/BarcodeScanner';
import { ProductCard, ProductGrid, Dialog, Button, Input, Select, Textarea, Checkbox, formatNumber } from '../components/ui';
import { useToastContext } from '../components/ui/Toast';

const EMPTY = {
  name: '', brand: '', category: 'beer', stock_unit: 'bottle',
  package_size_amount: '', package_size_unit: 'ml', bottle_size_ml: '',
  tax_treatment: 'outside_gst_excise_vat', reorder_level: '',
  sku: '', barcode: '', is_active: true,
};

interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  sku: string | null;
  barcode: string | null;
  stock_unit: string;
  package_size_amount: number | null;
  package_size_unit: string | null;
  bottle_size_ml: number | null;
  tax_treatment: string;
  reorder_level: number | null;
  is_active: boolean;
}

const CATEGORIES = ['liquor', 'beer', 'soda', 'club_soda', 'water', 'other'] as const;
const STOCK_UNITS = ['ml', 'bottle', 'tin', 'can', 'case', 'piece'] as const;
const PACKAGE_UNITS = ['ml', 'litre', 'bottle', 'tin', 'can'] as const;
const TAX_TREATMENTS = ['outside_gst_excise_vat', 'gst_5', 'gst_18', 'gst_28_cess'] as const;
const LIQUOR_BOTTLE_SIZES = [2000, 1000, 750, 500, 375, 180, 90, 60] as const;

const categoryLabels: Record<string, string> = {
  liquor: 'Liquor & Spirits',
  beer: 'Beer',
  soda: 'Soda',
  club_soda: 'Club Soda',
  water: 'Mineral Water',
  other: 'Other',
};

const categoryColors: Record<string, string> = {
  liquor: 'var(--cat-liquor)',
  beer: 'var(--cat-beer)',
  soda: 'var(--cat-soda)',
  club_soda: 'var(--cat-club_soda)',
  water: 'var(--cat-water)',
  other: 'var(--cat-other)',
};

export function Products() {
  const [list, setList] = useState<Product[]>([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState<Record<string, string>>({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const { success, error: showError } = useToastContext();

  const load = useCallback(() => api.products(q).then(setList).catch(e => setError(e.message)), [q]);
  useEffect(() => { void load(); }, [load]);

  const resetForm = () => {
    setForm({ ...EMPTY });
    setEditingId(null);
    setError(null);
    setScanError(null);
    setShowForm(false);
  };

  const startEdit = (p: Product) => {
    setForm({
      name: p.name,
      brand: p.brand ?? '',
      category: p.category,
      stock_unit: p.stock_unit,
      package_size_amount: p.package_size_amount?.toString() ?? '',
      package_size_unit: p.package_size_unit ?? 'ml',
      bottle_size_ml: p.bottle_size_ml?.toString() ?? '',
      tax_treatment: p.tax_treatment,
      reorder_level: p.reorder_level?.toString() ?? '',
      sku: p.sku ?? '',
      barcode: p.barcode ?? '',
      is_active: p.is_active.toString(),
    });
    setEditingId(p.id);
    setShowForm(true);
    setError(null);
    setScanError(null);
  };

  const handleScan = (barcode: string) => {
    setForm(prev => ({ ...prev, barcode }));
    setScanError(null);
  };

  const handleScanError = (err: string) => {
    setScanError(err);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload = {
        ...form,
        brand: form.brand || null,
        sku: form.sku || null,
        barcode: form.barcode || null,
        package_size_amount: form.package_size_amount ? Number(form.package_size_amount) : null,
        bottle_size_ml: form.bottle_size_ml ? Number(form.bottle_size_ml) : null,
        reorder_level: form.reorder_level ? Number(form.reorder_level) : null,
        is_active: form.is_active === 'true',
      };
      if (editingId) {
        await api.updateProduct(editingId, payload);
        success('Product updated', payload.name);
      } else {
        await api.createProduct(payload);
        success('Product created', payload.name);
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
      await api.updateProduct(showDeleteConfirm.id, { is_active: false });
      success('Product deactivated', showDeleteConfirm.name);
      await load();
    } catch (err) { setError((err as Error).message); }
    finally { 
      setBusy(false);
      setShowDeleteConfirm(null);
    }
  };

  const isLiquor = form.category === 'liquor';

  const activeProducts = list.filter(p => p.is_active);
  const inactiveProducts = list.filter(p => !p.is_active);

  // Convert to ProductCard format for grid view
  const gridProducts = list.map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    stockUnit: p.stock_unit,
    packageSizeAmount: p.package_size_amount,
    packageSizeUnit: p.package_size_unit,
    bottleSizeMl: p.bottle_size_ml,
    stockQuantity: 0, // Not shown in product management
    status: p.is_active ? 'in-stock' : 'out-of-stock' as const,
    isLiquor: p.category === 'liquor',
  }));

  return (
    <section style={{ padding: 'var(--space-4) var(--page-gutter)' }}>
      <div className="page-header" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)'
      }}>
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage inventory products and catalog</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 'var(--inline-gap)', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => { resetForm(); setShowForm(true); }} leftIcon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }>
            Add Product
          </Button>
          <Button variant="secondary" onClick={() => { setQ(''); }} leftIcon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          }>
            Clear Search
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

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <Input
          type="search"
          placeholder="Search by name, barcode, or SKU..."
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

      {/* Category Tabs */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--inline-gap-sm)', overflowX: 'auto', padding: 'var(--space-3)', scrollbarWidth: 'none' }}>
          {['all', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              className={`category-chip ${!showForm && q === '' && !editingId ? 'category-chip--active' : ''}`}
              onClick={() => { /* Category filter would go here */ }}
              style={{ 
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)'
              }}
            >
              {cat === 'all' ? 'All' : categoryLabels[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid - Shopping App Style */}
      <ProductGrid
        products={gridProducts}
        loading={list.length === 0 && !error}
        emptyMessage="No products found"
        emptyAction={
          <Button variant="ghost" onClick={() => { setQ(''); setShowForm(true); }}>
            Add your first product
          </Button>
        }
        onProductClick={(p) => startEdit(list.find(x => x.id === p.id)!)}
        showActions={true}
        compact={true}
      />

      {/* Table View for Desktop */}
      <div style={{ display: 'none' }} className="table-view-desktop">
        <div className="card">
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Stock Unit</th>
                  <th className="num">Bottle (ml)</th>
                  <th className="num">Reorder</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeProducts.map(p => (
                  <tr key={p.id}>
                    <td className="product-cell">
                      <div style={{ fontWeight: '500' }}>{p.name}</div>
                      {p.brand && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{p.brand}</div>}
                    </td>
                    <td>
                      <span className="badge" style={{ 
                        background: `${categoryColors[p.category] || categoryColors.other}15`,
                        color: categoryColors[p.category] || categoryColors.other,
                        border: `1px solid ${categoryColors[p.category] || categoryColors.other}40`
                      }}>
                        {categoryLabels[p.category] || p.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: 'var(--text-sm)', 
                        padding: '0.125rem 0.5rem',
                        background: 'var(--surface-elevated)',
                        borderRadius: 'var(--radius-full)',
                        color: 'var(--text-primary)'
                      }}>{p.stock_unit}</span>
                    </td>
                    <td className="num">{p.bottle_size_ml ?? '—'}</td>
                    <td className="num">{p.reorder_level ?? '—'}</td>
                    <td><span className="badge badge--success">Active</span></td>
                    <td className="actions" style={{ display: 'flex', gap: 'var(--inline-gap)' }}>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(p)} disabled={busy} aria-label={`Edit ${p.name}`}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => confirmDelete(p.id, p.name)} disabled={busy} aria-label={`Deactivate ${p.name}`}>Deactivate</Button>
                    </td>
                  </tr>
                ))}
                {inactiveProducts.map(p => (
                  <tr key={p.id} style={{ opacity: 0.5 }}>
                    <td className="product-cell">
                      <div style={{ fontWeight: '500' }}>{p.name}</div>
                      {p.brand && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{p.brand}</div>}
                    </td>
                    <td>
                      <span className="badge" style={{ 
                        background: `${categoryColors[p.category] || categoryColors.other}15`,
                        color: categoryColors[p.category] || categoryColors.other,
                        border: `1px solid ${categoryColors[p.category] || categoryColors.other}40`
                      }}>
                        {categoryLabels[p.category] || p.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: 'var(--text-sm)', 
                        padding: '0.125rem 0.5rem',
                        background: 'var(--surface-elevated)',
                        borderRadius: 'var(--radius-full)',
                        color: 'var(--text-tertiary)'
                      }}>{p.stock_unit}</span>
                    </td>
                    <td className="num">{p.bottle_size_ml ?? '—'}</td>
                    <td className="num">{p.reorder_level ?? '—'}</td>
                    <td><span className="badge badge--warning">Inactive</span></td>
                    <td className="actions" style={{ display: 'flex', gap: 'var(--inline-gap)' }}>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(p)} disabled={busy} aria-label={`Edit ${p.name}`}>Edit</Button>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-tertiary)' }}>
                      <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📦</div>
                      <p>No products found. Click "Add Product" to create one.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Product Form Dialog */}
      {showForm && (
        <Dialog
          isOpen={true}
          onClose={resetForm}
          title={editingId ? 'Edit Product' : 'Add Product'}
          size="lg"
          footer={
            <>
              {editingId && <Button variant="secondary" onClick={resetForm} disabled={busy}>Cancel</Button>}
              <Button variant="primary" type="submit" form="product-form" disabled={busy}>
                {busy ? 'Saving…' : editingId ? 'Update Product' : 'Create Product'}
              </Button>
            </>
          }
        >
          <form id="product-form" onSubmit={submit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* Basic Information */}
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
                    placeholder="Product name"
                  />
                  <Input
                    label="Brand"
                    value={form.brand}
                    onChange={e => setForm({ ...form, brand: e.target.value })}
                    placeholder="Brand name (optional)"
                  />
                  <Select
                    label="Category"
                    required
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    options={CATEGORIES.map(c => ({ value: c, label: categoryLabels[c] || c }))}
                    placeholder="Select category"
                  />
                  <Select
                    label="Stock Unit"
                    required
                    value={form.stock_unit}
                    onChange={e => setForm({ ...form, stock_unit: e.target.value })}
                    options={STOCK_UNITS.map(u => ({ value: u, label: u.charAt(0).toUpperCase() + u.slice(1) }))}
                    placeholder="Select unit"
                  />
                  <Checkbox
                    label="Active"
                    checked={form.is_active === 'true'}
                    onChange={e => setForm({ ...form, is_active: e.target.checked.toString() })}
                    description="Product will be visible in active lists"
                  />
                </div>
              </div>

              {/* Identification & Barcode */}
              <div>
                <h3 style={{ 
                  font: 'var(--font-weight-semibold) var(--text-lg)/var(--leading-tight) var(--font-sans)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-4)',
                  paddingBottom: 'var(--space-3)',
                  borderBottom: '1px solid var(--border-light)'
                }}>Identification & Barcode</h3>
                <div className="form-grid">
                  <Input
                    label="SKU"
                    value={form.sku}
                    onChange={e => setForm({ ...form, sku: e.target.value })}
                    placeholder="Stock keeping unit (optional)"
                  />
                  <Input
                    label="Barcode"
                    value={form.barcode}
                    onChange={e => setForm({ ...form, barcode: e.target.value })}
                    placeholder="Scan or enter barcode"
                    rightElement={
                      <div style={{ display: 'flex', gap: 'var(--inline-gap-sm)' }}>
                        <KeyboardScanner onScan={handleScan} enabled={!editingId} />
                        <BarcodeScanner onScan={handleScan} onError={handleScanError} />
                      </div>
                    }
                  />
                </div>
              </div>

              {/* Packaging & Pricing */}
              <div>
                <h3 style={{ 
                  font: 'var(--font-weight-semibold) var(--text-lg)/var(--leading-tight) var(--font-sans)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-4)',
                  paddingBottom: 'var(--space-3)',
                  borderBottom: '1px solid var(--border-light)'
                }}>Packaging & Pricing</h3>
                <div className="form-grid">
                  <Input
                    label="Package Size"
                    type="number"
                    min="0"
                    step="0.001"
                    value={form.package_size_amount}
                    onChange={e => setForm({ ...form, package_size_amount: e.target.value })}
                    placeholder="0"
                  />
                  <Select
                    label="Package Unit"
                    value={form.package_size_unit}
                    onChange={e => setForm({ ...form, package_size_unit: e.target.value })}
                    options={PACKAGE_UNITS.map(u => ({ value: u, label: u.charAt(0).toUpperCase() + u.slice(1) }))}
                    placeholder="Select unit"
                  />
                  {isLiquor && (
                    <Select
                      label="Bottle Size (ml)"
                      required
                      value={form.bottle_size_ml}
                      onChange={e => setForm({ ...form, bottle_size_ml: e.target.value })}
                      options={[
                        { value: '', label: 'Select bottle size…' },
                        ...LIQUOR_BOTTLE_SIZES.map(ml => ({ value: String(ml), label: `${ml} ml` }))
                      ]}
                      placeholder="Select bottle size"
                    />
                  )}
                  <Select
                    label="Tax Treatment"
                    required
                    value={form.tax_treatment}
                    onChange={e => setForm({ ...form, tax_treatment: e.target.value })}
                    options={TAX_TREATMENTS.map(t => ({ value: t, label: t.replace(/_/g, ' ').toUpperCase() }))}
                    placeholder="Select tax treatment"
                  />
                  <Input
                    label="Reorder Level"
                    type="number"
                    min="0"
                    step="0.001"
                    value={form.reorder_level}
                    onChange={e => setForm({ ...form, reorder_level: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {scanError && (
              <div role="alert" style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3)',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-main)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger-on)',
                fontSize: 'var(--text-sm)'
              }}>
                {scanError}
              </div>
            )}
          </form>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <Dialog
          isOpen={true}
          onClose={() => setShowDeleteConfirm(null)}
          title="Deactivate Product"
          size="sm"
          variant="danger"
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