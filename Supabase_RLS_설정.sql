-- ===================================
-- 멍슐랭 RLS (Row Level Security) 설정
-- ===================================
-- 이 파일을 Supabase SQL Editor에서 실행하세요
-- ===================================

-- ===================================
-- 1. pets 테이블 RLS 설정
-- ===================================

-- RLS 활성화
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (재설정 시)
DROP POLICY IF EXISTS "Users can view own pets" ON pets;
DROP POLICY IF EXISTS "Users can insert own pets" ON pets;
DROP POLICY IF EXISTS "Users can update own pets" ON pets;
DROP POLICY IF EXISTS "Users can delete own pets" ON pets;

-- SELECT: 자신의 반려견만 조회
CREATE POLICY "Users can view own pets"
ON pets FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: 자신의 반려견만 추가
CREATE POLICY "Users can insert own pets"
ON pets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: 자신의 반려견만 수정
CREATE POLICY "Users can update own pets"
ON pets FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: 자신의 반려견만 삭제
CREATE POLICY "Users can delete own pets"
ON pets FOR DELETE
USING (auth.uid() = user_id);

-- ===================================
-- 2. recipes 테이블 RLS 설정
-- ===================================

-- RLS 활성화
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (재설정 시)
DROP POLICY IF EXISTS "Anyone can view recipes" ON recipes;
DROP POLICY IF EXISTS "Authenticated users can insert recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete own recipes" ON recipes;

-- SELECT: 모든 사람이 레시피 조회 가능 (공개)
CREATE POLICY "Anyone can view recipes"
ON recipes FOR SELECT
USING (true);

-- INSERT: 로그인한 사용자만 레시피 작성 가능
CREATE POLICY "Authenticated users can insert recipes"
ON recipes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- UPDATE: 자신의 레시피만 수정 가능
CREATE POLICY "Users can update own recipes"
ON recipes FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: 자신의 레시피만 삭제 가능
CREATE POLICY "Users can delete own recipes"
ON recipes FOR DELETE
USING (auth.uid() = user_id);

-- ===================================
-- 3. likes 테이블 RLS 설정
-- ===================================

-- RLS 활성화
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (재설정 시)
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
DROP POLICY IF EXISTS "Authenticated users can like recipes" ON likes;
DROP POLICY IF EXISTS "Users can unlike own likes" ON likes;

-- SELECT: 모든 사람이 찜 수 조회 가능 (통계용)
CREATE POLICY "Anyone can view likes"
ON likes FOR SELECT
USING (true);

-- INSERT: 로그인한 사용자만 찜하기 가능
CREATE POLICY "Authenticated users can like recipes"
ON likes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- DELETE: 자신의 찜만 취소 가능
CREATE POLICY "Users can unlike own likes"
ON likes FOR DELETE
USING (auth.uid() = user_id);

-- ===================================
-- 4. reviews 테이블 RLS 설정
-- ===================================

-- RLS 활성화
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (재설정 시)
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;

-- SELECT: 모든 사람이 리뷰 조회 가능 (공개)
CREATE POLICY "Anyone can view reviews"
ON reviews FOR SELECT
USING (true);

-- INSERT: 로그인한 사용자만 리뷰 작성 가능
CREATE POLICY "Authenticated users can create reviews"
ON reviews FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- UPDATE: 자신의 리뷰만 수정 가능
CREATE POLICY "Users can update own reviews"
ON reviews FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: 자신의 리뷰만 삭제 가능
CREATE POLICY "Users can delete own reviews"
ON reviews FOR DELETE
USING (auth.uid() = user_id);

-- ===================================
-- 설정 완료 확인 쿼리
-- ===================================

-- 모든 테이블의 RLS 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename IN ('pets', 'recipes', 'likes', 'reviews')
ORDER BY tablename, cmd;




