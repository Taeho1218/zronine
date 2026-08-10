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

로그인하면 액세스/리프레시 토큰을 `localStorage` 에 보관하고, 모든 요청에 `Authorization: Bearer` 를 붙입니다.
액세스 토큰이 만료(`EXPIRED_TOKEN`)되면 `client.js` 가 리프레시로 한 번 재발급한 뒤 원 요청을 재시도하며,
동시에 여러 요청이 만료를 만나도 재발급은 한 번만 돕니다.

## 시안 대비 남은 것

백엔드에 아직 원본 데이터가 없어 화면에 그리지 못한 항목입니다. 서버가 값을 내려주기 시작하면 그대로 표시됩니다.

- **실시간 N명 참여 중 / 정가(취소선)** — `participantCount`, `listPrice` 필드가 응답에 있으면 렌더링하도록 열어두었고, 없으면 진행 상태·D-day 배지로 대체합니다.
- **댓글 좋아요 수** — 댓글 좋아요 API가 없어 `likeCount` 가 응답에 있을 때만 표시합니다.
- **댓글/좋아요/저장 알림** — 통합 알림 테이블이 없어, 알림 패널은 `GET /api/users/me/alerts`(알림 신청한 공구)만으로 구성합니다. 패널의 "댓글" 탭은 비어 있습니다.
- **아이디/비밀번호 찾기** — 해당 API가 없어 링크 자리만 잡아두었습니다.
- **임시저장** — 서버 저장소가 없어 `localStorage` 에 보관합니다.
