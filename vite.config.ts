import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-is',
      'react-router-dom',
      'recharts',
      '@tanstack/react-query',
    ],
  },
  build: {
    chunkSizeWarningLimit: 1200,
    sourcemap: false,
    // Preload all chunks so navigation is instant after first load
    modulePreload: { polyfill: true },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core vendor — always needed immediately
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/')) {
            return 'vendor-react';
          }
          // TanStack Query
          if (id.includes('@tanstack/react-query')) return 'vendor-query';
          // Charts — large but needed by many pages
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          // UI components
          if (id.includes('lucide-react') || id.includes('sonner') ||
              id.includes('@radix-ui') || id.includes('class-variance-authority') ||
              id.includes('tailwind-merge')) {
            return 'vendor-ui';
          }
          // Animation
          if (id.includes('framer-motion') || id.includes('/motion/')) return 'vendor-motion';
          // Date utilities
          if (id.includes('date-fns')) return 'vendor-dates';
        },
      },
    },
    commonjsOptions: {
      include: [/recharts/, /react-is/, /node_modules/],
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
});
