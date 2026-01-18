# 🐕 멍슐랭 (Dog Chef)

반려견을 위한 레시피 플랫폼 - React Native 앱

> 반려견의 건강을 생각하는 맞춤형 레시피 추천 및 관리 서비스

## 📱 프로젝트 소개

멍슐랭은 반려견의 건강과 알레르기 정보를 기반으로 안전하고 건강한 레시피를 추천하는 React Native 앱입니다.

### 주요 기능

- 🐶 **반려견 프로필 관리**: 반려견의 나이, 체중, 알레르기 정보 등록
- 🍖 **레시피 추천**: 반려견에게 맞는 맞춤형 레시피 큐레이션
- ⚠️ **알레르기 경고**: 반려견에게 위험한 재료 자동 감지
- 📝 **레시피 작성**: 커뮤니티 레시피 공유
- ⭐ **즐겨찾기**: 마음에 드는 레시피 저장
- 🔍 **검색 및 필터링**: 재료, 카테고리별 레시피 검색
- 👤 **로그인 시스템**: 이메일, 구글, 카카오 소셜 로그인 지원

## 🛠 기술 스택

### Frontend

- **React Native** (0.81.5) - 크로스플랫폼 모바일 앱
- **Expo** (SDK 54) - 개발 환경 및 빌드 도구
- **TypeScript** - 타입 안전성

### Navigation

- **React Navigation** (v7) - 네이티브 스택 네비게이션
- **Bottom Tabs** - 탭 기반 네비게이션

### Backend & Authentication

- **Supabase** - 백엔드 서비스 (PostgreSQL, Auth, Storage)
- **Supabase Auth** - 이메일 및 OAuth 인증 (구글, 카카오)

### State Management

- **Context API** - 전역 상태 관리
- **React Hooks** - 로컬 상태 관리

### Storage

- **AsyncStorage** - 로컬 데이터 저장 및 세션 관리

---

## 🚀 시작하기

### 1. 프로젝트 클론 및 의존성 설치

   ```bash
# 프로젝트 클론
git clone <repository-url>
cd dog_chef

# 의존성 설치
   npm install
   ```

### 2. Supabase 설정 (필수)

#### 2-1. Supabase 프로젝트 생성

1. [https://supabase.com](https://supabase.com) 접속
2. "Start your project" 클릭하여 계정 생성
3. "New Project" 버튼 클릭
4. 프로젝트 정보 입력:
   - 프로젝트 이름: `dog-chef` (또는 원하는 이름)
   - 데이터베이스 비밀번호: 안전한 비밀번호 설정 (기억해두세요!)
   - 리전: `Asia Pacific - Seoul` (또는 가장 가까운 지역)
5. "Create new project" 클릭
6. 1-2분 기다리기 (프로젝트 생성 중)

#### 2-2. API 키 가져오기

프로젝트 생성 완료 후:

1. 왼쪽 메뉴에서 **Settings** (톱니바퀴 아이콘) 클릭
2. **API** 메뉴 클릭
3. 다음 2개 값을 복사:
   - **Project URL** (예: `https://xxxxx.supabase.co`)
   - **anon public** 키 (긴 문자열, `eyJhbGci...`로 시작)

#### 2-3. 환경 변수 설정

프로젝트 루트 폴더(`d:\dog_chef`)에 `.env` 파일을 생성:

```env
EXPO_PUBLIC_SUPABASE_URL=여기에_Project_URL_붙여넣기
EXPO_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_public_키_붙여넣기
```

**실제 예시:**

```env
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk5OTk5OTksImV4cCI6MjAxNTU3NTk5OX0.xxxxxxxxxxxxxxxxxxxx
```

> ⚠️ **중요**: `.env` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다. 팀원과 공유할 때는 별도로 전달하세요.

### 3. OAuth 제공자 설정 (선택사항)

구글 및 카카오 로그인을 사용하려면 추가 설정이 필요합니다.

#### 구글 로그인 설정

1. **Supabase 대시보드**:

   - Authentication → Providers → Google 활성화

2. **Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com)):

   - 새 프로젝트 생성 또는 기존 프로젝트 선택
   - APIs & Services → Credentials
   - "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: Web application
   - Authorized redirect URIs 추가: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Client ID와 Client Secret 복사

3. **Supabase에 등록**:
   - Google Provider 설정에 Client ID와 Client Secret 입력
   - Save

