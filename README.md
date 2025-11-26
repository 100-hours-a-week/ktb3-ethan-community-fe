# '하루조각 커뮤니티' Frontend

- 조각처럼 작은 하루의 기억들을 공유하는 커뮤니티 서비스의 프론트엔드입니다.
- 바닐라 JS/HTML/CSS 기반의 게시글/댓글/회원 관련 기능을 제공합니다.

---

## 주요 기능
- 게시글
    - Custom Masonry Layout 기반의 인피니티 스크롤 게시글 뷰어 제공
    - 조회수에 따른 게시글 크기 차별화
- 보안
    - Access Token 만료 시 자동으로 Refresh 수행
    - Refresh Token 만료 시 로그인 유도

---

## Stack


---

## 폴더 구조
- `scripts/`: API 헬퍼(`api.js`), 인증(`auth.js`), 검증(`validation.js`), 페이지별 초기화 스크립트(`scripts/app/*`), 화면 로직(`post/*.js`, `profileEdit.js`, `postEdit.js` 등).
- `page/`: 개별 페이지 HTML(로그인, 회원가입, 게시글 작성/수정/상세, 프로필, 비밀번호 변경).
- `style/`, `images/`: 공통/페이지 스타일과 정적 자산.

---

## 트러블슈팅 
