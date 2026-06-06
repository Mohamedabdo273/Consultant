import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      // All /api/* requests in dev go through Vite → no CORS issue
      '/api': {
        target: 'https://consultation.runasp.net',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
