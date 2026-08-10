import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 백엔드(Spring Boot)는 8080 에서 뜬다.
// dev 서버에서 /api 와 업로드 이미지(/images)를 그대로 프록시해서
// 브라우저 입장에서는 same-origin 이 되도록 만든다. (CORS 설정에 의존하지 않기 위함)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/images': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
