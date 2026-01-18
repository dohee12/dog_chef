import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors from "../constants/Colors";

export default function LoginPromptBanner() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  // 로그인된 경우 배너를 표시하지 않음
  if (user) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={() => navigation.navigate("Login")}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="paw" size={24} color={Colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>로그인하고 더 많은 기능을 사용하세요!</Text>
        <Text style={styles.subtitle}>
          • 반려견 맞춤 레시피 추천 • 레시피 작성 및 찜하기
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.sectionBackground,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});

