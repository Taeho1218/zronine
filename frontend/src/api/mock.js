/**
 * 백엔드(및 MySQL)를 띄우지 않고 화면을 확인하기 위한 인메모리 목업.
 *
 * .env 의 VITE_USE_MOCK=true 일 때만 client.js 가 이쪽으로 요청을 돌린다.
 * 실제 API 와 응답 스키마(PostFeedResponse / PostDetailResponse / CommentResponse ...)를 맞춰두었으므로
 * 목업을 끄면 화면 코드는 그대로 두고 서버 데이터로 전환된다.
 */
import { sampleSet } from './sampleImages'

/**
 * 서버가 찍어 보내는 시각(작성 시각·알림 시각)의 생김새를 그대로 흉내낸다.
 *
 * 배포된 백엔드는 UTC 로 돌고 createdAt 은 타임존 없는 LocalDateTime 이라 UTC 벽시계 값이
 * "2026-08-11T04:40:13" 처럼 그대로 내려온다. 화면이 그 값을 format.serverInstant 로 읽으므로
 * 목업도 같은 모양으로 내려줘야 목업과 실서버에서 시각이 똑같이 보인다.
 *
 * 모집 기간(start/end)에는 쓰지 않는다. 그건 글쓴이가 고른 날짜를 그대로 담는 자리다.
 */
const iso = (d) => `${d.toISOString().slice(0, 19)}`

const CATEGORIES = [
  { categoryId: 1, name: '식품' },
  { categoryId: 2, name: '영양제' },
  { categoryId: 3, name: '화장품' },
  { categoryId: 4, name: '반려동물' },
  { categoryId: 5, name: '기타' },
]

/**
 * 시트의 세부 분류를 화면에서 쓰는 카테고리로 묶는다.
 * 시트는 수집한 그대로 두고(원본 훼손 없음) 여기서만 대응시키므로,
 * "고양이 간식" 같은 분류가 새로 들어와도 한 줄만 추가하면 된다.
 */
const CATEGORY_ALIAS = {
  '강아지 밥': '반려동물',
  '강아지 영양제': '반려동물',
}

const ME = { userId: 1, nickname: '로스터리 민', profileImageUrl: null }
const U2 = { userId: 2, nickname: '커피러버', profileImageUrl: null }
const U3 = { userId: 3, nickname: 'soo****', profileImageUrl: null }
const U4 = { userId: 4, nickname: '지호아빠', profileImageUrl: null }

/**
 * 공구를 여는 인스타 셀러들. 시트의 "인스타 아이디 / 인스타 프로필 URL" 두 칸이 여기에 대응한다.
 * 같은 계정이 연 공구는 모두 같은 사람이 쓴 글로 묶인다.
 *
 * instagramUrl 은 프로필 조회 응답(UserProfileResponse)에는 서버에도 있지만,
 * 게시글 작성자에 실려오는 UserSummaryResponse 에는 아직 없다.
 * 그래서 상세 화면의 작성자 옆 링크는 값이 있을 때만 그리고, 서버가 내려주기 시작하면 그대로 표시된다.
 */
