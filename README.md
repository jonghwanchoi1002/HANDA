# HANDA

Next.js(App Router)와 TypeScript로 만든 HANDA 홈페이지입니다.
DB나 API 키 없이 실행할 수 있습니다. Neon 연결은 추후 추가합니다.

## 처음 실행하기

Node.js 20.9 이상(LTS 권장)이 필요합니다. 터미널에서 다음을 실행하세요.

```bash
cd /workspace/HANDA
npm ci
npm run dev -- --hostname 0.0.0.0
```

개인 컴퓨터에서는 프로젝트 폴더로 이동한 뒤 같은 명령을 실행하고 브라우저에서 `http://localhost:3000`을 엽니다.
개발 서버는 파일을 저장하면 화면을 자동으로 갱신합니다. 종료하려면 터미널에서 Ctrl+C를 누르세요.
클라우드에서는 제공되는 포트 연결 기능이 있을 때 3000번 포트로 접속합니다.

## 어떤 파일을 수정하나요?

- `src/app/page.tsx`: 홈페이지 문구와 화면 구조입니다.
- `src/app/page.module.css`: 홈페이지의 색상, 간격, 반응형 배치입니다.
- `src/app/globals.css`: 사이트 전체에 적용하는 기본 스타일입니다.
- `src/app/layout.tsx`: 공통 레이아웃, 한국어 설정, 브라우저 탭 제목입니다.
- `package.json`: 라이브러리와 실행 명령 목록입니다.
- `package-lock.json`: 같은 버전의 라이브러리를 재설치하도록 고정합니다.
- `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`: TypeScript, Next.js, 코드 검사 설정입니다.

## 검사와 배포용 실행

```bash
npm run lint
npx tsc --noEmit
npm run build
npm start -- --hostname 0.0.0.0
```

`npm start`는 먼저 `npm run build`가 성공해야 합니다. 개발할 때는 `npm run dev`를 사용하세요.
현재 첫 화면과 소개 영역만 구현되어 있으며 로그인이나 데이터 저장 기능은 없습니다.
Neon 연결 시 서버에서만 DB에 접근하고, 연결 문자열은 `.env.local`에 보관하세요. 비밀 값은 Git에 올리지 않습니다.

## 비즈니스 위키

- `/wiki`: 예시 글 목록, 제목·요약·카테고리 검색, 카테고리 필터
- `/wiki/first-business-checklist` 등: 글 상세 화면과 목차
- `src/data/wiki.ts`: 예시 글 데이터입니다. 글을 추가하려면 고유한 `slug`, 카테고리, 제목, 요약, 본문 섹션을 추가합니다.
- `src/app/wiki/article-list.tsx`: 검색과 필터를 처리하는 클라이언트 컴포넌트입니다.
- `src/app/wiki/[slug]/page.tsx`: URL의 `slug`로 해당 글을 표시합니다. 없는 글은 404 화면을 표시합니다.
- `src/app/wiki/wiki.module.css`: 위키 목록과 글 상세 화면 스타일입니다.

현재 DB, 글쓰기, 수정 기능은 없습니다. 예시 글은 실제 커뮤니티의 검증된 노하우가 아니며, 화면 개발용입니다.

## 멤버 소개

- `/members`: 공개 멤버 목록. 현재는 가상의 예시 프로필 3개입니다.
- `/members/sample-digital-founder` 등: 멤버 상세. 사진이 없으면 준비 중 표시, 웹사이트가 없으면 안내를 표시합니다.
- `src/types/member.ts`: 화면에서 사용하는 공개 프로필 형식입니다.
- `src/data/members.ts`: 예시 데이터입니다. `status`가 `published`인 프로필만 공개되며 `draft`는 목록·상세에서 제외합니다.
- `src/lib/members.ts`: 서버에서만 사용하는 조회 함수입니다. Neon 연결 시 함수 내부를 DB 조회로 교체합니다.
- `src/app/members/`: 목록·상세 화면과 스타일입니다.

나중에 관리자 인증·권한 검사, 입력 검증, 저장 API, 사진 저장소와 게시 후 캐시 갱신을 추가해야 합니다. 현재 공개 여부 필터는 관리자 인증을 대신하지 않습니다. 사진 URL에는 신뢰할 수 있는 이미지 저장소의 주소를 사용하세요. 현재는 이미지 최적화 없이 표시하며, 저장소가 정해지면 Next.js 이미지 설정을 적용할 수 있습니다.

## 모임 후기

- `/stories`: 날짜 내림차순으로 정렬된 공개 후기 목록입니다.
- `/stories/sample-founders-conversation` 등: 모임 날짜·장소·본문을 보여주는 상세 화면입니다.
- `src/types/story.ts`: 후기와 사진의 데이터 형식입니다. 본문은 문단·제목·이미지 블록을 순서대로 보관합니다. 여러 사진을 문단 사이에 배치할 수 있습니다.
- `src/data/stories.ts`: 실제 행사와 관계없는 예시 글입니다. 날짜·장소도 가상의 정보입니다.
- `src/lib/stories.ts`: 공개 후기 조회 함수입니다. 초안을 제외하며, Neon 연결 시 내부 조회 구현을 교체합니다.
- `src/components/story-photo.tsx`: 이미지와 대체 텍스트·사진 설명을 표시합니다. 이미지 정보에 URL, 크기, 설명을 보관하며 Blob 연결 후에는 그 URL을 사용할 수 있습니다.

현재 관리자 로그인·글쓰기·수정·사진 업로드 기능은 없습니다. 사진이 없어도 후기를 표시하며, 사진 렌더러는 URL이 제공되면 표시할 수 있도록 준비했습니다. 실제 업로드는 관리자 권한 확인, 파일 형식·크기 검증, Vercel Blob 저장, Neon에 이미지 메타데이터 저장, 게시 후 캐시 갱신까지 별도 구현해야 합니다. 관리자 수정 시에는 블록 ID를 유지하고 배열 순서를 변경해 글과 사진 순서를 관리할 수 있습니다.
