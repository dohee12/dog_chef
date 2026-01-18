# 🔐 OAuth 설정 완전 가이드

## "사이트에 접근할 수 없다" 오류 해결

이 오류는 Google/Kakao 개발자 콘솔에 등록된 Redirect URI가 Supabase 콜백 URL과 일치하지 않을 때 발생합니다.

---

## ✅ 올바른 설정 방법

### 1. Supabase 콜백 URL 확인

Supabase 프로젝트의 콜백 URL 형식:
```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

**예시**:
- 프로젝트 URL이 `https://abcdefghijk.supabase.co`라면
- 콜백 URL은 `https://abcdefghijk.supabase.co/auth/v1/callback`

---

### 2. Google Cloud Console 설정

#### Step 1: OAuth 클라이언트 생성

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 선택 또는 생성
3. **APIs & Services** → **Credentials** 클릭
4. **+ CREATE CREDENTIALS** → **OAuth client ID** 선택
5. **Application type**: **Web application** 선택
6. **Name**: 원하는 이름 입력 (예: "멍슐랭 OAuth")

#### Step 2: Redirect URI 등록

**Authorized redirect URIs**에 다음을 추가:

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

**중요**: 
- ✅ 반드시 `https://`로 시작
- ✅ 정확한 프로젝트 참조 ID 사용
- ✅ `/auth/v1/callback` 경로 정확히 입력
- ❌ `http://` 사용 금지
- ❌ 마지막에 `/` 추가 금지

**예시**:
```
https://abcdefghijk.supabase.co/auth/v1/callback
```

#### Step 3: Client ID와 Secret 복사

생성 후:
- **Client ID** 복사
- **Client Secret** 복사 (한 번만 표시되므로 안전하게 보관)

---

### 3. Kakao Developers 설정

#### Step 1: 애플리케이션 생성

1. [Kakao Developers](https://developers.kakao.com) 접속
2. **내 애플리케이션** → **애플리케이션 추가하기**
3. 앱 이름 입력하여 생성

#### Step 2: 카카오 로그인 활성화

1. **제품 설정** → **카카오 로그인** 클릭
2. **활성화 상태**: **ON**으로 변경
3. **Redirect URI** 섹션에서 **+ URI 추가** 클릭
4. 다음 URI 추가:

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

**중요**:
- ✅ 반드시 `https://`로 시작
- ✅ 정확한 프로젝트 참조 ID 사용
- ✅ `/auth/v1/callback` 경로 정확히 입력
- ❌ `http://` 사용 금지
- ❌ 마지막에 `/` 추가 금지

**예시**:
```
https://abcdefghijk.supabase.co/auth/v1/callback
```

#### Step 3: REST API 키 확인

1. **앱 키** 섹션에서 **REST API 키** 복사
2. 이 키를 Supabase에 등록할 때 사용

---

### 4. Supabase 대시보드 설정

#### Google Provider 설정

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Authentication** → **Providers** 클릭
4. **Google** 찾기 → **Enable Google** 클릭
5. 다음 정보 입력:
   - **Client ID (for OAuth)**: Google Cloud Console에서 복사한 Client ID
   - **Client Secret (for OAuth)**: Google Cloud Console에서 복사한 Client Secret
6. **Save** 클릭

#### Kakao Provider 설정

1. **Authentication** → **Providers** 클릭
2. **Kakao** 찾기 → **Enable Kakao** 클릭
3. 다음 정보 입력:
   - **Client ID (for OAuth)**: Kakao Developers에서 복사한 REST API 키
   - **Client Secret (for OAuth)**: 비워둠 (카카오는 불필요)
4. **Save** 클릭

---

## 🔍 문제 해결 체크리스트

### ✅ Google 로그인 오류

- [ ] Google Cloud Console에서 OAuth 클라이언트 생성 완료
- [ ] Redirect URI가 정확히 `https://<project>.supabase.co/auth/v1/callback` 형식인지 확인
- [ ] Client ID와 Secret이 Supabase에 올바르게 입력되었는지 확인
- [ ] Supabase에서 Google Provider가 활성화되어 있는지 확인
- [ ] `.env` 파일에 `EXPO_PUBLIC_SUPABASE_URL`이 올바르게 설정되어 있는지 확인

### ✅ Kakao 로그인 오류

- [ ] Kakao Developers에서 애플리케이션 생성 완료
- [ ] 카카오 로그인이 활성화되어 있는지 확인
- [ ] Redirect URI가 정확히 `https://<project>.supabase.co/auth/v1/callback` 형식인지 확인
- [ ] REST API 키가 Supabase에 올바르게 입력되었는지 확인
- [ ] Supabase에서 Kakao Provider가 활성화되어 있는지 확인
- [ ] `.env` 파일에 `EXPO_PUBLIC_SUPABASE_URL`이 올바르게 설정되어 있는지 확인

---

## 🧪 테스트 방법

### 1. 콘솔 로그 확인

로그인 버튼 클릭 시 콘솔에 다음이 출력되는지 확인:

```
구글 로그인 시도...
리다이렉트 URL: dogchef:///
Supabase URL: https://abcdefghijk.supabase.co
```

### 2. OAuth URL 확인

`data.url`이 올바르게 생성되는지 확인:

```typescript
console.log("OAuth URL:", data.url);
```

이 URL은 다음과 같은 형식이어야 합니다:
```
https://abcdefghijk.supabase.co/auth/v1/authorize?provider=google&redirect_to=dogchef%3A%2F%2F%2F&...
```

### 3. 에러 메시지 확인

에러 발생 시 정확한 에러 메시지를 확인:
- "redirect_uri_mismatch": Redirect URI가 일치하지 않음
- "invalid_client": Client ID/Secret이 잘못됨
- "access_denied": 사용자가 로그인 취소

---

## 💡 자주 하는 실수

### ❌ 잘못된 Redirect URI

```
❌ http://abcdefghijk.supabase.co/auth/v1/callback  (http 사용)
❌ https://abcdefghijk.supabase.co/auth/v1/callback/  (마지막 / 추가)
❌ https://abcdefghijk.supabase.co/callback  (경로 잘못됨)
❌ dogchef:///  (앱 스킴을 직접 등록)
```

### ✅ 올바른 Redirect URI

```
✅ https://abcdefghijk.supabase.co/auth/v1/callback
```

---

## 🔄 설정 변경 후

1. **Google/Kakao 설정 변경 후**: 즉시 적용됨
2. **Supabase 설정 변경 후**: 저장 후 즉시 적용됨
3. **앱 재시작**: 설정 변경 후 앱을 재시작하는 것이 좋습니다

---

## 📞 추가 도움

문제가 계속되면 다음 정보를 확인하세요:

1. 콘솔의 정확한 에러 메시지
2. Supabase 프로젝트 URL
3. Google/Kakao 개발자 콘솔의 Redirect URI 설정 스크린샷
4. Supabase 대시보드의 Provider 설정 스크린샷

---

**중요**: Redirect URI는 정확히 일치해야 합니다. 대소문자, 슬래시, 프로토콜 모두 정확해야 합니다!

