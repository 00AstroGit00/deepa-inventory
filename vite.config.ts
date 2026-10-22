import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';

function copyPublicDir() {
  return {
    name: 'copy-public',
    writeBundle() {
      const publicDir = resolve(__dirname, 'public');
      const outDir = resolve(__dirname, 'dist/client');
      if (!existsSync(publicDir)) return;

      function copyRecursive(src: string, dest: string) {
        const stat = statSync(src);
        if (stat.isDirectory()) {
          if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
          readdirSync(src).forEach(file => copyRecursive(resolve(src, file), resolve(dest, file)));
        } else {
          copyFileSync(src, dest);
        }
      }
      copyRecursive(publicDir, outDir);
    },
  };
}

export default defineConfig({
  plugins: [react(), copyPublicDir()],
  publicDir: 'public',
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } },
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('zod')) {
              return 'vendor-ui';
            }
            return 'vendor-other';
          }
          if (id.includes('src/pages/DailyInventory') || id.includes('src/pages/Reconciliation') ||
              id.includes('src/pages/Reports') || id.includes('src/pages/AuditLog')) {
            return 'pages-inventory';
          }
          if (id.includes('src/pages/Suppliers') || id.includes('src/pages/PurchaseOrders') ||
              id.includes('src/pages/GoodsReceipts')) {
            return 'pages-procurement';
          }
          if (id.includes('src/pages/Products')) {
            return 'pages-products';
          }
          if (id.includes('src/pages/Dashboard')) {
            return 'pages-dashboard';
          }
        },
      },
    },
  },
  test: { include: ['src/**/*.test.{ts,tsx}'], environment: 'node' },
} as any);
