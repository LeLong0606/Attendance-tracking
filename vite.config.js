import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), basicSsl()],
  server: {
    https: true,
    host: true,  // Expose to network
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://100.96.18.81:7085',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        secure: false, // Ignore SSL certificate errors for dev
      }
    }
  }
})
