import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'framer-motion': fileURLToPath(new URL('./src/lib/motion-lite.js', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler') || id.includes('react-router')) {
              return 'vendor-react';
            }

            if (id.includes('@tanstack/react-query')) {
              return 'vendor-tanstack-query';
            }

            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }

            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }

            return undefined;
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://learnr-backend.vercel.app/',
        changeOrigin: true,
      },
    },
  },
});
