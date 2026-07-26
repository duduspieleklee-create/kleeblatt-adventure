import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  root: '.',
  build: {
    outDir: './dist',
    emptyOutDir: true,
    rollupOptions: {
      external: ['@gala-chain/sdk']
    }
  },
  server: {
    port: 3000,
    open: true,
    strictPort: true
  }
}));
