import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  esbuild: {
    charset: 'utf8',
  },
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
    chunkSizeWarningLimit: 1201,
    sourcemap: false,
    modulePreload: { polyfill: true },
    rollupOptions: {
      output: {
        charset: 'utf8',
        manualChunks(id) {
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('@tanstack/react-query')) return 'vendor-query';
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          if (id.includes('lucide-react') || id.includes('sonner') ||
              id.includes('@radix-ui') || id.includes('class-variance-authority') ||
              id.includes('tailwind-merge')) {
            return 'vendor-ui';
          }
          if (id.includes('framer-motion') || id.includes('/motion/')) return 'vendor-motion';
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
