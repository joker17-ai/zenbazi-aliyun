import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
      '/ws': {
        target: 'ws://localhost:8787',
        ws: true
      }
    }
  },
  preview: {
    proxy: {
      '/api': 'http://localhost:8787',
      '/ws': {
        target: 'ws://localhost:8787',
        ws: true
      }
    }
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    reportCompressedSize: false,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          ui: ['lucide-react'],
          lunar: ['lunar-javascript'],
          cnchar: ['cnchar']
        }
      }
    }
  },
  esbuild: {
    drop: ['console', 'debugger']
  }
})
