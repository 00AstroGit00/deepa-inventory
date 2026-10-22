import 'express-async-errors';
import 'dotenv/config';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import { errorHandler } from './errors';
import { authRouter } from './routes/auth';
import { productsRouter } from './routes/products';
import { inventoryRouter } from './routes/inventory';
import { reportsRouter } from './routes/reports';
import { suppliersRouter } from './routes/suppliers';
import { productSuppliersRouter } from './routes/productSuppliers';
import { purchaseOrdersRouter } from './routes/purchaseOrders';
import { goodsReceiptsRouter } from './routes/goodsReceipts';
import { auditLogRouter } from './routes/auditLog';
import { usersRouter } from './routes/users';
import { exceptionsRouter } from './routes/exceptions';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/product-suppliers', productSuppliersRouter);
app.use('/api/purchase-orders', purchaseOrdersRouter);
app.use('/api/goods-receipts', goodsReceiptsRouter);
app.use('/api/audit-log', auditLogRouter);
app.use('/api/users', usersRouter);
app.use('/api/exceptions', exceptionsRouter);

const clientDir = join(process.cwd(), 'dist', 'client');
if (existsSync(clientDir)) {
  app.use(express.static(clientDir));
  app.get('*', (_req, res) => res.sendFile(join(clientDir, 'index.html')));
}

app.use(errorHandler);
const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`API listening on :${port}`));
