import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  server: {
    port: 3000,
    host: true,
    open: true,
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2015',
  },
  
  // Vite automatically exposes VITE_* environment variables to import.meta.env
  // No need to manually define process.env - this was a security risk
});