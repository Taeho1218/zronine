import { tokenStore } from './tokenStore'
import { mockRequest, MOCK_ENABLED } from './mock'

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
    qs.append(key, value)
  })
  const query = qs.toString()
  return query ? `${url}?${query}` : url
}

/**
 * 액세스 토큰이 만료되면 리프레시로 한 번만 재발급하고 원 요청을 재시도한다.
 * 동시에 여러 요청이 401 을 받아도 재발급은 한 번만 돌도록 진행 중인 Promise 를 공유한다.
 */
let reissuePromise = null

async function reissue() {
  const refreshToken = tokenStore.getRefreshToken()
  if (!refreshToken) return false

  if (!reissuePromise) {
    reissuePromise = (async () => {
      try {
        const res = await fetch(buildUrl('/api/auth/reissue'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
        const body = await res.json().catch(() => null)
        if (!res.ok || !body?.success) return false
        tokenStore.set({
          accessToken: body.data.accessToken,
          refreshToken: body.data.refreshToken,
          user: body.data.user,
        })
        return true
      } catch {
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

export async function request(path, options = {}) {
  if (MOCK_ENABLED) return mockRequest(path, options)

  try {
    return await rawRequest(path, options)
  } catch (err) {
    const expired = err instanceof ApiError && err.status === 401 && err.code === 'EXPIRED_TOKEN'
    if (!expired || options.auth === false) throw err

    const ok = await reissue()
    if (!ok) {
      tokenStore.clear()
      throw err
    }
    return rawRequest(path, options)
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
