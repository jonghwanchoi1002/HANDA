# Neon 연결 순서

현재 코드는 두 가지 데이터 출처를 지원합니다.

- `CONTENT_SOURCE=sample` (기본값): 기존 예시 파일을 읽습니다. DB 없이도 실행됩니다.
- `CONTENT_SOURCE=database`: Neon에서 공개 콘텐츠를 읽습니다. 연결 실패 시 예시로 숨기지 않고 오류 안내를 표시합니다.

`DATABASE_URL`만 등록해도 DB 모드로 바뀌지는 않습니다. 테이블과 데이터를 준비한 뒤 전환하세요.

## 1. PC 설정

이 변경의 브랜치를 가져온 뒤 의존성을 설치합니다.

```bash
npm ci
cp .env.example .env.local
```

기존 `.env.local`이 있으면 복사 명령으로 덮어쓰지 말고 필요한 항목만 추가하세요.
VS Code에서 `.env.local`을 열고 다음 두 항목을 설정합니다.

```dotenv
CONTENT_SOURCE=sample
DATABASE_URL=여기에_Neon의_전체_연결_주소
```

Neon Connect 창에서 연결할 브랜치를 확인하고 pooling이 켜진 PostgreSQL URL을 복사합니다. 실제 주소는 파일에만 입력하고 Git·채팅·화면 캡처에 노출하지 마세요. `NEXT_PUBLIC_` 접두사는 사용하지 않습니다. `.env.local`은 Git에서 제외됩니다.

아래 명령은 선택한 DB에 테이블과 예시 콘텐츠를 생성합니다. 현재 새로 만든 빈 DB를 초기화하는 용도입니다. 관리자 기능 개발을 시작하기 전에는 Neon에서 개발용 브랜치를 만들어 PC 및 Vercel Preview가 운영 DB와 분리되도록 설정하세요.

## 2. 테이블과 초기 콘텐츠 준비

프로젝트 루트에서 차례로 실행합니다. 앞 단계가 실패하면 다음 단계로 넘어가지 마세요.

```bash
npm run db:migrate
npm run db:seed
npm run db:check
```

- `db:migrate`: 트랜잭션 안에서 SQL 마이그레이션을 적용하고 이름·체크섬을 기록합니다. 재실행하면 적용한 파일은 건너뜁니다. 적용한 SQL 파일을 수정하지 말고 다음 번호의 파일을 추가하세요.
- `db:seed`: 홈페이지 기본 문구와 예시 콘텐츠 총 12개를 넣습니다. 같은 종류·키가 이미 있으면 덮어쓰지 않습니다.
- `db:check`: 접속과 테이블 조회, 공개 데이터 형식을 검증합니다. 비밀 연결 주소는 출력하지 않습니다.

정상 초기화 결과: home 1, wiki 3, member 3, story 2, testimonial 3. 기존 데이터에 따라 숫자는 달라질 수 있습니다.

## 3. PC에서 DB 읽기 확인

`.env.local`의 `CONTENT_SOURCE`를 `database`로 바꾸세요.
개발 서버를 Ctrl+C로 종료하고 다시 `npm run dev`를 실행합니다.
홈페이지와 각 메뉴·상세 글을 확인하세요. DB에는 같은 예시 콘텐츠가 들어가므로 처음 보이는 화면은 거의 같습니다.

DB 모드는 요청 시 조회하므로 빌드 단계에서 DB 연결이나 테이블 생성이 필요하지 않습니다. 데이터 조회에는 영구 캐시를 사용하지 않지만, 향후 관리자 저장 직후에는 클라이언트 화면 갱신도 구현해야 합니다. 표본 URL은 빌드 경로를 위한 것이며 새 DB 글의 URL도 요청 시 조회합니다.

## 4. Vercel 운영 환경 전환

1. 운영 Neon 브랜치에서 `db:migrate`, `db:seed`, `db:check`가 모두 통과했는지 확인합니다.
2. 코드 변경을 검토하고 main에 병합합니다. 아직 sample 모드라 기존 사이트는 유지됩니다.
3. Vercel Production에 `DATABASE_URL`이 설정되어 있는지 확인합니다.
4. Production에 `CONTENT_SOURCE=database`를 추가하고 재배포합니다.
5. 배포된 홈페이지의 모든 목록과 상세 페이지를 확인합니다.

Preview·Development에 운영 DB 주소를 복사하지 마세요. 별도 개발 DB를 연결하기 전에는 sample 모드를 유지합니다.
문제가 있으면 `CONTENT_SOURCE=sample`로 바꾸고 재배포해 화면을 복구할 수 있습니다. DB 콘텐츠는 삭제되지 않습니다.

## 저장 구조와 다음 단계

`handa_content`는 콘텐츠 종류·고유 키·공개 상태·표시 순서·생성/수정 시각과 JSONB 본문을 저장합니다. 홈페이지 첫 문구와 소개 본문도 DB에서 읽습니다. 메뉴 이름·일부 안내 문구와 디자인은 아직 코드에 있습니다.

사진 파일은 DB에 넣지 않습니다. 본문의 이미지 블록과 프로필 필드에는 URL·대체 텍스트·크기·설명을 저장하고, 실제 파일은 이후 Vercel Blob 업로드 기능에서 관리합니다.

현재 관리자 로그인·쓰기 API·업로드 기능은 없습니다. 이후 관리자 인증과 서버 권한 검사, 입력 검증, 저장 트랜잭션, Blob 파일 수명 관리, 게시 직후 화면 갱신을 추가해야 합니다. 공개 여부 필터는 인증을 대신하지 않습니다. 공개 목록은 초기 규모를 위한 방식이며 글이 많아지면 서버 검색과 페이지 나누기를 추가합니다.

## 검증

```bash
npm run lint
npm run test:db
npm run build
```

`test:db`는 로컬 PGlite(PostgreSQL 엔진)를 사용해 SQL·조회·초안 필터·이미지 데이터·초기화 반복 실행을 검사합니다. 실제 pg 드라이버로 초기화 명령도 테스트합니다. 테스트는 로컬 DB만 사용하며 Neon 계정의 실제 접속 성공을 의미하지 않습니다. 실제 연결은 `db:check`로 별도 확인합니다.
