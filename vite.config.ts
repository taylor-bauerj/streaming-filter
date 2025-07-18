import {type AliasOptions, defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      port: 3000,
      watch: {
        ignored: [
            '**/backend/**',
            '**/backend/data/**',
            '**/backend/data/parental-guides.json'
        ]
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      } as AliasOptions
    }
})
