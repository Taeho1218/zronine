import { tokenStore } from './tokenStore'

/**
 * 목업 모드 스위치.
 *
 * 다른 모듈에서 가져오지 않고 여기서 직접 읽는 게 중요하다. 이렇게 써야 빌드할 때
 * 이 자리에 true/false 가 그대로 박히고, 목업을 끈 빌드에서는 아래 `if (MOCK_ENABLED)`
 * 블록이 통째로 죽은 코드가 되어 mock.js 와 거기 딸린 데모 이미지가 번들에서 빠진다.
 * (상수를 다른 파일에 두면 그 연결이 끊겨 쓰지도 않을 데모 데이터가 사용자에게 전송된다)
 */
const MOCK_ENABLED = import.meta.env.VITE_USE_MOCK === 'true'

/** 목업은 필요할 때만 실어온다. */
async function callMock(path, options) {
  const { mockRequest } = await import('./mock')
  return mockRequest(path, options)
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

/**
 * 백엔드 ApiResponse(success/message/data/errorCode) 의 실패 응답을 그대로 담는 에러.
 * 화면에서는 err.message 를 그대로 노출하고, 분기가 필요할 때만 err.code 를 본다.
 */
export class ApiError extends Error {
  constructor(message, { status, code, data } = {}) {
    super(message || '요청을 처리하지 못했습니다.')
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.data = data
  }
}

function buildUrl(path, params) {
  const url = `${BASE_URL}${path}`
  if (!params) return url
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    // 같은 이름을 여러 번 보내야 하는 값이 있다 (예: 정렬 기준을 1·2순위로 겹쳐 주는 sort)
    if (Array.isArray(value)) {
      value.forEach((v) => v !== undefined && v !== null && v !== '' && qs.append(key, v))
      return
    }
    qs.append(key, value)
  })
  const query = qs.toString()
  return query ? `${url}?${query}` : url
}

/*
 * 개발 중 네트워크 탭을 안 열어봐도 무슨 요청이 오갔는지 콘솔에서 바로 보려고 남긴다.
 * 배포 빌드에서는 찍지 않는다 — 응답 본문에 사용자 정보와 토큰이 섞여 있어
 * 사용자 브라우저 콘솔에 그대로 남기는 건 곤란하고, import.meta.env.DEV 가
 * 빌드 시 false 로 박히면서 이 호출들이 통째로 제거되기도 한다.
 */
const LOG = import.meta.env.DEV

function logRequest(method, path, { params, body } = {}) {
  if (LOG) console.log(`%c[API →] ${method} ${path}`, 'color:#6b7280', { params, body })
}

function logSuccess(method, path, data) {
  if (LOG) console.log(`%c[API ✓] ${method} ${path}`, 'color:#16a34a', data)
}

function logFailure(method, path, err) {
  if (LOG) console.log(`%c[API ✗] ${method} ${path}`, 'color:#dc2626', err)
}

/**
 * 리프레시 토큰 쿠키를 주고받으려면 credentials 를 실어야 한다.
 * 쿠키의 path 가 /api/auth 라 실제로 딸려나가는 요청은 재발급/로그아웃뿐이지만,
 * 나중에 API 를 다른 도메인에 올려도(cross-site) 그대로 동작하도록 모든 요청에 붙인다.
 * (서버 CorsConfig 가 allowCredentials(true) + 정확한 Origin 을 쓰고 있어 안전하다)
 */
const CREDENTIALS = 'include'

/**
 * 액세스 토큰이 만료되면 리프레시 쿠키로 한 번만 재발급하고 원 요청을 재시도한다.
 * 동시에 여러 요청이 401 을 받아도 재발급은 한 번만 돌도록 진행 중인 Promise 를 공유한다.
 */
let reissuePromise = null

export async function reissue() {
  if (!reissuePromise) {
    logRequest('POST', '/api/auth/reissue')
    reissuePromise = (async () => {
      try {
        if (MOCK_ENABLED) {
          const data = await callMock('/api/auth/reissue', { method: 'POST' })
          if (!data) {
            logFailure('POST', '/api/auth/reissue', '쿠키 없음/만료')
            return false
          }
          tokenStore.set({ accessToken: data.accessToken, user: data.user })
          logSuccess('POST', '/api/auth/reissue', data)
          return true
        }
        // 리프레시 토큰은 바디로 보내지 않는다. 브라우저가 httpOnly 쿠키를 자동으로 붙인다.
        const res = await fetch(buildUrl('/api/auth/reissue'), {
          method: 'POST',
          credentials: CREDENTIALS,
        })
        const body = await res.json().catch(() => null)
        if (!res.ok || !body?.success) {
          logFailure('POST', '/api/auth/reissue', body)
          return false
        }
        tokenStore.set({ accessToken: body.data.accessToken, user: body.data.user })
        logSuccess('POST', '/api/auth/reissue', body.data)
        return true
      } catch (err) {
        logFailure('POST', '/api/auth/reissue', err)
        return false
      } finally {
        // 다음 401 때 다시 시도할 수 있도록 비워준다.
        setTimeout(() => {
          reissuePromise = null
        }, 0)
      }
    })()
  }
  return reissuePromise
}

async function rawRequest(path, { method = 'GET', params, body, isForm = false, auth = true } = {}) {
  const headers = {}
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json'

  const accessToken = tokenStore.getAccessToken()
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`

  const res = await fetch(buildUrl(path, params), {
    method,
    headers,
    credentials: CREDENTIALS,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  })

  // 204 나 빈 본문이 올 수 있어 파싱 실패를 에러로 보지 않는다.
  const payload = await res.json().catch(() => null)

  if (!res.ok || (payload && payload.success === false)) {
    throw new ApiError(payload?.message, {
      status: res.status,
      code: payload?.errorCode,
      data: payload?.data,
    })
  }
  return payload ? payload.data : null
}

/**
 * 재발급을 시도해볼 만한 실패인지 판단한다.
 *
 * EXPIRED_TOKEN 은 물론이고, 액세스 토큰이 아예 없어 생긴 UNAUTHORIZED 도 대상이다.
 * 리프레시 쿠키는 액세스 토큰보다 훨씬 오래 살아서(기본 14일) 브라우저를 껐다 켠 뒤에도
 * 쿠키만으로 세션을 되살릴 수 있기 때문이다.
 */
function canRetryWithReissue(err, path) {
  if (!(err instanceof ApiError) || err.status !== 401) return false
  // 로그인/재발급 자체가 401 이면 재발급을 다시 부를 이유가 없다 (무한 루프 방지).
  if (path.startsWith('/api/auth/')) return false
  return err.code === 'EXPIRED_TOKEN' || err.code === 'INVALID_TOKEN' || err.code === 'UNAUTHORIZED'
}

async function requestOnce(path, options) {
  try {
    return await rawRequest(path, options)
  } catch (err) {
    if (options.auth === false || !canRetryWithReissue(err, path)) throw err

    const ok = await reissue()
    if (!ok) {
      tokenStore.clear()
      throw err
    }
    return rawRequest(path, options)
  }
}

export async function request(path, options = {}) {
  const method = options.method ?? 'GET'
  logRequest(method, path, options)

  try {
    const data = MOCK_ENABLED ? await callMock(path, options) : await requestOnce(path, options)
    logSuccess(method, path, data)
    return data
  } catch (err) {
    logFailure(method, path, err)
    throw err
  }
}

export const http = {
  get: (path, params, options) => request(path, { ...options, method: 'GET', params }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData, isForm: true }),
}