#### 카카오 로그인 설정

1. **Kakao Developers** ([developers.kakao.com](https://developers.kakao.com)):

   - 내 애플리케이션 → 애플리케이션 추가하기
   - 앱 이름 입력하여 생성

2. **카카오 로그인 활성화**:

   - 내 애플리케이션 → 제품 설정 → 카카오 로그인
   - 활성화 상태: ON
   - Redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`

3. **Supabase에 등록**:
   - Authentication → Providers → Kakao 활성화
   - Client ID: 카카오의 **REST API 키** 입력
   - Client Secret: 비워둠 (카카오는 불필요)
   - Save

### 4. 앱 실행

```bash
# Expo 개발 서버 시작
npm start

# 또는 캐시 클리어 후 시작
npm start -- --clear
```

실행 후 선택 가능한 옵션:

- **Android**: `a` 키를 누르거나 Android 에뮬레이터에서 실행
- **iOS**: `i` 키를 누르거나 iOS 시뮬레이터에서 실행
- **Web**: `w` 키를 누르거나 브라우저에서 실행
- **Expo Go**: QR 코드 스캔하여 실제 기기에서 실행

---

## 🔐 로그인 시스템

### 구현된 인증 기능

| 기능                  | 설명                                 |
| --------------------- | ------------------------------------ |
| ✉️ **이메일 로그인**  | 이메일/비밀번호로 회원가입 및 로그인 |
| 🔐 **구글 로그인**    | Google 계정으로 간편 로그인          |
| 💬 **카카오 로그인**  | 카카오 계정으로 간편 로그인          |
| 🔄 **자동 세션 관리** | 앱 종료 후에도 로그인 상태 유지      |
| 🔒 **보안 라우팅**    | 비로그인 시 앱 기능 접근 차단        |

### 인증 시스템 구조

```
App.tsx
  └── AuthProvider (전역 인증 상태)
       └── RootNavigator (조건부 라우팅)
            ├── 비로그인: LoginScreen
            └── 로그인: MainTabs + 기타 화면들
```

### 주요 파일 설명

#### 1. **AuthContext** (`src/context/AuthContext.tsx`)

- 전역 인증 상태 관리
- Supabase Auth API 래핑
- 로그인/로그아웃 메서드 제공

```typescript
// 사용 예시
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
  const { user, signIn, signOut } = useAuth();

  if (user) {
    return <Text>안녕하세요, {user.email}님!</Text>;
  }
}
```

#### 2. **LoginScreen** (`src/screens/LoginScreen.tsx`)

- 이메일/비밀번호 입력 폼
- 회원가입/로그인 토글
- 소셜 로그인 버튼 (구글, 카카오)

**특징**:

- `KeyboardAvoidingView`: 키보드가 입력창을 가리지 않음
- `ScrollView`: 작은 화면 대응
- 반응형 UI

#### 3. **AuthButton** (`src/components/AuthButton.tsx`)

- 로그인 상태에 따라 다른 UI 표시
- 비로그인: "로그인" 버튼
- 로그인: 사용자 정보 + "로그아웃" 버튼

#### 4. **RootNavigator** (`src/navigation/RootNavigator.tsx`)

- 인증 기반 라우팅
- 비로그인 시 로그인 화면만 표시
- 로그인 시 전체 앱 접근 가능

### 왜 이렇게 설계했나요?

#### ✅ Context API 사용

- React Native 내장 기능으로 추가 라이브러리 불필요
- 모든 컴포넌트에서 `useAuth()` 한 줄로 인증 상태 접근
- Redux보다 간단하고 보일러플레이트 코드 최소화

#### ✅ Supabase 선택

- 백엔드 서버 구축 불필요
- JWT 토큰, 세션 관리 자동화
- OAuth 연동 간편 (대시보드에서 설정)
- 무료 플랜으로 시작 가능

#### ✅ 조건부 네비게이션

- 비로그인 사용자가 앱 내부 화면에 접근 불가 (보안 강화)
- 뒤로가기 버튼으로 우회 불가능
- 로그인 상태 변경 시 자동으로 화면 전환

#### ✅ AsyncStorage 세션 저장

- 앱 종료 후에도 로그인 유지
- 자동 세션 복원
- 토큰 만료 전 자동 갱신

---

## 📁 프로젝트 구조

```
dog_chef/
├── App.tsx                     # 앱 진입점, Provider 설정
├── app.json                    # Expo 설정
├── package.json                # 의존성 관리
├── tsconfig.json               # TypeScript 설정
│
├── src/
│   ├── components/             # 재사용 가능한 컴포넌트
│   │   ├── AllergyWarning.tsx  # 알레르기 경고 배너
│   │   ├── AuthButton.tsx      # 로그인/로그아웃 버튼
│   │   ├── CategoryTabs.tsx    # 카테고리 탭
│   │   ├── CustomButton.tsx    # 커스텀 버튼
│   │   ├── FloatingButton.tsx  # 플로팅 액션 버튼
│   │   ├── IngredientSelector.tsx  # 재료 선택기
│   │   ├── PetCard.tsx         # 반려견 카드
│   │   ├── PetCuration.tsx     # 반려견 큐레이션
│   │   ├── PopularSection.tsx  # 인기 레시피 섹션
│   │   ├── RankingList.tsx     # 랭킹 리스트
│   │   ├── RecipeCard.tsx      # 레시피 카드
│   │   └── ReviewSystem.tsx    # 리뷰 시스템
│   │
│   ├── constants/              # 상수 정의
│   │   └── Colors.ts           # 앱 전체 색상 테마
│   │
│   ├── context/                # Context API
│   │   ├── AuthContext.tsx     # 인증 상태 관리
│   │   ├── PetContext.tsx      # 반려견 데이터 관리
│   │   └── RecipeContext.tsx   # 레시피 데이터 관리
│   │
│   ├── hooks/                  # Custom Hooks
│   │   ├── usePopularRecipes.ts  # 인기 레시피 훅
│   │   └── useRecipes.ts       # 레시피 훅
│   │
│   ├── lib/                    # 외부 라이브러리 설정
│   │   └── supabase.ts         # Supabase 클라이언트 설정
│   │
│   ├── navigation/             # 네비게이션 설정
│   │   ├── RootNavigator.tsx   # 루트 네비게이터 (인증 라우팅)
│   │   └── TabNavigator.tsx    # 탭 네비게이터
│   │
│   ├── screens/                # 화면 컴포넌트
│   │   ├── AddPetScreen.tsx    # 반려견 추가 화면
│   │   ├── AddRecipeScreen.tsx # 레시피 추가 화면
│   │   ├── DetailScreen.tsx    # 상세 화면
│   │   ├── FavoritesScreen.tsx # 즐겨찾기 화면
│   │   ├── HomeScreen.tsx      # 홈 화면
│   │   ├── LoginScreen.tsx     # 로그인 화면
│   │   ├── PetFormScreen.tsx   # 반려견 폼 화면
│   │   ├── PetScreen.tsx       # 반려견 목록 화면
│   │   ├── RecipeDetailScreen.tsx  # 레시피 상세 화면
│   │   ├── RecipeFormScreen.tsx    # 레시피 폼 화면
│   │   └── SearchScreen.tsx    # 검색 화면
│   │
│   ├── styles/                 # 스타일 정의
│   │   ├── colors.ts           # 색상 정의
│   │   └── layout.ts           # 레이아웃 정의
│   │
│   ├── types/                  # TypeScript 타입 정의
│   │   ├── index.ts            # 공통 타입
│   │   ├── Pet.ts              # 반려견 타입
│   │   └── Recipe.ts           # 레시피 타입
│   │
│   └── utils/                  # 유틸리티 함수
│       ├── allergyMappings.ts  # 알레르기 매핑
│       ├── calculateNutrition.ts  # 영양 계산
│       ├── mockData.ts         # 목 데이터
│       └── nutritionCalculator.ts  # 영양소 계산기
│
└── assets/                     # 정적 자산
    └── images/                 # 이미지 파일
        ├── favicon.png
        ├── icon.png
        └── splash-icon.png
```

---

## 🎨 주요 화면

### 1. 로그인 화면 (LoginScreen)

- 이메일/비밀번호 입력
- 회원가입/로그인 토글
- 구글, 카카오 소셜 로그인 버튼

### 2. 홈 화면 (HomeScreen)

- 반려견별 맞춤 레시피 큐레이션
- 인기 레시피 섹션
- 카테고리 탭

### 3. 레시피 상세 (RecipeDetailScreen)

- 재료, 조리법, 영양 정보
- 알레르기 경고
- 리뷰 시스템

### 4. 반려견 관리 (PetScreen)

- 등록된 반려견 목록
- 반려견 정보 수정
- 알레르기 정보 관리

### 5. 검색 화면 (SearchScreen)

- 재료별 검색
- 카테고리별 필터링
- 검색 결과 표시

---

## 💡 개발 가이드

### Context 사용하기

```typescript
// 인증 정보 사용
import { useAuth } from "@/context/AuthContext";

function MyScreen() {
  const { user, signOut } = useAuth();
  // ...
}

// 반려견 정보 사용
import { usePets } from "@/context/PetContext";

function PetScreen() {
  const { pets, addPet, deletePet } = usePets();
  // ...
}

// 레시피 정보 사용
import { useRecipe } from "@/context/RecipeContext";

function RecipeScreen() {
  const { recipes, addRecipe } = useRecipe();
  // ...
}
```

### 새로운 화면 추가하기

1. `src/screens/`에 새 파일 생성 (예: `MyNewScreen.tsx`)
2. `src/navigation/RootNavigator.tsx`에 라우트 추가:

```typescript
<stack.Screen
  name="MyNew"
  component={MyNewScreen}
  options={{ title: "새 화면" }}
/>
```

### 색상 테마 사용하기

```typescript
import Colors from "@/constants/Colors";

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
  },
  text: {
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.primary,
  },
});
```

---

## 🔧 문제 해결 (Troubleshooting)

### 1. "Supabase 환경 변수가 설정되지 않았습니다" 경고

**원인**: `.env` 파일이 없거나 환경 변수가 잘못 설정됨

**해결**:

1. 프로젝트 루트에 `.env` 파일이 있는지 확인
2. 파일 내용 확인:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```
3. 앱을 완전히 종료하고 다시 시작:
   ```bash
   npm start -- --clear
   ```

