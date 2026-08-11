/**
 * 백엔드(및 MySQL)를 띄우지 않고 화면을 확인하기 위한 인메모리 목업.
 *
 * .env 의 VITE_USE_MOCK=true 일 때만 client.js 가 이쪽으로 요청을 돌린다.
 * 실제 API 와 응답 스키마(PostFeedResponse / PostDetailResponse / CommentResponse ...)를 맞춰두었으므로
 * 목업을 끄면 화면 코드는 그대로 두고 서버 데이터로 전환된다.
 */
export const MOCK_ENABLED = import.meta.env.VITE_USE_MOCK === 'true'

const CATEGORIES = [
  { categoryId: 1, name: '식품' },
  { categoryId: 2, name: '리빙' },
  { categoryId: 3, name: '패션' },
  { categoryId: 4, name: '뷰티' },
  { categoryId: 5, name: '디지털' },
  { categoryId: 6, name: '다이어트' },
  { categoryId: 7, name: '영양제' },
]

const ME = { userId: 1, nickname: '로스터리 민', profileImageUrl: null }
const U2 = { userId: 2, nickname: '커피러버', profileImageUrl: null }
const U3 = { userId: 3, nickname: 'soo****', profileImageUrl: null }
const U4 = { userId: 4, nickname: '지호아빠', profileImageUrl: null }

/**
 * 서버의 LocalDateTime 은 타임존이 없는 로컬 시각이다.
 * toISOString() 은 UTC 로 바꿔버려 화면에서 9시간(KST) 어긋나므로 로컬 시각 그대로 문자열을 만든다.
 */
