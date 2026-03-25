import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://116.202.29.37/quotation1/app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/mes1sep': {
        target: 'http://116.202.29.37',
        changeOrigin: true,
      },
    },
  },
})
