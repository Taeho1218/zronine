import { http } from './client'

export { ApiError } from './client'

export const authApi = {
  login: (email, password) => http.post('/api/auth/login', { email, password }, { auth: false }),
  signUp: (payload) => http.post('/api/auth/signup', payload, { auth: false }),
  logout: () => http.post('/api/auth/logout'),
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

export const uploadApi = {
  image: (file) => {
    const form = new FormData()
    form.append('file', file)
    return http.upload('/api/uploads/images', form)
  },
  images: (files) => {
    const form = new FormData()
    Array.from(files).forEach((f) => form.append('files', f))
    return http.upload('/api/uploads/images/bulk', form)
  },
}

export const followApi = {
  follow: (userId) => http.post(`/api/users/${userId}/follow`),
  unfollow: (userId) => http.delete(`/api/users/${userId}/follow`),
}