const iso = (d) => {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(
    d.getMinutes(),
  )}:${p(d.getSeconds())}`
}
const daysFromNow = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return iso(d)
}
const hoursAgo = (n) => {
  const d = new Date()
  d.setHours(d.getHours() - n)
  return iso(d)
}

let posts = [
  {
    postId: 1,
    postType: 'SELLER',
    author: ME,
    title: '에티오피아 예가체프 G1 · 갓 볶은 스페셜티 원두 1kg 공동구매',
    content:
      '매주 화요일 주문 즉시 로스팅해 보내드리는 에티오피아 예가체프 G1 원두입니다. 재스민과 베르가못의 화사한 향, 은은한 레몬 산미가 특징이에요.\n\n공동구매로 함께 모이면 1kg 대용량을 정가보다 29% 저렴하게 나눠 받을 수 있습니다. 참여 시 분쇄도(홀빈/드립/에스프레소)를 선택할 수 있고, 로스팅 후 2일 이내 순차 발송됩니다.',
    imageUrls: [],
    productName: '예가체프 G1 원두 1kg',
    price: 19900,
    listPrice: 28000,
    buyUrl: 'https://example.com/products/yirgacheffe-g1',
    startDate: daysFromNow(0),
    endDate: daysFromNow(7),
    eventNote: '50명 달성 시 드립백 10개 증정',
    progress: 'ONGOING',
    categories: [CATEGORIES[0], CATEGORIES[6]],
    likeCount: 100,
    commentCount: 24,
    liked: false,
    saved: true,
    alerted: true,
    followingAuthor: false,
    mine: false,
    participantCount: 42,
    createdAt: hoursAgo(3),
  },
  {
    postId: 2,
    postType: 'SELLER',
    author: ME,
    title: '콜롬비아 수프리모 핸드드립 원두 1kg',
    content: '균형 잡힌 바디감과 초콜릿 뉘앙스가 좋은 데일리 원두입니다.',
    imageUrls: [],
    productName: '콜롬비아 수프리모 1kg',
    price: 17500,
    buyUrl: 'https://example.com/products/supremo',
    startDate: daysFromNow(-1),
    endDate: daysFromNow(4),
    eventNote: null,
    progress: 'ONGOING',
    categories: [CATEGORIES[0]],
    likeCount: 12,
    commentCount: 3,
    liked: false,
    saved: false,
    alerted: false,
    followingAuthor: false,
    mine: false,
    participantCount: 38,
    createdAt: hoursAgo(20),
  },
  {
    postId: 3,
    postType: 'SELLER',
    author: U2,
    title: '디카페인 스위스워터 원두 1kg',
    content: '화학 용매 없이 물로만 카페인을 제거한 스위스워터 공정 원두예요.',
    imageUrls: [],
    productName: '디카페인 스위스워터 1kg',
    price: 21000,
    buyUrl: 'https://example.com/products/decaf',
    startDate: daysFromNow(-2),
    endDate: daysFromNow(9),
    eventNote: '30명 달성 시 무료배송',
    progress: 'ONGOING',
    categories: [CATEGORIES[0]],
    likeCount: 8,
    commentCount: 1,
    liked: false,
    saved: false,
    alerted: false,
    followingAuthor: false,
    mine: false,
    participantCount: 12,
    createdAt: hoursAgo(30),
  },
  {
    postId: 4,
    postType: 'SELLER',
    author: U3,
    title: '브라질 산토스 블렌드 홀빈 1kg',
    content: '고소한 견과류 향이 도는 입문용 블렌드입니다.',
    imageUrls: [],
    productName: '브라질 산토스 블렌드 1kg',
    price: 15900,
    buyUrl: 'https://example.com/products/santos',
    startDate: daysFromNow(-5),
    endDate: daysFromNow(2),
    eventNote: null,
    progress: 'ONGOING',
    categories: [CATEGORIES[0]],
    likeCount: 21,
    commentCount: 5,
    liked: false,
    saved: false,
    alerted: true,
    followingAuthor: false,
    mine: false,
    participantCount: 56,
    createdAt: hoursAgo(50),
  },
  {
    postId: 5,
    postType: 'SELLER',
    author: U4,
    title: '저당 그래놀라 500g x 3팩 공동구매',
    content: '설탕 대신 알룰로스를 쓴 저당 그래놀라입니다. 아침 대용으로 좋아요.',
    imageUrls: [],
    productName: '저당 그래놀라 500g',
    price: 12900,
    buyUrl: 'https://example.com/products/granola',
    startDate: daysFromNow(1),
    endDate: daysFromNow(11),
    eventNote: null,
    progress: 'UPCOMING',
    categories: [CATEGORIES[0], CATEGORIES[5]],
    likeCount: 4,
    commentCount: 0,
    liked: false,
    saved: false,
    alerted: false,
    followingAuthor: false,
    mine: false,
    participantCount: 6,
    createdAt: hoursAgo(70),
  },
  {
    postId: 6,
    postType: 'GENERAL',
    author: U2,
    title: '공구 처음 참여해봤는데 후기 남겨요',
    content: '배송도 빠르고 포장도 꼼꼼했어요. 다음에도 참여할 예정입니다!',
    imageUrls: [],
    productName: null,
    price: null,
    buyUrl: null,
    startDate: null,
    endDate: null,
    eventNote: null,
    progress: 'NONE',
    categories: [],
    likeCount: 17,
    commentCount: 2,
    liked: false,
    saved: false,
    alerted: false,
    followingAuthor: false,
    mine: false,
    participantCount: 0,
    createdAt: hoursAgo(90),
  },
]

let comments = [
  {
    commentId: 1,
    postId: 1,
    parentId: null,
    author: U2,
    content: '디카페인도 같이 진행하실 계획 있으실까요? 있으면 꼭 참여하고 싶어요!',
    secret: false,
    visible: true,
    mine: false,
    likeCount: 8,
    createdAt: hoursAgo(1),
  },
  {
    commentId: 2,
    postId: 1,
    parentId: null,
    author: ME,
    content: '다음 공구 때 디카페인 옵션 추가 예정이에요. 알림 신청해두시면 열릴 때 바로 알려드릴게요 🙌',
    secret: false,
    visible: true,
    mine: true,
    likeCount: 12,
    createdAt: hoursAgo(0.7),
  },
  {
    commentId: 3,
    postId: 1,
    parentId: null,
    author: U3,
    content: '지난 공구 때 향 정말 좋았어요. 이번엔 에스프레소용으로 참여합니다 :)',
    secret: false,
    visible: true,
    mine: false,
    likeCount: 5,
    createdAt: hoursAgo(0.5),
  },
  {
    commentId: 4,
    postId: 1,
    parentId: null,
    author: U4,
    content: '분쇄도 선택은 결제 후에 어디서 하나요?',
    secret: false,
    visible: true,
    mine: false,
    likeCount: 2,
    createdAt: hoursAgo(0.2),
  },
]

let nextPostId = 100
let nextCommentId = 100

const delay = (ms = 180) => new Promise((r) => setTimeout(r, ms))

function toFeed(post) {
  const { content, ...rest } = post
  return { ...rest, thumbnailUrl: post.imageUrls?.[0] ?? null }
}

function paginate(list, page = 0, size = 15) {
  const start = page * size
  const content = list.slice(start, start + size)
  const totalPages = Math.max(1, Math.ceil(list.length / size))
  const hasNext = start + size < list.length
  return {
    content,
    page,
    size,
    totalElements: list.length,
    totalPages,
    first: page === 0,
    last: !hasNext,
    hasNext,
    nextPage: hasNext ? page + 1 : null,
  }
}

function threadComments(postId) {
  const mine = comments.filter((c) => c.postId === postId)
  const roots = mine.filter((c) => c.parentId == null)
  return roots.map((c) => ({
    ...c,
    replies: mine.filter((r) => r.parentId === c.commentId),
  }))
}

function findPost(id) {
  const post = posts.find((p) => p.postId === Number(id))
  if (!post) {
    const err = new Error('존재하지 않는 게시글입니다.')
    err.status = 404
    throw err
  }
  return post
}

/** path/method 를 실제 백엔드 라우팅과 같은 순서로 매칭한다. */
export async function mockRequest(path, { method = 'GET', params, body } = {}) {
  await delay()
  const [pathname] = path.split('?')
  const seg = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean)
  const p = (i) => seg[i]

  // ── auth ─────────────────────────────────────
  if (p(0) === 'auth') {
    // 실제 서버처럼 refreshToken 은 바디에 담지 않는다 (httpOnly 쿠키 담당).
    const token = { accessToken: 'mock-access-token', tokenType: 'Bearer', accessTokenExpiresIn: 3600, user: ME }
    if (p(1) === 'login') return token
    if (p(1) === 'signup') return ME
    // 목업에는 쿠키가 없으므로 "되살릴 세션이 없음"으로 답한다. (비로그인 상태로 시작)
    if (p(1) === 'reissue') return null
    return null
  }

  // ── categories ───────────────────────────────
  if (p(0) === 'categories') return CATEGORIES

  // ── uploads ──────────────────────────────────
  if (p(0) === 'uploads') {
    // 로컬 개발(provider=local)과 똑같이 사전 서명 URL 은 지원하지 않는다.
    // 프론트가 multipart 로 폴백하는 경로를 목업에서도 그대로 타보게 하려는 것이다.
    if (p(1) === 'presign') {
      const err = new Error('로컬 개발 환경에서는 사전 서명 URL을 지원하지 않습니다.')
      err.code = 'PRESIGN_NOT_SUPPORTED'
      err.status = 400
      throw err
    }
    // 실제 서버는 저장된 파일 URL 을 돌려주지만, 목업에서는 브라우저 blob URL 로 대신한다.
    const files = body?.getAll?.('files') ?? []
    const one = body?.get?.('file')
    if (p(2) === 'bulk') return files.map((f) => URL.createObjectURL(f))
    return one ? URL.createObjectURL(one) : ''
  }

  // ── users ────────────────────────────────────
  if (p(0) === 'users') {
    if (p(1) === 'check-email') {
      return { value: params?.email ?? '', available: params?.email !== 'taken@example.com' }
    }
    if (p(1) === 'check-nickname') {
      return { value: params?.nickname ?? '', available: params?.nickname !== '로스터리 민' }
    }
    if (p(1) === 'me' && p(2) === 'posts') return paginate(posts.filter((x) => x.author.userId === ME.userId).map(toFeed))
    if (p(1) === 'me' && p(2) === 'saves') return paginate(posts.filter((x) => x.saved).map(toFeed))
    if (p(1) === 'me' && p(2) === 'alerts') {
      return paginate(
        posts
          .filter((x) => x.alerted)
          .map((x, i) => ({
            alertId: i + 1,
            postId: x.postId,
            title: x.title,
            thumbnailUrl: x.imageUrls?.[0] ?? null,
            productName: x.productName,
            startDate: x.startDate,
            endDate: x.endDate,
            progress: x.progress,
            buyUrl: x.buyUrl,
            alertedAt: hoursAgo(2),
          })),
      )
    }
    if (p(1) === 'me') {
      return {
        userId: ME.userId,
        email: 'me@example.com',
        nickname: ME.nickname,
        profileImageUrl: null,
        followerCount: 128,
        followingCount: 34,
        postCount: posts.filter((x) => x.author.userId === ME.userId).length,
        joinedAt: hoursAgo(24 * 200),
        following: false,
        me: true,
      }
    }
    if (p(2) === 'posts') {
      return paginate(posts.filter((x) => x.author.userId === Number(p(1))).map(toFeed))
    }
    return null
  }

  // ── comments (단건 삭제) ─────────────────────
  if (p(0) === 'comments' && method === 'DELETE') {
    comments = comments.filter((c) => c.commentId !== Number(p(1)))
    return null
  }

  // ── posts ────────────────────────────────────
  if (p(0) === 'posts') {
    if (seg.length === 1 && method === 'GET') {
      let list = posts
      if (params?.categoryId) {
        list = list.filter((x) => x.categories.some((c) => c.categoryId === Number(params.categoryId)))
      }
      if (params?.postType) list = list.filter((x) => x.postType === params.postType)
      if (params?.status && params.status !== 'ALL') list = list.filter((x) => x.progress === params.status)
      if (params?.keyword) {
        const kw = params.keyword.toLowerCase()
        list = list.filter(
          (x) => x.title.toLowerCase().includes(kw) || (x.productName ?? '').toLowerCase().includes(kw),
        )
      }
      return paginate(list.map(toFeed), Number(params?.page ?? 0), Number(params?.size ?? 15))
    }

    if (seg.length === 1 && method === 'POST') {
      const created = {
        ...body,
        postId: nextPostId++,
        author: ME,
        imageUrls: body.imageUrls ?? [],
        progress: body.postType === 'SELLER' ? 'ONGOING' : 'NONE',
        categories: CATEGORIES.filter((c) => (body.categoryIds ?? []).includes(c.categoryId)),
        likeCount: 0,
        commentCount: 0,
        liked: false,
        saved: false,
        alerted: false,
        followingAuthor: false,
        mine: true,
        participantCount: 0,
        createdAt: iso(new Date()),
      }
      posts = [created, ...posts]
      return created
    }

    const post = findPost(p(1))

    if (seg.length === 2 && method === 'GET') return post
    if (seg.length === 2 && method === 'PUT') {
      Object.assign(post, body, {
        categories: CATEGORIES.filter((c) => (body.categoryIds ?? []).includes(c.categoryId)),
      })
      return post
    }
    if (seg.length === 2 && method === 'DELETE') {
      posts = posts.filter((x) => x.postId !== post.postId)
      return null
    }

    if (p(2) === 'comments') {
      if (method === 'GET') return threadComments(post.postId)
      const created = {
        commentId: nextCommentId++,
        postId: post.postId,
        parentId: body.parentId ?? null,
        author: ME,
        content: body.content,
        secret: !!body.secret,
        visible: true,
        mine: true,
        likeCount: 0,
        createdAt: iso(new Date()),
        replies: [],
      }
      comments = [...comments, created]
      post.commentCount += 1
      return created
    }

    if (p(2) === 'like') {
      post.liked = method === 'POST'
      post.likeCount += method === 'POST' ? 1 : -1
      return { postId: post.postId, liked: post.liked, likeCount: post.likeCount }
    }
    if (p(2) === 'save') {
      post.saved = method === 'POST'
      return { postId: post.postId, saved: post.saved }
    }
    if (p(2) === 'alert') {
      post.alerted = method === 'POST'
      return { postId: post.postId, alerted: post.alerted }
    }
  }

  return null
}