const SELLERS = {
  dreamyaksa_: {
    userId: 5,
    nickname: 'dreamyaksa_',
    profileImageUrl: null,
    instagramUrl: 'https://www.instagram.com/dreamyaksa_/',
  },
  dallucas_table: {
    userId: 6,
    nickname: 'dallucas_table',
    profileImageUrl: null,
    instagramUrl: 'https://www.instagram.com/dallucas_table/',
  },
  seoel_mom: {
    userId: 7,
    nickname: 'seoel_mom',
    profileImageUrl: null,
    instagramUrl: 'https://www.instagram.com/seoel_mom',
  },
  auvert__: {
    userId: 8,
    nickname: 'auvert__',
    profileImageUrl: null,
    instagramUrl: 'https://www.instagram.com/auvert__',
  },
  // 시트에 아이디가 asotov / asotov. 로 갈려 적혀 있으나 같은 사람이 맞다(프로필 URL 도 동일).
  'asotov.kr': {
    userId: 9,
    nickname: 'asotov.kr',
    profileImageUrl: null,
    instagramUrl: 'https://www.instagram.com/asotov.kr',
  },
  niniyagg: {
    userId: 10,
    nickname: 'niniyagg',
    profileImageUrl: null,
    instagramUrl: 'https://www.instagram.com/niniyagg',
  },
  wikiyaksa: {
    userId: 11,
    nickname: 'wikiyaksa',
    profileImageUrl: null,
    instagramUrl: 'https://www.instagram.com/wikiyaksa',
  },
  byak_yaksa: {
    userId: 12,
    nickname: 'byak_yaksa',
    profileImageUrl: null,
    instagramUrl: 'https://www.instagram.com/byak_yaksa',
  },
  lee_pharmacy_: {
    userId: 13,
    nickname: 'lee_pharmacy_',
    profileImageUrl: null,
    instagramUrl: 'https://www.instagram.com/lee_pharmacy_',
  },
  atoi_jihyo: {
    userId: 14,
    nickname: 'atoi_jihyo',
    profileImageUrl: null,
    instagramUrl: 'https://www.instagram.com/atoi_jihyo',
  },
  lovelip_jin: {
    userId: 15,
    nickname: 'lovelip_jin',
    profileImageUrl: null,
    instagramUrl: 'https://www.instagram.com/lovelip_jin',
  },
  lupinus_may21: {
    userId: 16,
    nickname: 'lupinus_may21',
    profileImageUrl: null,
    instagramUrl: 'https://www.instagram.com/lupinus_may21',
  },
  choiquee: {
    userId: 17,
    nickname: 'choiquee',
    profileImageUrl: null,
    instagramUrl: 'https://www.instagram.com/choiquee',
  },
}

/**
 * 수집 시트를 그대로 옮긴 표. 순서가 곧 게시글 번호(postId)이고, 이미지 파일명도 여기에 맞춘다.
 * (n 번째 줄 → /posts/n, src/assets/samples/post-n.png)
 *
 * 새 공구를 추가하려면 아래에 한 줄만 더 쓰면 된다.
 * end 를 비워두면 "마감일 미정"으로 표시된다.
 *
 * 이미지 파일 이름은 공구 코드(gb-002.png) 또는 글 번호(post-2.png) 아무거나 쓰면 되고,
 * 둘 다 아닌 이름을 쓰고 싶으면 그 줄에 image: '내가지은이름' 만 덧붙이면 된다.
 */