### 2. "Invalid login credentials" 에러

**원인**: 이메일/비밀번호가 틀리거나 사용자가 없음

**해결**:

1. 이메일과 비밀번호 다시 확인
2. 회원가입을 했는지 확인
3. 회원가입 후 이메일 인증을 완료했는지 확인
4. Supabase 대시보드 → Authentication → Users에서 사용자 존재 여부 확인

### 3. OAuth 로그인 실패 (구글/카카오)

**원인**: OAuth 제공자가 제대로 설정되지 않음

**해결**:

1. Supabase 대시보드 → Authentication → Providers에서 활성화 확인
2. Redirect URI가 정확히 설정되었는지 확인
3. 구글/카카오 개발자 콘솔에서 설정 재확인
4. Client ID와 Secret이 올바르게 입력되었는지 확인

### 4. 세션이 유지되지 않음

**원인**: AsyncStorage 설정 문제

**해결**:

1. `@react-native-async-storage/async-storage`가 설치되어 있는지 확인:
   ```bash
   npm list @react-native-async-storage/async-storage
   ```
2. 없으면 재설치:
   ```bash
   npm install @react-native-async-storage/async-storage
   ```
3. 앱 재시작

### 5. 빌드 에러 또는 이상한 동작

**해결**:

```bash
# 캐시 클리어
npm start -- --clear

# 또는 완전히 재설치
rm -rf node_modules
npm install
npm start
```

