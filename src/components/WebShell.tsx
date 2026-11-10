import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainerRefWithCurrent } from "@react-navigation/native";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

// 앱 칸의 폭. 휴대폰 화면 크기 정도로 고정한다.
const APP_WIDTH = 480;
// 이 폭보다 좁으면(휴대폰, 작은 태블릿) 틀 없이 앱을 화면 전체에 그대로 띄운다.
const FRAME_FROM = 768;
// 이 폭 이상이면 왼쪽에 소개·검색 영역을 함께 보여 준다.
const SIDE_FROM = 1100;

const POINTS = [
  // 사실인 기능만 적는다. 안전 점수 계산은 아직 없어서 "안전 확인" 같은 문구는 쓰지 않는다.
  { icon: "search-outline", text: "냉장고 속 재료 이름으로 레시피 찾기" },
  { icon: "paw-outline", text: "반려견 알러지 재료는 자동으로 걸러요" },
  { icon: "nutrition-outline", text: "칼로리·단백질 같은 영양 정보를 함께" },
] as const;

type Props = {
  children: React.ReactNode;
  navigationRef: NavigationContainerRefWithCurrent<any>;
};

/**
 * PC 웹에서 앱을 가운데 모바일 폭으로 보여 주는 틀.
 * 화면들은 휴대폰 기준으로 만들어져 있어서, 넓은 창에 늘리지 않고 이 칸 안에 띄운다.
 * 네이티브 앱과 좁은 웹 화면에서는 아무것도 감싸지 않는다.
 */
export default function WebShell({ children, navigationRef }: Props) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");

  if (Platform.OS !== "web" || width < FRAME_FROM) return <>{children}</>;

  const search = () => {
    const q = query.trim();
    if (!q || !navigationRef.isReady()) return;
    navigationRef.navigate("MainTabs", { screen: "Search", params: { q } });
  };

  return (
    <View style={styles.page}>
      {width >= SIDE_FROM && (
        <View style={styles.side}>
          <View style={styles.sideInner}>
            <View style={styles.logoRow}>
              <View style={styles.logoMark}>
                <Ionicons name="paw" size={22} color={Colors.textInvert} />
              </View>
              <Text style={styles.logoText}>멍슐랭</Text>
            </View>

            <Text style={styles.headline} accessibilityRole="header">
              안심하고 먹이는{"\n"}강아지 집밥 레시피
            </Text>

            <View style={styles.searchBox}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={search}
                placeholder="재료나 레시피 이름으로 찾기"
                placeholderTextColor={Colors.textLight}
                accessibilityLabel="레시피 검색"
                style={styles.searchInput}
              />
              <Pressable
                onPress={search}
                accessibilityRole="button"
                accessibilityLabel="검색"
                style={styles.searchButton}
              >
                <Ionicons name="search" size={22} color={Colors.textInvert} />
              </Pressable>
            </View>

            <View style={styles.points}>
              {POINTS.map((p) => (
                <View key={p.text} style={styles.point}>
                  <Ionicons name={p.icon} size={20} color={Colors.primary} />
                  <Text style={styles.pointText}>{p.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      <View style={styles.app}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: Colors.sectionBackground,
  },
  side: {
    width: APP_WIDTH,
    marginRight: 64,
    justifyContent: "center",
  },
  sideInner: {
    gap: 28,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.text,
  },
  headline: {
    fontSize: 40,
    lineHeight: 54,
    fontWeight: "800",
    color: Colors.text,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingLeft: 18,
    paddingRight: 6,
    height: 60,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    height: "100%",
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  points: {
    gap: 14,
  },
  point: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pointText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  app: {
    width: APP_WIDTH,
    backgroundColor: Colors.background,
    overflow: "hidden",
    // 웹에서만 쓰는 그림자 (칸 경계를 보여 준다)
    boxShadow: "0 0 24px rgba(20, 33, 43, 0.12)",
  } as any,
});
