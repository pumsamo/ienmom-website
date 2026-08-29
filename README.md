# 아이엔맘

무색소 수제 마카롱과 수제 휘낭시에를 소개하는 반응형 정적 브랜드 홈페이지입니다.

## 실행

빌드 과정이 없습니다. `index.html`을 브라우저에서 열거나 간단한 정적 파일 서버로 실행하면 됩니다.

## 파일 구성

- `index.html` — 사이트 콘텐츠와 구조
- `about.html` — 인터뷰를 바탕으로 쓴 1인칭 브랜드 소개
- `products.html` — `products.json`을 읽어 전체 제품을 표시하는 제품 페이지
- `products.json` — 제품명, 가격, 이미지 주소, 스마트스토어 구매 링크
- `products.js` — 홈 대표 제품과 전체 제품 목록 렌더링
- `story/posts.json` — 블로그 글 데이터
- `story/index.html` — 이야기 목록
- `story/post.html` — 이야기 상세
- `story/admin.html` — 원본 블로그 관리 도구
- `home-stories.js` — 홈에 최신 이야기 최대 3개 표시
- `styles.css` — 반응형 디자인
- `script.js` — 모바일 메뉴와 절제된 스크롤 리빌
- `assets/ienmom-macaron-set.png` — 아이엔맘 마카롱 세트 이미지
- `assets/ienmom-financier-set.png` — 아이엔맘 휘낭시에 세트 이미지

## 내용 변경

현재 가격, 연락처, 픽업 장소는 자연스러운 임시 콘텐츠입니다. 실제 정보가 정해지면 `index.html`에서 바로 바꿀 수 있습니다.

디자인은 크림, 먹색, 테라코타의 세 가지 브랜드 색만 사용하며 `prefers-reduced-motion` 환경에서는 리빌과 히어로 줌을 모두 비활성화합니다.

## 제품 추가

새 제품은 `products.json` 배열에 제품명(`name`), 상황 문구(`tagline`), 가격(`price`), 이미지 주소(`image`), 구매 링크(`url`)를 추가하면 됩니다. 전체 제품 페이지는 모든 항목을 표시하고, 홈은 10구 선물세트를 크게 소개한 뒤 다른 제품을 최대 6개 표시합니다.