### 6. "Email not confirmed" 에러

**원인**: 이메일 인증을 완료하지 않음

**해결**:

1. 회원가입 시 받은 이메일에서 인증 링크 클릭
2. 개발 중에는 Supabase 대시보드에서 수동 인증:
   - Authentication → Users → 해당 사용자 클릭
   - "Confirm email" 버튼 클릭

### 7. 구글/카카오 OAuth 로그인이 작동하지 않음

**원인**: Expo 환경에서 OAuth 리다이렉트 처리가 제대로 되지 않음

**해결 방법**:

1. **expo-web-browser 사용**: `expo-web-browser`를 사용하여 OAuth 플로우 처리
2. **앱 스킴 설정**: `app.json`의 `scheme` 필드 확인 (예: `"scheme": "dogchef"`)
3. **리다이렉트 URL 설정**: `Linking.createURL()`을 사용하여 동적 리다이렉트 URL 생성

**구현 개념**:

```typescript
// OAuth 플로우
1. supabase.auth.signInWithOAuth() 호출 → OAuth URL 반환
2. WebBrowser.openAuthSessionAsync()로 브라우저 열기
3. 사용자가 로그인 완료 → 앱으로 리다이렉트
4. URL에서 access_token, refresh_token 추출
5. supabase.auth.setSession()으로 세션 설정
```

