import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Encaminha as chamadas /api para o servidor Node (porta 3001),
// evitando problemas de CORS durante o desenvolvimento.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
