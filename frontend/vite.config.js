import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * 목업을 끈 빌드에서 src/api/mock.js 를 아예 모듈 그래프에서 들어내는 플러그인.
 *
 * client.js 가 `if (MOCK_ENABLED) await import('./mock')` 로 감싸두면 실행 코드는 사라지지만,
 * Rollup 은 이미 만들어둔 청크를 그대로 내보낸다. 아무도 내려받지 않는 파일이긴 해도
 * 데모 데이터와 샘플 이미지(1.5MB)가 배포 서버에 그대로 올라가므로, 해석 단계에서 빈 모듈로 바꿔치기한다.
 */
function excludeMock(useMock) {
  const STUB_ID = '\0gonggu:mock-disabled'

  return {
    name: 'gonggu-exclude-mock',
    apply: 'build',
    enforce: 'pre',
    resolveId(source) {
      if (useMock) return null
      return source === './mock' || source.endsWith('/api/mock') ? STUB_ID : null
    },
    load(id) {
      if (id !== STUB_ID) return null
      // 실제로 불릴 일이 없는 자리. 혹시 불리면 설정이 잘못된 것이므로 조용히 넘기지 않는다.
      return `export function mockRequest() {
  throw new Error('목업이 꺼진 빌드입니다. VITE_USE_MOCK 설정을 확인하세요.')
}`
    },
  }
}

// 백엔드(Spring Boot)는 8080 에서 뜬다.
// dev 서버에서 /api 와 업로드 이미지(/images)를 그대로 프록시해서
// 브라우저 입장에서는 same-origin 이 되도록 만든다. (CORS 설정에 의존하지 않기 위함)
export default defineConfig(({ mode }) => {
  // 셸에서 넘긴 값이 .env 보다 우선한다 (Vite 의 import.meta.env 와 같은 규칙).
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const useMock = env.VITE_USE_MOCK === 'true'

  return {
    plugins: [react(), excludeMock(useMock)],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: 'http://localhost:8080', changeOrigin: true },
        '/images': { target: 'http://localhost:8080', changeOrigin: true },
      },
    },
  }
})