const SHEET = [
  { code: 'GB-001', category: '화장품', product: '바이오던스 클렌징&겔패드', link: 'https://biodance.co.kr/product/detail.html?product_no=573', start: '2026-08-10T10:00:00', end: '2026-08-13T23:59:00', seller: 'dreamyaksa_' },
  { code: 'GB-002', category: '영양제', product: '롱비다 커큐민 복합체', link: 'https://m.smartstore.naver.com/nutritionstandard/products/12243129268', start: '2026-08-13T10:00:00', end: '2026-08-19T23:59:00', seller: 'dreamyaksa_' },
  { code: 'GB-003', category: '영양제', product: '씹어먹는 츄어블 오메가3', link: 'https://smartstore.naver.com/nutritionstandard/products/11818252006', start: '2026-08-17T10:00:00', end: '2026-08-23T23:59:00', seller: 'dreamyaksa_' },
  { code: 'GB-004', category: '영양제', product: '이노시톨 40:1 배합', start: '2026-08-20T10:00:00', seller: 'dreamyaksa_' },
  { code: 'GB-005', category: '영양제', product: '리포좀 비타민C', start: '2026-08-24T10:00:00', seller: 'dreamyaksa_' },
  { code: 'GB-006', category: '영양제', product: '베르베린', start: '2026-08-27T10:00:00', seller: 'dreamyaksa_' },
  { code: 'GB-007', category: '영양제', product: '액상 마그네슘', start: '2026-08-31T10:00:00', seller: 'dreamyaksa_' },
  { code: 'GB-008', category: '영양제', product: '고함량 비타민B+활성형 엽산', start: '2026-09-03T10:00:00', seller: 'dreamyaksa_' },
  { code: 'GB-009', category: '강아지 밥', product: '달루카팩 팡드미 밥꾸드릿 올인원 세트', link: 'https://smartstore.naver.com/paindemie/products/13703232446', start: '2026-08-11T10:00:00', end: '2026-08-15T23:59:00', seller: 'dallucas_table' },
  { code: 'GB-010', category: '강아지 영양제', product: '룰루파마 오메가3+룰루키치 화식', start: '2026-08-18T10:00:00', end: '2026-08-21T23:59:00', seller: 'dallucas_table' },
  { code: 'GB-011', category: '강아지 밥', product: '달루카특가! 팡드미 밥꾸트릿 단품', link: 'https://smartstore.naver.com/paindemie/products/13703237603', start: '2026-08-11T10:00:00', end: '2026-08-15T23:59:00', seller: 'dallucas_table' },
  { code: 'GB-012', category: '식품', product: '베노프 단백질 쉐이크', start: '2026-08-20T10:00:00', seller: 'seoel_mom' },
  { code: 'GB-013', category: '식품', product: '잼팟', start: '2026-08-21T10:00:00', end: '2026-08-28T23:59:00', seller: 'auvert__' },
  { code: 'GB-014', category: '식품', product: '코켄 그래놀라', link: 'https://smartstore.naver.com/kokenofficial/products/13709845280', start: '2026-08-11T10:00:00', end: '2026-08-13T23:59:00', seller: 'asotov.kr' },
  { code: 'GB-015', category: '식품', product: '소소래 바게트&치아바타', start: '2026-08-12T10:00:00', seller: 'asotov.kr' },
  { code: 'GB-016', category: '식품', product: '글로썸', start: '2026-08-18T10:00:00', end: '2026-08-20T23:59:00', seller: 'asotov.kr' },
  { code: 'GB-017', category: '식품', product: '임실 수제 스트링치즈', link: 'https://www.idus.com/v2/product/8a35b6b3-2eb9-44a9-aeeb-d0f7d5da4dd5', start: '2026-08-06T10:00:00', end: '2026-08-12T23:59:00', seller: 'niniyagg' },
  { code: 'GB-018', category: '식품', product: '수입치즈', link: 'https://smartstore.naver.com/neworldakfood/products/10898686887', start: '2026-08-10T10:00:00', end: '2026-08-12T23:59:00', seller: 'auvert__' },
  { code: 'GB-019', category: '영양제', product: '트루엔 오엠비', link: 'https://brand.naver.com/truen/products/10248346357', start: '2026-08-10T10:00:00', seller: 'wikiyaksa' },
  { code: 'GB-020', category: '영양제', product: '닥터체크 이노시톨', start: '2026-08-12T10:00:00', end: '2026-08-14T23:59:00', seller: 'byak_yaksa' },
  { code: 'GB-021', category: '영양제', product: '나프라우드 칼마디', start: '2026-08-18T10:00:00', end: '2026-08-24T23:59:00', seller: 'byak_yaksa' },
  { code: 'GB-022', category: '영양제', product: '닥터체크 눈 영양제', start: '2026-08-20T10:00:00', end: '2026-08-26T23:59:00', seller: 'byak_yaksa' },
  { code: 'GB-023', category: '영양제', product: '테라큐민 프라임&부스터', start: '2026-08-25T10:00:00', end: '2026-08-31T23:59:00', seller: 'byak_yaksa' },
  // 시트에는 종료가 2026-08-02 로 적혀 있었으나 시작(08-27)보다 앞서는 오타여서 09-02 로 바로잡았다.
  { code: 'GB-024', category: '영양제', product: '트루엔 오메가3 이지', start: '2026-08-27T10:00:00', end: '2026-09-02T23:59:00', seller: 'byak_yaksa' },
  { code: 'GB-025', category: '영양제', product: '엘레나 질유산균', link: 'https://smartstore.naver.com/starpharm/products/12632950047', start: '2026-08-07T10:00:00', end: '2026-08-13T23:59:00', seller: 'byak_yaksa' },
  { code: 'GB-026', category: '영양제', product: '탑헬스 크랜베리', link: 'https://smartstore.naver.com/tophealth2/products/12148174718', start: '2026-08-11T10:00:00', end: '2026-08-17T23:59:00', seller: 'byak_yaksa' },
  { code: 'GB-027', category: '식품', product: '프랑스 페이장 버터', start: '2026-08-13T10:00:00', seller: 'lee_pharmacy_' },
  { code: 'GB-028', category: '식품', product: '그리스 크리티다 유기농 올리브 오일', start: '2026-08-27T10:00:00', seller: 'lee_pharmacy_' },
  { code: 'GB-029', category: '영양제', product: '고품질 오메가3', start: '2026-08-24T10:00:00', seller: 'lee_pharmacy_' },
  { code: 'GB-030', category: '영양제', product: '항산화 글루타치온', link: 'https://selectionkorea.com/product/detail.html?product_no=1279', start: '2026-08-10T10:00:00', end: '2026-08-16T23:59:00', seller: 'lee_pharmacy_' },
  { code: 'GB-031', category: '식품', product: '이야이야앤프렌즈 오일/피타브레드', start: '2026-08-20T10:00:00', end: '2026-08-22T23:59:00', seller: 'atoi_jihyo' },
  { code: 'GB-032', category: '식품', product: '비에날씬', start: '2026-08-24T10:00:00', end: '2026-08-26T23:59:00', seller: 'atoi_jihyo' },
  { code: 'GB-033', category: '식품', product: '자떙 닭발', start: '2026-08-27T10:00:00', end: '2026-08-30T23:59:00', seller: 'atoi_jihyo' },
  { code: 'GB-034', category: '화장품', product: '셀제르 모공쿠션(비비쿠션)', link: 'https://lovelipjin.shop.blogpay.co.kr/good/product_view?goodNum=205708834', start: '2026-08-10T10:00:00', end: '2026-08-13T23:59:00', seller: 'lovelip_jin' },
  { code: 'GB-035', category: '화장품', product: '콜라겐히알볼 눈눈', start: '2026-08-13T10:00:00', end: '2026-08-16T23:59:00', seller: 'lovelip_jin' },
  { code: 'GB-036', category: '화장품', product: '러뷰 민낯앰플', start: '2026-08-17T10:00:00', end: '2026-08-20T23:59:00', seller: 'lovelip_jin' },
  { code: 'GB-037', category: '화장품', product: '민낯 딥톡스팩', start: '2026-08-20T10:00:00', end: '2026-08-23T23:59:00', seller: 'lovelip_jin' },
  { code: 'GB-038', category: '화장품', product: '톤업선크림', start: '2026-08-31T10:00:00', end: '2026-09-03T23:59:00', seller: 'lovelip_jin' },
  { code: 'GB-039', category: '화장품', product: '리메스카 흉터스틱&아이백크림', link: 'https://lupi.co.kr/product/%EB%A6%AC%EB%A9%94%EC%8A%A4%EC%B9%B4-%ED%9D%89%ED%84%B0%EC%8A%A4%ED%8B%B1-%EC%95%84%EC%9D%B4%EB%B0%B1%ED%81%AC%EB%A6%BC/272/category/1/display/2/?icid=ETC.product_listmain_1', start: '2026-08-10T10:00:00', seller: 'lupinus_may21' },
  { code: 'GB-040', category: '화장품', product: '가쉬 에어버블 CDS 마스크 5종', link: 'https://lupi.co.kr/product/%EA%B0%80%EC%89%AC-%EC%97%90%EC%96%B4%EB%B2%84%EB%B8%94-cds-%EB%A7%88%EC%8A%A4%ED%81%AC/299/category/1/display/2/', start: '2026-08-12T10:00:00', seller: 'lupinus_may21' },
  { code: 'GB-041', category: '기타', product: '키머즈 쉘위고 풀가드링 캐리어', link: 'https://lupi.co.kr/product/%ED%82%A4%EB%A8%B8%EC%A6%88-%EC%89%98%EC%9C%84%EA%B3%A0-%ED%92%80%EA%B0%80%EB%93%9C%EB%A7%81-%EC%BA%90%EB%A6%AC%EC%96%B4/334/category/1/display/2/', start: '2026-08-13T10:00:00', seller: 'lupinus_may21' },
  { code: 'GB-042', category: '기타', product: '락앤락 데켓 쿡플레이트', start: '2026-08-20T10:00:00', seller: 'lupinus_may21' },
  { code: 'GB-043', category: '영양제', product: '엘레나 캡슐', start: '2026-08-26T10:00:00', seller: 'lupinus_may21' },
  { code: 'GB-044', category: '화장품', product: '젬소 속눈썹 영양제', start: '2026-08-24T10:00:00', seller: 'lupinus_may21' },
  { code: 'GB-045', category: '화장품', product: '케이스키니 바디앰플', start: '2026-08-22T10:00:00', seller: 'lupinus_may21' },
  { code: 'GB-046', category: '화장품', product: '포리추얼 율무팩', start: '2026-08-21T10:00:00', seller: 'lupinus_may21' },
  { code: 'GB-047', category: '기타', product: '블루벤트 음식물처리기', start: '2026-08-21T10:00:00', seller: 'lupinus_may21' },
  { code: 'GB-048', category: '식품', product: '바인허브 여리차', start: '2026-08-10T10:00:00', end: '2026-08-13T23:59:00', seller: 'choiquee' },
  { code: 'GB-049', category: '기타', product: '화이트랩스', start: '2026-08-23T10:00:00', end: '2026-08-27T23:59:00', seller: 'choiquee' },
  { code: 'GB-050', category: '기타', product: '근막테라피 너클랙스', start: '2026-08-31T10:00:00', end: '2026-09-02T23:59:00', seller: 'choiquee' },
]

