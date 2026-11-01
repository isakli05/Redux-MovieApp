/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      host: true,
      proxy: {
        // TMDB API v3 dev proxy: injects api_key server-side so the key never
        // appears in dev network tabs. Never log credentials here.
        '/api/tmdb': {
          target: 'https://api.themoviedb.org/3',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/tmdb/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const apiKey = env.VITE_TMDB_API_KEY
              if (!apiKey) return
              const url = new URL(proxyReq.path, 'https://api.themoviedb.org')
              url.searchParams.set('api_key', apiKey)
              proxyReq.path = url.pathname + url.search
            })
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/Pages'),
        '@types': path.resolve(__dirname, './src/types'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@api': path.resolve(__dirname, './src/api'),
        '@redux': path.resolve(__dirname, './src/redux')
      }
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      // wt/ hosts the six parallel PM worktrees — their in-progress tests
      // must not leak into this tree's gate (same reason as eslint ignores).
      exclude: ['**/node_modules/**', '**/dist/**', 'wt/**']
    }
  }
})
