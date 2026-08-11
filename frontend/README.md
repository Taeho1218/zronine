# ㄱㄱ 공구 커뮤니티 · 프론트엔드

피그마 시안을 옮긴 React(Vite) 프론트엔드입니다. 같은 저장소의 Spring Boot 백엔드(`../src`)와 붙어 동작합니다.

## 실행

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

`vite.config.js` 가 `/api` 와 `/images` 를 `http://localhost:8080` 으로 프록시하므로,
백엔드를 8080 에 띄워두면 별도 설정 없이 바로 붙습니다. (CORS 설정에 의존하지 않습니다)

### 백엔드 없이 화면만 볼 때

MySQL·백엔드를 띄우지 않고 화면만 확인하려면 목업 모드를 켭니다.

```bash
cp .env.example .env
# .env 에서 VITE_USE_MOCK=true
npm run dev
```

`src/api/mock.js` 의 인메모리 데이터로 모든 요청이 처리됩니다.
응답 스키마를 실제 API(`PostFeedResponse`, `PostDetailResponse`, `CommentResponse` …)와 맞춰두었으므로
목업을 끄면 화면 코드는 그대로 두고 서버 데이터로 전환됩니다.

## 화면

| 경로 | 화면 |
| --- | --- |
| `/` | 메인 피드 (카테고리 칩 필터, 검색, 무한 스크롤 3열 카드) |
| `/posts/:postId` | 게시글 상세 + 반응·댓글 (비슷한 상품 사이드바) |
| `/write` | 공구 열기(셀러) / 글쓰기(유저) — `?type=GENERAL` 로 유저 탭 진입, `?edit=:postId` 로 수정 |
| `/login`, `/signup` | 로그인 / 회원가입 |
| `/mypage` | 마이페이지 (`?tab=posts\|saved\|alerts`) |
| `/saved` | 마이페이지 저장 탭으로 리다이렉트 |

## 구조

```
src/
  api/        서버 통신. client.js(공통 fetch·JWT·토큰 재발급) / index.js(도메인별 함수) / mock.js
  components/ 헤더, 알림 패널, 카드, 댓글 등 화면 간 공유 컴포넌트
  pages/      라우트 단위 화면
  store/      AuthContext (로그인 상태)
  lib/        날짜·가격 포맷, 알림 목록 어댑터
  styles/     디자인 토큰(tokens.css) + 전역 스타일(base.css)
```

색·간격·라운드는 `styles/tokens.css` 에만 정의하고 컴포넌트 CSS 는 `var()` 로 참조합니다.
브랜드 그린을 바꾸려면 `--brand` 계열 값만 고치면 됩니다.

## 인증

리프레시 토큰은 서버가 **httpOnly 쿠키**(`Path=/api/auth`)로만 내려주므로 프론트에서는 읽지도 저장하지도 않습니다.
프론트가 보관하는 건 액세스 토큰과 사용자 정보뿐이고, 모든 요청에 `credentials: 'include'` 를 붙여
브라우저가 쿠키를 알아서 싣도록 합니다.

- 액세스 토큰이 만료(`EXPIRED_TOKEN`)되면 `client.js` 가 `POST /api/auth/reissue` 를 호출해 재발급받고 원 요청을 재시도합니다. 동시에 여러 요청이 만료를 만나도 재발급은 한 번만 돕니다.
- 앱을 처음 띄울 때 액세스 토큰이 없으면 재발급을 한 번 시도합니다. 쿠키가 훨씬 오래 살아서(기본 14일) 브라우저를 껐다 켜도 다시 로그인하지 않고 이어서 쓸 수 있습니다.
- 로그아웃은 반드시 서버를 거쳐야 합니다. httpOnly 쿠키는 자바스크립트로 지울 수 없고, 서버가 만료된 쿠키를 내려줘야 브라우저가 폐기합니다.

## 이미지 업로드

서버에 두 경로가 있어 프론트가 자동으로 고릅니다.

1. `POST /api/uploads/presign` 으로 사전 서명 URL을 받아 저장소(R2)에 **직접 PUT** — 운영 기본 경로
2. `POST /api/uploads/images/bulk` 로 서버에 파일을 보내 서버가 대신 저장 — 로컬 개발용

로컬 개발(`app.upload.provider=local`)에서는 1번이 `PRESIGN_NOT_SUPPORTED` 로 거절되므로,
한 번 거절당하면 그 사실을 기억하고 이후로는 곧장 2번으로 갑니다.
**프론트 코드는 그대로 두고 서버의 `app.upload.provider` 만 바꾸면 됩니다.**

올리기 전에 서버 `ImageFileValidator` 와 같은 기준(JPG/PNG/GIF/WEBP, 5MB)으로 한 번 걸러 불필요한 왕복을 줄입니다.

## 시안 대비 남은 것

백엔드에 아직 원본 데이터가 없어 화면에 그리지 못한 항목입니다. 서버가 값을 내려주기 시작하면 그대로 표시됩니다.

- **실시간 N명 참여 중 / 정가(취소선)** — `participantCount`, `listPrice` 필드가 응답에 있으면 렌더링하도록 열어두었고, 없으면 진행 상태·D-day 배지로 대체합니다.
- **댓글 좋아요 수** — 댓글 좋아요 API가 없어 `likeCount` 가 응답에 있을 때만 표시합니다.
- **댓글/좋아요/저장 알림** — 통합 알림 테이블이 없어, 알림 패널은 `GET /api/users/me/alerts`(알림 신청한 공구)만으로 구성합니다. 패널의 "댓글" 탭은 비어 있습니다.
- **아이디/비밀번호 찾기** — 해당 API가 없어 링크 자리만 잡아두었습니다.
- **임시저장** — 서버 저장소가 없어 `localStorage` 에 보관합니다.