**핵심 포인트**:
- 모바일 앱에서는 웹 리다이렉트가 작동하지 않으므로 `expo-web-browser` 필수
- `skipBrowserRedirect: false` 설정으로 브라우저에서 인증 처리
- 리다이렉트 URL은 앱 스킴을 사용 (예: `dogchef://`)

### 8. 레시피 추가/수정/삭제 시 오류 발생

**원인**: 
- `user_id`가 제대로 설정되지 않음
- RLS 정책 위반
- 영양 정보 계산 오류

**해결 방법**:

1. **user_id 자동 설정**: 레시피 추가 시 현재 로그인한 사용자 ID 자동 할당
2. **에러 처리 개선**: RLS 오류(42501)와 일반 오류 구분하여 사용자에게 명확한 메시지 표시
3. **영양 정보 계산**: 재료 배열에서 자동으로 영양 정보 계산 및 반올림 처리

**구현 개념**:

```typescript
// 레시피 추가 시
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  Alert.alert("로그인 필요");
  return;
}

// 영양 정보 계산
const nutrition = calculateTotalNutrition(ingredients);
const nutritionData = {
  calories: Math.round(nutrition.calories * 100) / 100,
  protein: Math.round(nutrition.protein * 100) / 100,
  // ...
};

// DB에 저장
await supabase.from("recipes").insert([{
  ...recipeData,
  ...nutritionData,
  user_id: user.id, // ← 핵심!
}]);
```

**핵심 포인트**:
- 모든 데이터 작업 전에 로그인 상태 확인 필수
- `user_id`는 항상 현재 로그인한 사용자로 설정
- RLS 정책이 올바르게 설정되어 있어야 함 (`Supabase_RLS_설정.sql` 실행)

### 9. 리뷰가 저장되지 않음

**원인**: 
- `RecipeContext`의 `addReview`가 로컬 상태만 업데이트하고 DB에 저장하지 않음
- `ReviewContext`를 사용해야 함

**해결 방법**:

1. **ReviewContext 사용**: 리뷰는 `ReviewContext`의 `addReview`를 사용하여 DB에 저장
2. **24시간 제한**: 레시피는 등록 후 24시간 동안만 표시 (`loadRecipes`에서 필터링)

**구현 개념**:

```typescript
// ReviewContext.addReview (올바른 방법)
const addReview = async (recipeId: number, rating: number, comment: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("reviews").insert([{
    recipe_id: recipeId,
    user_id: user.id,
    rating,
    comment,
  }]);
  
  // DB 트리거가 자동으로 recipes.reviews_count 업데이트
};

// 24시간 제한
const RECIPE_TTL = 24 * 60 * 60 * 1000; // 24시간
const cutoffTime = new Date(Date.now() - RECIPE_TTL).toISOString();
const { data } = await supabase
  .from("recipes")
  .select("*")
  .gt("created_at", cutoffTime); // 24시간 이내 레시피만
```

**핵심 포인트**:
- 리뷰는 `ReviewContext`를 통해 관리
- DB 트리거가 `reviews_count`, `average_rating` 자동 업데이트
- 레시피는 24시간 TTL 적용

### 10. 로그아웃 후에도 반려견이 보임

**원인**: 로그아웃 시 `PetContext`의 상태가 초기화되지 않음

**해결 방법**:

1. **인증 상태 변경 감지**: `supabase.auth.onAuthStateChange()`로 로그아웃 감지
2. **상태 초기화**: 로그아웃 시 `pets` 배열을 빈 배열로 초기화

**구현 개념**:

