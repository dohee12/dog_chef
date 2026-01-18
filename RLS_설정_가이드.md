# 🔐 RLS (Row Level Security) 설정 가이드

## 📋 목차

1. [RLS란?](#rls란)
2. [단계별 설정 방법](#단계별-설정-방법)
3. [설정 확인](#설정-확인)
4. [문제 해결](#문제-해결)

---

## 🎯 RLS란?

**Row Level Security (RLS)**는 Supabase의 보안 기능으로, 각 행(레코드)에 대한 접근 권한을 제어합니다.

### 왜 필요한가?

```
❌ RLS 없음: 모든 사용자가 모든 데이터를 볼 수 있음 (보안 위험!)
✅ RLS 있음: 사용자는 자신의 데이터만 볼 수 있음 (안전!)
```

### 동작 원리

```sql
-- 예시: pets 테이블
SELECT * FROM pets WHERE auth.uid() = user_id;
-- ↑ 현재 로그인한 사용자(auth.uid())의 데이터만 조회
```

---

## 🚀 단계별 설정 방법

### Step 1: Supabase 대시보드 접속

1. https://supabase.com 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **"SQL Editor"** 클릭
4. **"New query"** 버튼 클릭

### Step 2: RLS 설정 SQL 실행

1. `Supabase_RLS_설정.sql` 파일 열기
2. **전체 내용 복사** (Ctrl+A → Ctrl+C)
3. Supabase SQL Editor에 **붙여넣기** (Ctrl+V)
4. **"Run"** 버튼 클릭 (또는 Ctrl+Enter)
5. **"Success"** 메시지 확인 ✅

### Step 3: 설정 확인

SQL 실행 후 맨 아래에 있는 확인 쿼리 결과를 확인:

```
✅ pets 테이블: 4개 정책 (SELECT, INSERT, UPDATE, DELETE)
✅ recipes 테이블: 4개 정책 (SELECT, INSERT, UPDATE, DELETE)
✅ likes 테이블: 3개 정책 (SELECT, INSERT, DELETE)
✅ reviews 테이블: 4개 정책 (SELECT, INSERT, UPDATE, DELETE)
```

---

## 🔍 설정 확인

### 방법 1: SQL Editor에서 확인

```sql
-- 모든 테이블의 RLS 정책 확인
SELECT 
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE tablename IN ('pets', 'recipes', 'likes', 'reviews')
ORDER BY tablename, cmd;
```

### 방법 2: UI에서 확인

1. **Database** → **Tables** 메뉴
2. 각 테이블 클릭 (pets, recipes, likes, reviews)
3. 상단에 **"RLS enabled"** 표시 확인 ✅

---

## 📊 각 테이블별 RLS 정책 설명

### 1. pets 테이블

| 작업 | 권한 | 설명 |
|------|------|------|
| SELECT | 자신의 반려견만 | `auth.uid() = user_id` |
| INSERT | 자신의 반려견만 | `auth.uid() = user_id` |
| UPDATE | 자신의 반려견만 | `auth.uid() = user_id` |
| DELETE | 자신의 반려견만 | `auth.uid() = user_id` |

**결과**: 사용자는 자신이 등록한 반려견만 볼 수 있고, 다른 사용자의 반려견은 볼 수 없습니다.

### 2. recipes 테이블

| 작업 | 권한 | 설명 |
|------|------|------|
| SELECT | 모든 사람 | `true` (공개) |
| INSERT | 로그인한 사용자만 | `auth.uid() = user_id` |
| UPDATE | 자신의 레시피만 | `auth.uid() = user_id` |
| DELETE | 자신의 레시피만 | `auth.uid() = user_id` |

**결과**: 모든 사람이 레시피를 볼 수 있지만, 수정/삭제는 작성자만 가능합니다.

### 3. likes 테이블

| 작업 | 권한 | 설명 |
|------|------|------|
| SELECT | 모든 사람 | `true` (통계용) |
| INSERT | 로그인한 사용자만 | `auth.uid() = user_id` |
| DELETE | 자신의 찜만 | `auth.uid() = user_id` |

**결과**: 모든 사람이 찜 수를 볼 수 있지만, 찜하기/취소는 본인만 가능합니다.

### 4. reviews 테이블

| 작업 | 권한 | 설명 |
|------|------|------|
| SELECT | 모든 사람 | `true` (공개) |
| INSERT | 로그인한 사용자만 | `auth.uid() = user_id` |
| UPDATE | 자신의 리뷰만 | `auth.uid() = user_id` |
| DELETE | 자신의 리뷰만 | `auth.uid() = user_id` |

**결과**: 모든 사람이 리뷰를 볼 수 있지만, 수정/삭제는 작성자만 가능합니다.

---

## 🐛 문제 해결

### Q1: "new row violates row-level security policy" 에러

**원인**: `user_id`가 제대로 설정되지 않았거나, RLS 정책이 없음

**해결**:

1. RLS 정책이 설정되었는지 확인:
```sql
SELECT * FROM pg_policies WHERE tablename = 'pets';
```

2. 코드에서 `user_id`가 제대로 설정되는지 확인:
```typescript
// PetContext.tsx에서
const { data: { user } } = await supabase.auth.getUser();
console.log("Current user ID:", user?.id); // 확인용

await supabase.from("pets").insert([{ 
  ...petData, 
  user_id: user.id // ← 이것이 중요!
}]);
```

### Q2: 다른 사용자의 데이터가 보여요

**원인**: RLS 정책이 제대로 설정되지 않았거나, 코드에서 필터링을 하지 않음

**해결**:

1. RLS 정책 재설정 (SQL 다시 실행)
2. 코드에서 명시적으로 필터링:
```typescript
.eq("user_id", user.id) // ← 이것 추가
```

### Q3: 레시피를 수정할 수 없어요

**원인**: 레시피의 `user_id`가 현재 로그인한 사용자와 일치하지 않음

**해결**:

1. 레시피의 `user_id` 확인:
```sql
SELECT id, title, user_id FROM recipes WHERE id = <레시피ID>;
```

2. 현재 로그인한 사용자 ID 확인:
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log("Current user:", user?.id);
```

### Q4: "permission denied" 에러

**원인**: 로그인하지 않았거나, `auth.uid()`가 null

**해결**:

1. 로그인 상태 확인:
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  console.error("User not logged in!");
  // 로그인 화면으로 이동
}
```

---

## ✅ 체크리스트

### RLS 설정

- [ ] Supabase SQL Editor에서 `Supabase_RLS_설정.sql` 실행
- [ ] "Success" 메시지 확인
- [ ] pets 테이블 RLS 정책 4개 확인
- [ ] recipes 테이블 RLS 정책 4개 확인
- [ ] likes 테이블 RLS 정책 3개 확인
- [ ] reviews 테이블 RLS 정책 4개 확인

### 코드 확인

- [ ] PetContext에서 `user_id` 자동 설정 확인
- [ ] RecipeContext에서 `user_id` 자동 설정 확인
- [ ] ReviewContext에서 `user_id` 자동 설정 확인

### 테스트

- [ ] 반려견 등록 성공
- [ ] 다른 기기에서 반려견 조회 성공
- [ ] 레시피 작성 성공
- [ ] 자신의 레시피만 수정/삭제 가능
- [ ] 찜하기 정상 작동
- [ ] 리뷰 작성 정상 작동

---

## 💡 핵심 포인트

### 1. RLS는 자동으로 작동합니다

코드에서 `user_id`만 제대로 설정하면, RLS가 자동으로 권한을 체크합니다.

```typescript
// ✅ 올바른 방법
await supabase.from("pets").insert([{ 
  ...petData, 
  user_id: user.id 
}]);
// RLS가 자동으로 auth.uid() === user_id를 체크
```

### 2. SELECT는 필터링이 필요합니다

RLS가 있어도, 코드에서 명시적으로 필터링하는 것이 좋습니다:

```typescript
// ✅ 좋은 방법 (이중 안전장치)
.eq("user_id", user.id)
```

### 3. 공개 데이터는 SELECT를 허용합니다

레시피와 리뷰는 모든 사람이 볼 수 있지만, 수정/삭제는 작성자만 가능합니다.

---

## 🎉 완료!

모든 설정이 완료되면:

```
✅ 반려견 등록: user_id 자동 설정
✅ 반려견 조회: 자신의 반려견만 표시
✅ 다른 기기: 같은 계정으로 동기화
✅ 레시피 작성: user_id 자동 설정
✅ 레시피 수정: 자신의 레시피만 수정 가능
✅ 찜하기: 각 사용자 독립적으로 저장
✅ 리뷰: 각 사용자 독립적으로 저장
✅ RLS 에러: 발생하지 않음
```

---

**문제가 계속되면 다음 정보와 함께 문의하세요:**

1. SQL Editor에서 `SELECT * FROM pg_policies WHERE tablename = '<테이블명>';` 결과
2. 터미널의 에러 로그
3. 현재 로그인한 사용자 ID: `supabase.auth.getUser()` 결과