const hoursAgo = (n) => {
  const d = new Date()
  d.setHours(d.getHours() - n)
  return iso(d)
}

/**
 * 서버 PostProgress.of 와 같은 규칙. 기간이 비어 있으면 진행 상태를 판단할 수 없어 NONE 이다.
 * 목록/상세가 매번 같은 기준으로 상태를 그리도록 여기서 한 번만 계산한다.
 */
function progressOf(start, end) {
  if (!start || !end) return 'NONE'
  const now = Date.now()
  if (now < new Date(start).getTime()) return 'UPCOMING'
  if (now > new Date(end).getTime()) return 'ENDED'
  return 'ONGOING'
}

const categoryByName = (name) => CATEGORIES.find((c) => c.name === (CATEGORY_ALIAS[name] ?? name))

/** 알림 패널 / 저장 목록 화면을 비어 보이지 않게 하려고 몇 건만 미리 눌러둔 상태로 둔다. */
const PRESET_SAVED = new Set([1])
const PRESET_ALERTED = new Set([1, 9])

let posts = SHEET.map((row, index) => {
  const postId = index + 1
  return {
    postId,
    postType: 'SELLER',
    author: SELLERS[row.seller],
    title: `${row.product} 공동구매`,
    // 시트의 "상품 설명" 칸이 아직 전부 이 문구다. 채워지면 그대로 상세 설명에 들어간다.
    content: '상품 링크 확인 요망',
    // 파일 이름을 공구 코드(gb-002.png)로 하든 글 번호(post-2.png)로 하든 알아서 붙는다.
    // row.image 를 적어두면 그 이름이 가장 먼저다. 파일이 없으면 화면이 마스코트로 채운다.
    imageUrls: sampleSet(row.image, row.code.toLowerCase(), `post-${postId}`),
    productName: row.product,
    price: null,
    buyUrl: row.link ?? null,
    startDate: row.start,
    endDate: row.end ?? null,
    eventNote: null,
    progress: progressOf(row.start, row.end),
    categories: [categoryByName(row.category)].filter(Boolean),
    likeCount: 0,
    commentCount: 0,
    liked: false,
    saved: PRESET_SAVED.has(postId),
    alerted: PRESET_ALERTED.has(postId),
    followingAuthor: false,
    mine: false,
    // 시트에 등록 시각이 없어 모집 시작일을 작성 시각으로 쓴다. (서버와 같은 UTC 모양으로 맞춰서)
    createdAt: iso(new Date(row.start)),
  }
})

