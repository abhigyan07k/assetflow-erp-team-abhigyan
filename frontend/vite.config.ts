import { defineConfig } from 'vite';
import path from 'node:path';
import { copyFileSync } from 'node:fs';

export default defineConfig({
  plugins: [
    {
      name: 'copy-legacy-app-script',
      closeBundle() {
        copyFileSync(path.resolve(__dirname, './app.js'), path.resolve(__dirname, './dist/app.js'));
      }
    }
  ],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, './src/app'),
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
