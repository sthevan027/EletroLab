import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('@heroicons')) {
              return 'ui-vendor';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs')) {
              return 'chart-vendor';
            }
            if (id.includes('html2pdf')) {
              return 'pdf-vendor';
            }
            if (id.includes('dexie')) {
              return 'db-vendor';
            }
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            return 'vendor';
          }
          // Feature chunks
          if (id.includes('ai-engine')) {
            return 'ai-engine';
          }
          if (id.includes('generator')) {
            return 'generator';
          }
          if (id.includes('export')) {
            return 'export';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
