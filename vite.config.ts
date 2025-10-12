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
        // TMDB API v3 proxy - CORS sorunu çözümü
        '/api/tmdb': {
          target: 'https://api.themoviedb.org/3',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/tmdb/, ''),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('🔧 Proxy Request:', req.url);
              console.log('🔧 Original URL:', req.url);
              
              // TMDB API v3 için API Key ekle
              const apiKey = env.VITE_TMDB_API_KEY;
              if (apiKey) {
                // URL'ye api_key parametresi ekle
                const url = new URL(proxyReq.path, 'https://api.themoviedb.org');
                url.searchParams.set('api_key', apiKey);
                proxyReq.path = url.pathname + url.search;
                console.log('✅ API Key added to URL:', apiKey.substring(0, 10) + '...');
              } else {
                console.log('❌ No API Key found');
              }
              
              // Content-Type header ekle
              proxyReq.setHeader('Content-Type', 'application/json');
              proxyReq.setHeader('Accept', 'application/json');
              
              // Debug: Tüm header'ları yazdır
              console.log('📋 Request Headers:', proxyReq.getHeaders());
            });
            
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('📡 Proxy Response:', proxyRes.statusCode, req.url);
              if (proxyRes.statusCode === 401) {
                console.log('❌ 401 Unauthorized - Authentication failed');
              }
            });
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
    }
  }
})