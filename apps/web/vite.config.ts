import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      '@packages/core': path.resolve(__dirname, '../../packages/core/src'),
      '@packages/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
  server: {
    port: 3001,
    host: '127.0.0.1',
    proxy: {
      '/api': 'http://localhost:3000',
    }
  }
})