let comments = [
  {
    commentId: 1,
    postId: 1,
    parentId: null,
    author: U2,
    content: '겔패드는 몇 매입인가요? 링크 들어가보니 옵션이 여러 개라서요!',
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
    author: SELLERS.dreamyaksa_,
    content: '2박스(각 60매) 기준으로 진행돼요. 옵션은 참여 폼에서 선택하실 수 있어요 🙌',
    secret: false,
    visible: true,
    mine: false,
    likeCount: 12,
    createdAt: hoursAgo(0.7),
  },
  {
    commentId: 3,
    postId: 1,
    parentId: null,
    author: U3,
    content: '저번에 써봤는데 아침에 붓기 빠지는 느낌이 좋았어요. 이번에도 참여합니다 :)',
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
    content: '배송은 마감 후 언제쯤 시작되나요?',
    secret: false,
    visible: true,
    mine: false,
    likeCount: 2,
    createdAt: hoursAgo(0.2),
  },
]

let nextPostId = 100
let nextCommentId = 100

/** 내가 팔로우 중인 사람들. 실제로는 서버가 들고 있는 상태다. */
const following = new Set()

/** 프로필 화면에 필요한 사람 정보. 글 작성자들에서 모아 만든다. */
const ALL_USERS = [ME, U2, U3, U4, ...Object.values(SELLERS)]

