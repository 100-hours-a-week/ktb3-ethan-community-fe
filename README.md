# 하루조각 커뮤니티 Frontend

- 하루의 조각들을 공유하는 커뮤니티 서비스의 프론트엔드입니다.
- 바닐라 JS/HTML/CSS만으로 게시글·댓글·회원 흐름을 구성했습니다. 로컬 백엔드(`http://localhost:8080`)와 Fetch API로 통신합니다.

## Stack
- HTML/CSS: 정적 페이지, 공통/페이지별 스타일 분리(`style/`).
- Vanilla JS (ES Modules): 페이지 초기화 스크립트(`scripts/app/*`), 화면 로직(`scripts/post/*.js`, `postEdit.js`, 등).
- Fetch API: 백엔드 REST 호출, JSON/FormData 전송.
- LocalStorage: `access_token`, `user_id`, `profile_image_url`, `nickname` 등 인증/프로필 상태 보관.
- No bundler/빌드 도구: 정적 서버로 바로 제공.

## 주요 기능
- 게시글 목록: Masonry 형태의 무한 스크롤 카드 뷰, 조회수에 따라 카드 크기 가변.
- 게시글 상세: 내용/작성자/이미지 노출, 좋아요 토글, 댓글 작성/수정/삭제.
- 게시글 작성·수정: 제목 검증, 대표 이미지 업로드(`/upload/post/`에 `image` 필드로 FormData 전송) 후 `thumbnailImageUrl`로 게시글 생성/수정.
- 인증: 회원가입/로그인, 로컬스토리지 토큰 기반 로그인 체크, 로그아웃.
- 프로필/비밀번호: 닉네임·프로필 이미지 수정, 비밀번호 변경, 회원 탈퇴.
- 공통 레이아웃: 헤더/사이드바, 로그인 상태에 따른 프로필 메뉴 토글.

## 폴더 구조
- `scripts/`: API 헬퍼(`api.js`), 인증(`auth.js`), 검증(`validation.js`), 공통 레이아웃(`common.js`, `sidebar.js`), 페이지 초기화(`scripts/app/*`), 게시글·프로필 등 화면 로직.
- `page/`: 개별 페이지 HTML(메인, 로그인/회원가입, 게시글 상세·작성·수정, 프로필, 비밀번호 변경).
- `style/`, `images/`: 스타일과 정적 자산.

## 트러블슈팅
