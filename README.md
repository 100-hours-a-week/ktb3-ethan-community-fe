# 하루 조각 커뮤니티 (React 마이그레이션)

레거시 바닐라 JS 기반의 하루 조각 커뮤니티 화면을 React Router + Vite 환경으로 전면 재구성했습니다. 

> API 서버(`http://localhost:8080`)가 함께 실행 중이어야 게시글/로그인/댓글 등이 정상 동작합니다.

<br>

## 주요 기능

- 게시글 피드: Masonry 레이아웃 구현 + IntersectionObserver 기반 무한 스크롤 + 최근 본 게시글 저장/삭제
- 게시글 상세: 좋아요 토글, 댓글 CRUD, 본문 이미지 등
- 게시글 작성/수정: 제목 검증, 이미지 업로드(`/upload/post`)
- 마이페이지: 닉네임 수정, 비밀번호 변경, 회원 탈퇴

<br>

## 시연 영상

### 게시글 피드

|Masonry 레이아웃 구현 + 무한 스크롤 |
|--|
|![](/sample/home/무한%20스크롤%20및%20가로%20확장.gif)|

|Masonry 3열|Masonry 4열|
|--|--|
|![](/sample/home/Masonry%20레이아웃%20구현(3줄).png)|![](/sample/home/Masonry%20레이아웃%20구현(4줄).png)|

|최근 본 게시글 추가/삭제|
|--|
|![](/sample/home/최근%20본%20게시글%20추가%20및%20삭제.gif)|

### 게시글 CRUD
|게시글 상세보기|
|--|
|![](/sample/post/게시글%20CRUD.gif)|

### 댓글 CRUD
|댓글 CRUD|
|--|
|![](/sample/comment/댓글%20CRUD.gif)|

<br>

## 폴더 구조

```
app/
  components/          # 공통 UI (Header, Sidebar, RequireAuth 등)
  features/            # 도메인별 UI + API + hooks
  providers/           # 전역 상태 공급자 (AuthProvider)
  routes/              # React Router 파일 기반 라우트
  services/            # fetch wrapper, CSRF util, authStorage
  styles/              # 바닐라 CSS 재사용 및 확장
  utils/               # 포맷/검증 헬퍼
```

- **Feature 기반 구조**: 게시글/인증/프로필처럼 실제 화면 단위로 폴더를 나눠, 컴포넌트·API·훅을 한곳에 묶었습니다. 복잡한 DDD 용어 없이 “기능별 디렉터리”라는 직관적인 규칙을 유지합니다.
- **Provider/Service 레이어**: 전역에서 공유해야 하는 로직(인증, API 설정)은 `providers/`와 `services/`로 분리해 여러 기능에서 재사용합니다.

<br>

## 전역 상태 & 인증 설계

- `AuthProvider`는 access token을 **인메모리**에 보관하고, 사용자 정보는 세션 스토리지에 저장합니다.
- Refresh Token Rotation: 새로고침으로 인메모리가 비어질 경우, readonly 쿠키에 저장된 refresh token으로 다시 access token를 재발급합니다
- CSRF Double Submit: refresh token은 CSRF 공격에 취약하므로, GET /csrf 으로 CSRF 쿠키 발급 후 본 요청(`/auth/refresh`) 시 헤더(X-XSRF-TOKEN)에 포함해 리프레쉬를 시도합니다.
- `RequireAuth` 라우트 가드는 로그인 상태를 확인한 뒤, 미인증 사용자는 로그인 페이지로 돌려보냅니다.

<br>

## 마이그레이션 체크리스트

- [x] JS 기반 React 프로젝트 구성
- [x] AuthProvider / API / CSRF 공통 레이어 구현
- [x] 게시글/댓글/작성/인증/프로필 화면 React 포팅
- [x] 추가 기능 개발(최근 본 게시글 기능 추가, 전역 CSRF 설정에서 refresh token 재발급 시에만 최소 적용)