/**
 * 목업용 팔로우 관계.
 *
 * 서버에는 실제 관계 데이터가 있지만 목업에는 없어서, 사용자 id 로 계산되는 규칙을 하나 정해 쓴다.
 * 규칙 자체에 의미는 없고, 새로고침해도 목록과 숫자가 흔들리지 않는 것이 목적이다.
 * 숫자(팔로워 수)를 따로 들고 있으면 목록과 어긋나기 쉬워 항상 목록 길이에서 뽑는다.
 */
function baseFollowersOf(userId) {
  const id = Number(userId)
  return ALL_USERS.filter((u) => u.userId !== id && (u.userId * 7 + id) % 3 === 0)
}

function followersOf(userId) {
  const id = Number(userId)
  const others = baseFollowersOf(id).filter((u) => u.userId !== ME.userId)
  // 내가 팔로우 중이면 나도 그 사람의 팔로워다.
  return following.has(id) ? [ME, ...others] : others
}

function followingsOf(userId) {
  const id = Number(userId)
  // 내 팔로잉 목록에는 이번 세션에 누른 팔로우가 그대로 반영돼야 한다.
  if (id === ME.userId) return ALL_USERS.filter((u) => following.has(u.userId))
  return ALL_USERS.filter((u) => baseFollowersOf(u.userId).some((f) => f.userId === id))
}

/** 팔로워/팔로잉 목록 한 줄 (FollowUserResponse) */
const toFollowUser = (user) => ({
  userId: user.userId,
  nickname: user.nickname,
  profileImageUrl: user.profileImageUrl,
  // 목록을 보고 있는 사람(=나)이 이 사람을 팔로우 중인지
  following: following.has(user.userId),
})

function profileOf(userId, viewerIsMe) {
  const user = ALL_USERS.find((u) => u.userId === Number(userId))
  if (!user) {
    const err = new Error('존재하지 않는 회원입니다.')
    err.status = 404
    throw err
  }
  const me = viewerIsMe && user.userId === ME.userId
  return {
    userId: user.userId,
    email: me ? 'me@example.com' : null,
    nickname: user.nickname,
    profileImageUrl: user.profileImageUrl,
    instagramUrl: user.instagramUrl ?? null,
    coverImageUrl: user.coverImageUrl ?? null,
    followerCount: followersOf(user.userId).length,
    followingCount: followingsOf(user.userId).length,
    postCount: posts.filter((p) => p.author.userId === user.userId).length,
    joinedAt: hoursAgo(24 * 200),
    following: following.has(user.userId),
    me,
  }
}

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

/**
 * 서버 PostService.getSimilarPosts 와 같은 규칙.
 * 1순위: 물건 이름이 같은 다른 셀러글 / 2순위: 카테고리가 하나라도 겹치는 셀러글.
 * 일반글에는 빈 배열을 준다.
 */
const SIMILAR_LIMIT = 3

/** 서버 PostService.POPULAR_LIMIT / MAIN_FEED_PAGE_SIZE 와 같은 값 */
const POPULAR_LIMIT = 9
const MAIN_FEED_PAGE_SIZE = 12