```typescript
// PetContext에서
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      if (!session) {
        // 로그아웃 시 반려견 목록 초기화
        setPets([]);
      } else {
        // 로그인 시 반려견 목록 새로고침
        loadPets();
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

**핵심 포인트**:
- `onAuthStateChange`는 인증 상태 변경을 실시간으로 감지
- 로그아웃 시 즉시 상태 초기화하여 보안 강화
- 순환 참조 방지를 위해 `useAuth` 대신 직접 `supabase.auth` 사용

### 11. 로그아웃 상태에서도 반려견이 삭제됨

**원인**: `deletePet` 함수에서 로그인 체크가 없음

**해결 방법**:

1. **로그인 체크 추가**: 삭제 전에 현재 사용자 확인
2. **RLS 정책 활용**: `user_id` 조건 추가하여 자신의 반려견만 삭제 가능

**구현 개념**:

```typescript
const deletePet = async (id: number | string) => {
  // 로그인 체크
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    Alert.alert("오류", "로그인이 필요합니다.");
    return;
  }

  // 자신의 반려견만 삭제 가능 (RLS 정책)
  const { error } = await supabase
    .from("pets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // ← 핵심!

  if (error) {
    Alert.alert("오류", "삭제에 실패했습니다.");
    return;
  }

  // 로컬 상태 업데이트
  setPets((prev) => prev.filter((p) => p.id !== id));
};
```

**핵심 포인트**:
- 모든 데이터 변경 작업 전에 로그인 상태 확인
- RLS 정책과 코드 레벨 체크를 함께 사용 (이중 안전장치)
- 에러 발생 시 사용자에게 명확한 피드백 제공

### 12. 영양 정보가 정확하지 않음

**원인**: 
- 재료 파싱 오류
- 영양 정보 데이터베이스에 없는 재료
- 계산 후 반올림 처리 누락

**해결 방법**:

1. **재료 파싱 개선**: "재료명 양" 형식 파싱 (예: "닭가슴살 100g")
2. **영양 정보 DB 확장**: `nutritionDatabase.ts`에 재료 추가
3. **정확한 계산**: 100g 기준 영양 정보를 실제 양에 맞게 비율 계산
4. **반올림 처리**: 소수점 둘째 자리까지 반올림

**구현 개념**:

```typescript
// 재료 파싱 예시
parseIngredient("닭가슴살 100g") 
// → { name: "닭가슴살", amount: 100 }

// 영양 정보 계산
const nutritionPer100g = getNutritionInfo("닭가슴살");
// → { calories: 165, protein: 31, fat: 3.6, ... }

// 실제 양에 맞게 계산
const ratio = 100 / 100; // 1.0
const totalCalories = 165 * 1.0; // 165 kcal

// 반올림 처리
Math.round(totalCalories * 100) / 100; // 165.00
```

**핵심 포인트**:
- 재료명과 양을 정확히 파싱해야 함
- 100g 기준 데이터를 실제 양에 맞게 비율 계산
- 누락된 재료는 경고 메시지 표시하되 계산은 계속 진행

---

## 🔒 보안 고려사항

### 1. 환경 변수 관리

- `.env` 파일은 절대 Git에 커밋하지 마세요
- `.gitignore`에 `.env`가 포함되어 있는지 확인
- 팀원에게 환경 변수를 안전하게 공유 (Slack DM, 1Password 등)

### 2. Supabase Row Level Security (RLS)

**RLS란?**

Row Level Security (RLS)는 Supabase의 데이터베이스 보안 기능으로, 각 행(레코드)에 대한 접근 권한을 제어합니다. 사용자는 자신의 데이터만 볼 수 있고, 다른 사용자의 데이터는 접근할 수 없습니다.

**RLS 설정 방법**:

1. `Supabase_RLS_설정.sql` 파일을 Supabase SQL Editor에서 실행
2. 각 테이블별로 정책 확인:
   - `pets`: 자신의 반려견만 조회/수정/삭제 가능
   - `recipes`: 모든 사람이 조회 가능, 자신의 레시피만 수정/삭제 가능
   - `likes`: 모든 사람이 조회 가능, 자신의 찜만 추가/삭제 가능
   - `reviews`: 모든 사람이 조회 가능, 자신의 리뷰만 수정/삭제 가능

**RLS 정책 예시**:

```sql
-- 사용자는 자신의 반려견만 볼 수 있음
CREATE POLICY "Users can view own pets"
  ON pets FOR SELECT
  USING (auth.uid() = user_id);

