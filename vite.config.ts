import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  base: '/',
  build: {
    target: 'esnext',
    minify: 'terser'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