function similarPosts(post) {
  if (post.postType !== 'SELLER') return []

  const others = posts.filter((p) => p.postType === 'SELLER' && p.postId !== post.postId)

  const sameProduct = others.filter((p) => p.productName && p.productName === post.productName)
  if (sameProduct.length > 0) return sameProduct.slice(0, SIMILAR_LIMIT).map(toFeed)

  const categoryIds = (post.categories ?? []).map((c) => c.categoryId)
  if (categoryIds.length === 0) return []

  return others
    .filter((p) => (p.categories ?? []).some((c) => categoryIds.includes(c.categoryId)))
    .slice(0, SIMILAR_LIMIT)
    .map(toFeed)
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

/** 목업 업로드 결과. 새로고침해도 살아있도록 blob 대신 data URL 로 돌려준다. */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('파일을 읽지 못했어요.'))
    reader.readAsDataURL(file)
  })
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
    /*
     * 실제 서버는 저장된 파일 URL 을 돌려준다. 목업에서는 data URL 로 대신하는데,
     * blob URL 은 새로고침하면 죽어서 "올렸는데 다음에 오면 사라진다"로 보이기 때문이다.
     */
    const files = body?.getAll?.('files') ?? []
    const one = body?.get?.('file')
    if (p(2) === 'bulk') return Promise.all(files.map(fileToDataUrl))
    return one ? fileToDataUrl(one) : ''
  }

  // ── users ────────────────────────────────────
  if (p(0) === 'users') {
    if (p(1) === 'check-email') {
      return { value: params?.email ?? '', available: params?.email !== 'taken@example.com' }
    }
    if (p(1) === 'check-nickname') {
      // 실제 서버처럼 이미 있는 사람 이름과 대조한다.
      const value = params?.nickname ?? ''
      return { value, available: !ALL_USERS.some((u) => u.nickname === value) }
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
    if (p(1) === 'me' && method === 'PATCH') {
      // 서버와 같은 규칙: null 이면 그대로 두고, 빈 문자열이면 지운다.
      if (body?.nickname != null) ME.nickname = body.nickname
      if (body?.profileImageUrl != null) ME.profileImageUrl = body.profileImageUrl || null
      if (body?.instagramUrl != null) ME.instagramUrl = body.instagramUrl || null
      // 서버에는 아직 없는 값이지만, 있을 때 어떻게 도는지 목업에서 미리 확인할 수 있게 받아둔다.
      if (body?.coverImageUrl != null) ME.coverImageUrl = body.coverImageUrl || null
      return profileOf(ME.userId, true)
    }

    if (p(1) === 'me' && method === 'DELETE') {
      const now = new Date()
      const purge = new Date(now)
      purge.setDate(purge.getDate() + 30)
      return { deletedAt: iso(now), purgeScheduledAt: iso(purge), retentionDays: 30 }
    }

    if (p(1) === 'me') return profileOf(ME.userId, true)

    if (p(2) === 'posts') {
      return paginate(posts.filter((x) => x.author.userId === Number(p(1))).map(toFeed))
    }

    // 팔로우 / 언팔로우
    // 팔로워 / 팔로잉 목록
    if (p(2) === 'followers') return paginate(followersOf(p(1)).map(toFollowUser), Number(params?.page ?? 0), 20)
    if (p(2) === 'followings') return paginate(followingsOf(p(1)).map(toFollowUser), Number(params?.page ?? 0), 20)

    if (p(2) === 'follow') {
      const targetId = Number(p(1))
      const isFollow = method === 'POST'
      if (isFollow) following.add(targetId)
      else following.delete(targetId)

      // 목록/상세의 followingAuthor 도 같이 맞춰준다.
      posts.forEach((post) => {
        if (post.author.userId === targetId) post.followingAuthor = isFollow
      })
      // 숫자는 따로 세지 않고 목록에서 뽑아, 목록과 카운트가 어긋나지 않게 한다.
      return { targetUserId: targetId, following: isFollow, followerCount: followersOf(targetId).length }
    }

    // 다른 사람 프로필
    if (seg.length === 2) return profileOf(p(1), true)

    return null
  }

  // ── comments (단건 삭제) ─────────────────────
  if (p(0) === 'comments' && method === 'DELETE') {
    comments = comments.filter((c) => c.commentId !== Number(p(1)))
    return null
  }

  // ── posts ────────────────────────────────────
  if (p(0) === 'posts') {
    /*
     * 홈 배너용 인기 피드. 서버 PostService.getPopularPosts 와 같은 규칙으로,
     * 마감이 지난 셀러글은 빼고 좋아요 → 댓글 → 최신 순으로 POPULAR_LIMIT 개만 돌려준다.
     * 페이지가 아니라 배열이라는 점도 서버와 같다.
     */
    if (p(1) === 'popular' && method === 'GET') {
      return posts
        .filter((x) => x.progress !== 'ENDED')
        .slice()
        .sort(
          (a, b) =>
            b.likeCount - a.likeCount ||
            b.commentCount - a.commentCount ||
            new Date(b.createdAt) - new Date(a.createdAt),
        )
        .slice(0, POPULAR_LIMIT)
        .map(toFeed)
    }

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
      return paginate(list.map(toFeed), Number(params?.page ?? 0), Number(params?.size ?? MAIN_FEED_PAGE_SIZE))
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

    if (p(2) === 'similar') return similarPosts(post)

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
