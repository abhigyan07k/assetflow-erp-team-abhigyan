import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, './src/app'),
      '@config': path.resolve(__dirname, './src/config'),
      '@core': path.resolve(__dirname, './src/core'),
      '@data': path.resolve(__dirname, './src/data'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@store': path.resolve(__dirname, './src/store')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
