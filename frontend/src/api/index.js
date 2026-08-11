import { http, reissue } from './client'

export { ApiError } from './client'

export const authApi = {
  login: (email, password) => http.post('/api/auth/login', { email, password }, { auth: false }),
  signUp: (payload) => http.post('/api/auth/signup', payload, { auth: false }),
  logout: () => http.post('/api/auth/logout'),
  /** 리프레시 토큰은 httpOnly 쿠키라 바디로 넘길 게 없다. 성공하면 tokenStore 가 갱신된다. */
  reissue,
}

export const userApi = {
  checkEmail: (email) => http.get('/api/users/check-email', { email }, { auth: false }),
  checkNickname: (nickname) => http.get('/api/users/check-nickname', { nickname }, { auth: false }),
  me: () => http.get('/api/users/me'),
  profile: (userId) => http.get(`/api/users/${userId}`),
  updateMe: (payload) => http.patch('/api/users/me', payload),
  myPosts: (page = 0) => http.get('/api/users/me/posts', { page }),
  mySaves: (page = 0) => http.get('/api/users/me/saves', { page }),
  myAlerts: (page = 0) => http.get('/api/users/me/alerts', { page }),
}

export const categoryApi = {
  list: () => http.get('/api/categories', undefined, { auth: false }),
}

export const postApi = {
  /** 메인 피드 겸 검색. 파라미터는 전부 선택값이라 빈 값은 buildUrl 에서 걸러진다. */
  list: ({ page = 0, categoryId, postType, status, keyword } = {}) =>
    http.get('/api/posts', { page, categoryId, postType, status, keyword }),
  detail: (postId) => http.get(`/api/posts/${postId}`),
  create: (payload) => http.post('/api/posts', payload),
  update: (postId, payload) => http.put(`/api/posts/${postId}`, payload),
  remove: (postId) => http.delete(`/api/posts/${postId}`),

  like: (postId) => http.post(`/api/posts/${postId}/like`),
  unlike: (postId) => http.delete(`/api/posts/${postId}/like`),
  save: (postId) => http.post(`/api/posts/${postId}/save`),
  unsave: (postId) => http.delete(`/api/posts/${postId}/save`),
  alert: (postId) => http.post(`/api/posts/${postId}/alert`),
  unalert: (postId) => http.delete(`/api/posts/${postId}/alert`),
}

export const commentApi = {
  list: (postId) => http.get(`/api/posts/${postId}/comments`),
  create: (postId, { content, parentId = null, secret = false }) =>
    http.post(`/api/posts/${postId}/comments`, { content, parentId, secret }),
  remove: (commentId) => http.delete(`/api/comments/${commentId}`),
}

export const followApi = {
  follow: (userId) => http.post(`/api/users/${userId}/follow`),
  unfollow: (userId) => http.delete(`/api/users/${userId}/follow`),
}

/* ── 이미지 업로드 ──────────────────────────────────────────────────────────
 *
 * 서버는 두 가지 경로를 제공한다.
 *
 *   1. presign  — 사전 서명 URL 을 받아 저장소(R2)에 파일을 "직접" PUT 한다. 운영 기본 경로.
 *   2. multipart — 파일을 서버로 보내 서버가 대신 저장한다. provider=local(로컬 개발) 전용.
 *
 * 로컬 개발에서는 presign 이 PRESIGN_NOT_SUPPORTED 로 거절되므로, 한 번 거절당하면
 * 그 사실을 기억해두고 이후로는 곧장 multipart 로 간다. (파일마다 헛호출하지 않도록)
 * 덕분에 프론트 코드는 그대로 두고 서버의 app.upload.provider 만 바꿔도 동작한다.
 */

// 서버 ImageFileValidator 와 같은 기준. 올리기 전에 걸러 불필요한 왕복을 줄인다.
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

let presignSupported = true

function assertUploadable(file) {
  const extension = (file.name?.split('.').pop() ?? '').toLowerCase()
  if (!ALLOWED_CONTENT_TYPES.includes(file.type) || !ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error('JPG, PNG, GIF, WEBP 이미지만 올릴 수 있어요.')
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('이미지 한 장당 5MB까지 올릴 수 있어요.')
  }
}

/** 사전 서명 URL 을 받는다. 서버가 지원하지 않으면 null 을 돌려주고 이후 호출을 막는다. */
async function requestPresign(file) {
  try {
    return await http.post('/api/uploads/presign', { fileName: file.name, contentType: file.type })
  } catch (err) {
    if (err.code === 'PRESIGN_NOT_SUPPORTED') {
      presignSupported = false
      return null
    }
    throw err
  }
}

async function uploadViaPresign(file, presigned) {
  // 우리 서버가 아니라 저장소로 바로 보내는 요청이다.
  // 서명에 Content-Type 이 포함돼 있어 requiredContentType 과 정확히 일치해야 하고,
  // Authorization 헤더나 쿠키가 섞이면 서명 불일치로 거부되므로 아무것도 덧붙이지 않는다.
  const res = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': presigned.requiredContentType },
    body: file,
  })
  if (!res.ok) {
    throw new Error('이미지 업로드에 실패했어요. 잠시 후 다시 시도해 주세요.')
  }
  // 저장소에 올라간 순간 접근 가능한 주소라 별도 확인 호출 없이 그대로 게시글에 담으면 된다.
  return presigned.publicUrl
}

function uploadViaServer(files) {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  return http.upload('/api/uploads/images/bulk', form)
}

export const uploadApi = {
  /** 여러 장을 올리고 이미지 URL 배열을 돌려준다. */
  async images(files) {
    const list = Array.from(files)
    if (list.length === 0) return []
    list.forEach(assertUploadable)

    if (presignSupported) {
      const presignedList = await Promise.all(list.map(requestPresign))
      // 하나라도 지원되지 않으면(로컬 환경) 전부 서버 경유로 돌린다.
      if (presignedList.every(Boolean)) {
        return Promise.all(list.map((file, i) => uploadViaPresign(file, presignedList[i])))
      }
    }

    return uploadViaServer(list)
  },

  async image(file) {
    const [url] = await uploadApi.images([file])
    return url
  },
}
