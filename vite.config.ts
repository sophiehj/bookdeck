import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
              return 'vendor-react'
            }
            if (id.includes('node_modules/firebase')) {
              return 'vendor-firebase'
            }
            if (id.includes('node_modules/@anthropic-ai')) {
              return 'vendor-ai'
            }
          },
        },
      },
    },
    server: {
      proxy: {
        '/kakao-api': {
          target: 'https://dapi.kakao.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/kakao-api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Authorization', `KakaoAK ${env.VITE_KAKAO_API_KEY ?? ''}`)
            })
          },
        },
      },
    },
  }
})
