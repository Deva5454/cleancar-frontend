import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
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
      'react-router-dom',
      'react',
      'react-dom',
      'react-is',
      'recharts',
    ],
  },
  build: {
    chunkSizeWarningLimit: 1200,
    sourcemap: false, // No source maps in production
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-charts": ["recharts"],
          "vendor-ui": ["lucide-react", "sonner"],
        },
      },
    },
    commonjsOptions: {
      include: [/recharts/, /react-is/, /node_modules/],
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
