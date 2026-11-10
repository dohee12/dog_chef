// 멍슐랭 색 규칙 (디자인 B안 "클린 헬스"). 앱의 색은 전부 여기서 가져다 쓴다.
// 글자색 조합은 모두 대비 4.5:1 이상으로 맞췄다. 새 색이 필요하면 화면에 직접 적지 말고 여기에 추가.
const Colors = {
  // 메인: 짙은 청록. 흰 글자 7.33:1, 흰 바탕 위 글자로도 7.33:1
  primary: "#1D5C7A",
  primaryLight: "#E2EEF4", // 연한 청록 바탕 (선택 표시, 칩). 그 위 글자는 primaryDark
  primaryDark: "#123F55",

  // 배경: 페이지는 아주 옅은 회청색, 카드는 흰색
  background: "#F5F8FA",
  lightBackground: "#EEF3F6", // 입력칸, 회색 칩 바탕

  // 텍스트
  text: "#14212B",
  textLight: "#52616D", // 설명 글자. 흰 바탕 6.26:1
  textDark: "#14212B",
  textSecondary: "#52616D", // 예전 #999999 는 대비 2.85:1 로 부족했다
  textInvert: "#FFFFFF",

  // 테두리
  borderLight: "#DDE5EA",
  borderDark: "#B8C6CF",
  border: "#DDE5EA",

  // 카드 / 섹션 바탕
  card: "#FFFFFF",
  cardBackground: "#FFFFFF",
  sectionBackground: "#E2EEF4",

  // 안전 점수 (멍슐랭 신호)
  safety: "#1E6B4F",
  safetyBackground: "#E1F1EA",
  // 주의 재료 (갈색 글자, 바탕 위 대비 4.5:1 이상)
  caution: "#7A4F00",
  cautionBackground: "#FDF3DC",

  // 별점: 아이콘 전용. 글자엔 쓰지 않는다
  star: "#F5B400",

  // 경고(알러지) · 에러
  warningBackground: "#FDECEC",
  warningBorder: "#F3B8B8",
  warningText: "#B42318",
  error: "#B42318",

  // 탭 네비게이션
  tabActive: "#1D5C7A",
  tabInactive: "#52616D",

  // 영양 차트 (서로 밝기가 달라 색약이어도 구분된다)
  chart: ["#1D5C7A", "#3E8FB0", "#7CC0A0", "#B5C9D4"],
};

export default Colors;