-- 로그인한 사용자만 레시피 작성 가능
CREATE POLICY "Authenticated users can insert recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
```

**핵심 개념**:
- `auth.uid()`: 현재 로그인한 사용자의 ID
- `USING`: SELECT, UPDATE, DELETE 시 조건
- `WITH CHECK`: INSERT, UPDATE 시 조건
- RLS가 활성화되면 모든 쿼리가 자동으로 필터링됨

### 3. API 키 보호

- `anon` 키는 클라이언트에 노출되어도 안전 (RLS로 보호)
- `service_role` 키는 절대 클라이언트에 사용하지 마세요

### 4. HTTPS 통신

- Supabase는 기본적으로 HTTPS 사용
- 중간자 공격(MITM) 방지

### 5. 인증 상태 관리

**세션 관리**:
- `AsyncStorage`에 세션 자동 저장
- 앱 재시작 시 세션 자동 복원
- 토큰 만료 전 자동 갱신

**로그아웃 처리**:
- 로그아웃 시 모든 로컬 상태 초기화
- 세션 완전히 삭제
- 민감한 데이터 접근 불가능하도록 보장

---

## 🚀 프로덕션 배포 체크리스트

배포 전 확인사항:

- [ ] `.env` 파일이 Git에 커밋되지 않았는지 확인
- [ ] Supabase RLS 정책 설정 완료
- [ ] OAuth Redirect URI를 프로덕션 URL로 변경
- [ ] 앱 아이콘 및 스플래시 스크린 설정
- [ ] 앱 이름 및 번들 ID 설정 (`app.json`)
- [ ] 개인정보 처리방침 및 이용약관 페이지 작성
- [ ] 테스트 완료 (iOS, Android)
- [ ] 성능 최적화 확인

---

## 🎯 핵심 개념 정리

### 1. OAuth 인증 플로우

**문제**: 모바일 앱에서 웹 기반 OAuth 리다이렉트가 작동하지 않음

**해결**: `expo-web-browser`를 사용하여 브라우저에서 인증 처리

```
1. 사용자가 "구글 로그인" 버튼 클릭
2. signInWithOAuth() 호출 → OAuth URL 반환
3. WebBrowser.openAuthSessionAsync()로 브라우저 열기
4. 사용자가 구글에서 로그인 완료
5. 앱으로 리다이렉트 (dogchef://)
6. URL에서 access_token, refresh_token 추출
7. setSession()으로 세션 설정
8. 로그인 완료!
```

**핵심 포인트**:
- 모바일 앱은 웹과 달리 리다이렉트 URL을 직접 처리할 수 없음
- `expo-web-browser`가 브라우저와 앱 간의 브릿지 역할
- 앱 스킴(`dogchef://`)을 사용하여 앱으로 돌아옴

### 2. Row Level Security (RLS)

**문제**: 사용자가 다른 사용자의 데이터에 접근할 수 있음

**해결**: Supabase RLS 정책으로 데이터베이스 레벨에서 접근 제어

**동작 원리**:

```sql
-- 예시: pets 테이블 조회
SELECT * FROM pets;

-- RLS 정책이 자동으로 적용됨
SELECT * FROM pets WHERE auth.uid() = user_id;
-- ↑ 현재 로그인한 사용자의 데이터만 반환
```

**장점**:
- 코드에서 실수로 필터링을 빼먹어도 안전
- 데이터베이스 레벨에서 보안 보장
- SQL 쿼리 자동 변환

**주의사항**:
- RLS 정책이 없으면 모든 데이터 접근 가능 (보안 위험!)
- 모든 테이블에 RLS 활성화 필수
- 정책 테스트 필수

### 3. Context API를 통한 상태 관리

**문제**: 여러 화면에서 동일한 데이터를 사용해야 함

**해결**: Context API로 전역 상태 관리

**구조**:

```
App.tsx
  └── AuthProvider (인증 상태)
  └── PetProvider (반려견 데이터)
  └── RecipeProvider (레시피 데이터)
  └── ReviewProvider (리뷰 데이터)
       └── 모든 화면에서 useAuth(), usePet() 등으로 접근
```

**장점**:
- Props drilling 방지
- 중앙 집중식 상태 관리
- React 내장 기능으로 추가 라이브러리 불필요

**주의사항**:
- Context가 변경되면 모든 구독 컴포넌트 리렌더링
- 너무 많은 Context는 성능 저하 가능
- 필요한 범위만 Context로 관리

### 4. 인증 상태 변경 감지

**문제**: 로그아웃 시 관련 데이터가 초기화되지 않음

**해결**: `supabase.auth.onAuthStateChange()`로 실시간 감지

**동작 원리**:

```typescript
// 인증 상태 변경 감지
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // 로그아웃 시 모든 상태 초기화
    setPets([]);
    setRecipes([]);
  } else if (event === 'SIGNED_IN') {
    // 로그인 시 데이터 새로고침
    loadPets();
    loadRecipes();
  }
});
```

**이벤트 타입**:
- `SIGNED_IN`: 로그인
- `SIGNED_OUT`: 로그아웃
- `TOKEN_REFRESHED`: 토큰 갱신
- `USER_UPDATED`: 사용자 정보 업데이트

### 5. 영양 정보 자동 계산

**문제**: 사용자가 직접 영양 정보를 입력해야 함

**해결**: 재료 목록에서 자동으로 영양 정보 계산

**동작 원리**:

```
1. 재료 입력: ["닭가슴살 100g", "고구마 50g"]
2. 재료 파싱: { name: "닭가슴살", amount: 100 }, { name: "고구마", amount: 50 }
3. 영양 정보 조회: nutritionDatabase에서 각 재료의 100g당 영양 정보 가져오기
4. 비율 계산: 실제 양 / 100g
5. 합산: 모든 재료의 영양 정보 합산
6. 반올림: 소수점 둘째 자리까지 반올림
```

**예시**:

```
닭가슴살 100g:
  - 칼로리: 165 kcal
  - 단백질: 31g
  - 지방: 3.6g

고구마 50g:
  - 칼로리: 86 kcal (100g 기준) → 43 kcal (50g)
  - 단백질: 1.6g → 0.8g
  - 지방: 0.1g → 0.05g

합계:
  - 칼로리: 165 + 43 = 208 kcal
  - 단백질: 31 + 0.8 = 31.8g
  - 지방: 3.6 + 0.05 = 3.65g
```

**장점**:
- 사용자 편의성 향상
- 일관된 영양 정보 제공
- 재료 추가 시 자동 업데이트

### 6. 24시간 TTL (Time To Live)

**문제**: 오래된 레시피가 계속 표시됨

**해결**: 레시피 등록 후 24시간 동안만 표시

**구현**:

```typescript
const RECIPE_TTL = 24 * 60 * 60 * 1000; // 24시간 (밀리초)
const cutoffTime = new Date(Date.now() - RECIPE_TTL).toISOString();

// 24시간 이내 레시피만 조회
const { data } = await supabase
  .from("recipes")
  .select("*")
  .gt("created_at", cutoffTime);
```

**장점**:
- 신선한 정보 유지
- 데이터베이스 부하 감소
- 사용자 경험 향상

**확장 가능성**:
- 사용자 설정으로 TTL 조정 가능
- 인기 레시피는 TTL 연장
- 관리자 레시피는 영구 보존

---

## 📚 추가 개선 사항

### 추가 가능한 기능

1. **비밀번호 재설정**

   ```typescript
   const resetPassword = async (email: string) => {
     const { error } = await supabase.auth.resetPasswordForEmail(email);
   };
   ```

2. **프로필 사진 업로드**

   - Expo Image Picker 사용
   - Supabase Storage에 저장

3. **푸시 알림**

   - Expo Notifications 사용
   - 새 레시피, 댓글 알림

4. **다크 모드**

   - React Native Appearance API
   - 색상 테마 전환

5. **애플 로그인**

   ```typescript
   const signInWithApple = async () => {
     await supabase.auth.signInWithOAuth({ provider: "apple" });
   };
   ```

6. **생체 인증** (지문, Face ID)
   ```bash
   npm install expo-local-authentication
   ```

---

## 📖 참고 자료

- [Expo 문서](https://docs.expo.dev/)
- [React Navigation 문서](https://reactnavigation.org/)
- [Supabase 문서](https://supabase.com/docs)
- [Supabase Auth 가이드](https://supabase.com/docs/guides/auth)
- [React Native 공식 문서](https://reactnative.dev/)

---

## 📄 라이선스

이 프로젝트는 개인 프로젝트입니다.

---

## 👨‍💻 개발자

**멍슐랭 팀**

문의사항이 있으시면 이슈를 등록해주세요.

---

**Happy Coding! 🐕✨**
