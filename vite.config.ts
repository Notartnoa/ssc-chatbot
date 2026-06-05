import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Exclude pdfjs-dist dari pre-bundling Vite
    // Ini diperlukan agar worker URL (?url import) bisa resolve dengan benar
    exclude: ['pdfjs-dist'],
  },
})