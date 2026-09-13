import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true, // Listen on all network interfaces (0.0.0.0) for LAN CAT6 laptops
    watch: {
      ignored: [
        '**/data/**',
        '**/server/**',
        '**/*.json',
        '**/karuna_pos_database.json'
      ]
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
        changeOrigin: true
      }
    }
  },
  base: './'
});
