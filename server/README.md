# 멍슐랭 API 서버

Supabase 대신 직접 만든 백엔드입니다. Node.js + Hono + PostgreSQL로 구성되어 있고, AI(Claude) 호출은 서버에서만 수행합니다.

## 구조

```
server/
├── migrations/001_init.sql   # DB 스키마
├── src/
│   ├── index.ts              # 서버 시작
│   ├── app.ts                # 라우트 연결 + 에러 처리
│   ├── config.ts             # 환경 변수
│   ├── db.ts                 # PostgreSQL 연결
│   ├── migrate.ts            # 마이그레이션 실행기
│   ├── auth.ts               # 비밀번호 해시, JWT, 인증 미들웨어
│   ├── rules.ts              # 알레르기·독성 규칙 기반 안전 검사 (AI 아님)
│   ├── ai.ts                 # Claude API 호출
│   ├── json.ts               # 모델 응답의 JSON 파싱
│   ├── http.ts               # 입력 검증, 에러 클래스
│   └── routes/               # auth, pets, recipes, ai
```

## 실행

```bash
cd server
cp .env.example .env          # DATABASE_URL, JWT_SECRET 등을 채우세요
npm install
npm run migrate               # 스키마 생성
npm run dev                   # http://localhost:3000
npm test                      # 규칙 엔진·JSON 파서 테스트
```

로컬 Postgres가 없으면 Docker로 띄울 수 있습니다.

```bash
docker run -d --name dogchef-db -p 5432:5432 \
  -e POSTGRES_USER=dogchef -e POSTGRES_PASSWORD=dogchef -e POSTGRES_DB=dogchef postgres:16
```

## 설계 원칙

- **알레르기·독성 판정은 규칙이 한다.** `rules.ts`의 키워드 목록으로 판정하고, AI는 결과를 설명하거나 초안을 만드는 데만 씁니다.
- **독성 식재료가 든 레시피는 저장을 거부한다** (422).
- **AI 초안은 저장하지 않고 반환한다.** 생성 후 안전 검사를 통과해야 응답하며, 실패하면 한 번 재시도합니다.
- **사용자 데이터는 항상 소유자 조건으로 조회한다.** 다른 사람의 반려견 ID를 넣어도 404가 나옵니다.
- **AI 키가 없어도 서버는 정상 동작한다.** AI 엔드포인트만 503을 반환합니다.

## API

인증이 필요한 요청은 `Authorization: Bearer <token>` 헤더를 붙입니다.

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| GET | `/health` | - | 서버 상태, AI 활성 여부 |
| POST | `/api/auth/signup` | - | `{email, password, name}` → `{token, user}` |
| POST | `/api/auth/login` | - | `{email, password}` → `{token, user}` |
| GET | `/api/auth/me` | ✔ | 내 정보 |
| GET | `/api/pets` | ✔ | 내 반려견 목록 |
| POST | `/api/pets` | ✔ | 반려견 등록 |
| PATCH | `/api/pets/:id` | ✔ | 반려견 수정 (부분 수정) |
| DELETE | `/api/pets/:id` | ✔ | 반려견 삭제 |
| GET | `/api/recipes?category=&q=&petId=` | 선택 (`petId`는 필수 로그인) | 목록. `petId`를 주면 그 반려견 알레르기 재료가 든 레시피를 제외 |
| GET | `/api/recipes/:id` | - | 상세 (평균 별점, 리뷰 수 포함) |
| POST | `/api/recipes` | ✔ | 레시피 등록. 독성 재료가 있으면 422 |
| PATCH | `/api/recipes/:id` | ✔ | 내 레시피 수정 |
| DELETE | `/api/recipes/:id` | ✔ | 내 레시피 삭제 |
| POST / DELETE | `/api/recipes/:id/favorite` | ✔ | 즐겨찾기 추가 / 해제 |
| GET | `/api/me/favorites` | ✔ | 즐겨찾기 목록 |
| GET | `/api/recipes/:id/reviews` | - | 리뷰 목록 |
| POST | `/api/recipes/:id/reviews` | ✔ | 리뷰 작성 또는 수정 `{rating: 1-5, comment}` |
| POST | `/api/ai/recipes/generate` | ✔ | `{petId?, category?, hint?}` → 레시피 초안 (저장 안 함) |
| POST | `/api/ai/recipes/tags` | ✔ | `{title, ingredients}` → `{tags}` |
| POST | `/api/ai/safety/explain` | ✔ | `{ingredients, petId?}` → 규칙 판정 + AI 설명 |

### 오류 형식

```json
{ "error": "사람이 읽을 수 있는 메시지" }
```

| 코드 | 의미 |
|---|---|
| 400 | 입력값 오류 |
| 401 | 로그인 필요 또는 토큰 만료 |
| 404 | 없음 (다른 사용자의 데이터 포함) |
| 409 | 이미 가입된 이메일 |
| 422 | 안전 규칙 위반 (독성 재료) |
| 502 | 외부 AI 서비스 응답 실패 |
| 503 | AI 키 미설정 |

## 아직 없는 것 (다음 단계)

- 구글·카카오 소셜 로그인 (OAuth 클라이언트 ID 발급 필요)
- 이미지 업로드 (현재는 이미지 URL 문자열만 저장)
- 요청 속도 제한, 로그인 실패 횟수 제한
- 앱(React Native)에서 Supabase 호출을 이 API 호출로 바꾸는 작업
