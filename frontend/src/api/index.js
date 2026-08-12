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
  userPosts: (userId, page = 0) => http.get(`/api/users/${userId}/posts`, { page }),
  updateMe: (payload) => http.patch('/api/users/me', payload),
  /**
   * 회원 탈퇴. 즉시 삭제가 아니라 30일 보관(Soft Delete)이며,
   * 응답의 purgeScheduledAt 으로 실제 삭제 예정일을 안내할 수 있다.
   */
  withdraw: () => http.delete('/api/users/me'),
  myPosts: (page = 0) => http.get('/api/users/me/posts', { page }),
  mySaves: (page = 0) => http.get('/api/users/me/saves', { page }),
  myAlerts: (page = 0) => http.get('/api/users/me/alerts', { page }),
}

export const categoryApi = {
  list: () => http.get('/api/categories', undefined, { auth: false }),
}

export const postApi = {
  /** 메인 피드 겸 검색. 파라미터는 전부 선택값이라 빈 값은 buildUrl 에서 걸러진다. */
  /*
   * sort 는 서버가 Pageable 로 받는 값이라 "필드,방향" 모양으로 보낸다.
   * 배열로 주면 1순위·2순위가 되고, 안 주면 서버 기본값(최신순)이다.
   */
  list: ({ page = 0, size, categoryId, postType, status, keyword, sort } = {}) =>
    http.get('/api/posts', { page, size, categoryId, postType, status, keyword, sort }),
  /**
   * 홈 배너의 "인기 피드".
   * 순위(좋아요 → 댓글 → 최신)와 마감 지난 글 제외를 서버가 정해 고정 개수로 내려주므로
   * 페이지 파라미터가 없고, 응답도 페이지가 아니라 배열이다.
   */
  popular: () => http.get('/api/posts/popular'),
  detail: (postId) => http.get(`/api/posts/${postId}`),
  /**
   * 상세 페이지의 "비슷한 상품".
   * 어떤 글이 비슷한지는 서버가 정한다(같은 물건 이름 → 없으면 같은 카테고리).
   * 일반글이면 빈 배열이 오므로 프론트에서 글 종류를 따로 가릴 필요가 없다.
   */
  similar: (postId) => http.get(`/api/posts/${postId}/similar`),
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
  followers: (userId, page = 0) => http.get(`/api/users/${userId}/followers`, { page }),
  followings: (userId, page = 0) => http.get(`/api/users/${userId}/followings`, { page }),
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

/** 서버가 사전 서명을 지원하지 않을 때만 던진다. 이 경우에만 서버 경유로 물러난다. */
class PresignUnsupportedError extends Error {}

async function requestPresign(file) {
  try {
    // 인증이 필요한 호출이라 Authorization 헤더가 붙는다(http.post 기본 동작).
    return await http.post('/api/uploads/presign', { fileName: file.name, contentType: file.type })
  } catch (err) {
    if (err.code === 'PRESIGN_NOT_SUPPORTED') {
      presignSupported = false
      throw new PresignUnsupportedError()
    }
    throw err
  }
}

/**
 * 한 장을 올린다. presign 으로 URL 을 받아 곧바로 그 URL 에 PUT 한다.
 * 발급과 사용 사이를 붙여두면 URL 유효시간(expiresInSeconds, 기본 10분) 안에 못 쓰는 일이 없다.
 */
async function uploadOne(file) {
  const presigned = await requestPresign(file)

  // 우리 서버가 아니라 저장소(R2)로 바로 보내는 요청이다. 서명이 R2 주소에만 유효하므로
  // 백엔드로 보내면 안 되고, BASE_URL 이나 프록시도 타지 않는다.
  //
  // Content-Type 은 서명에 포함되어 있어 서버가 알려준 requiredContentType 과 글자 그대로
  // 같아야 한다. 다르면 R2 가 서명 불일치로 요청 자체를 거부한다.
  // Authorization 헤더나 쿠키가 섞여도 마찬가지라 아무것도 덧붙이지 않는다.
  // (fetch 의 credentials 기본값이 same-origin 이라 cross-origin 인 R2 에는 쿠키가 안 간다)
  const res = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': presigned.requiredContentType },
    body: file,
  })
  if (!res.ok) {
    throw new Error('이미지 업로드에 실패했어요. 잠시 후 다시 시도해 주세요.')
  }

  // PUT 이 성공한 순간 끝이다. 백엔드에 따로 알릴 필요 없이 publicUrl 을 그대로 최종 주소로 쓴다.
  return presigned.publicUrl
}

function uploadViaServer(files) {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  return http.upload('/api/uploads/images/bulk', form)
}

export const uploadApi = {
  /** 여러 장을 올리고 이미지 URL 배열을 돌려준다. 장마다 presign → PUT 을 따로 수행한다. */
  async images(files) {
    const list = Array.from(files)
    if (list.length === 0) return []
    list.forEach(assertUploadable)

    if (presignSupported) {
      try {
        return await Promise.all(list.map(uploadOne))
      } catch (err) {
        // 서버가 presign 자체를 지원하지 않을 때(=로컬 개발)만 서버 경유로 물러난다.
        // 배포 환경(provider=r2)에서 presign 이 다른 이유로 실패한 것이라면
        // multipart 로 우회하면 안 되므로(파일이 서버를 거치게 됨) 그대로 에러를 올린다.
        if (!(err instanceof PresignUnsupportedError)) throw err
      }
    }

    return uploadViaServer(list)
  },

  async image(file) {
    const [url] = await uploadApi.images([file])
    return url
  },
}
