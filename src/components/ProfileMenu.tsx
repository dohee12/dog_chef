import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors from "../constants/Colors";

export default function ProfileMenu() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<any>();
  const [showMenu, setShowMenu] = useState(false);

  // 로그인하지 않은 경우 로그인 버튼 표시
  if (!user) {
    return (
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => navigation.navigate("Login")}
        activeOpacity={0.7}
      >
        <Ionicons name="log-in-outline" size={24} color={Colors.primary} />
        <Text style={styles.loginButtonText}>로그인</Text>
      </TouchableOpacity>
    );
  }

  // 로그인한 경우 프로필 아이콘 표시
  return (
    <View>
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => setShowMenu(true)}
        activeOpacity={0.7}
      >
        <View style={styles.profileIconContainer}>
          <Ionicons name="person" size={20} color="#fff" />
        </View>
      </TouchableOpacity>

      {/* 프로필 메뉴 모달 */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            {/* 사용자 정보 */}
            <View style={styles.userInfoSection}>
              <View style={styles.profileIconLarge}>
                <Ionicons name="person" size={32} color="#fff" />
              </View>
              <View style={styles.userTextContainer}>
                <Text style={styles.userName}>
                  {user.email?.split("@")[0] || "사용자"}
                </Text>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
            </View>

            {/* 구분선 */}
            <View style={styles.divider} />

            {/* 메뉴 항목들 */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                // TODO: 프로필 화면으로 이동
              }}
            >
              <Ionicons
                name="person-circle-outline"
                size={22}
                color={Colors.text}
              />
              <Text style={styles.menuItemText}>프로필 설정</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                navigation.navigate("MainTabs", { screen: "Pet" });
              }}
            >
              <Ionicons name="paw-outline" size={22} color={Colors.text} />
              <Text style={styles.menuItemText}>내 반려견</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                navigation.navigate("MainTabs", { screen: "Favorites" });
              }}
            >
              <Ionicons name="heart-outline" size={22} color={Colors.text} />
              <Text style={styles.menuItemText}>찜한 레시피</Text>
            </TouchableOpacity>

            {/* 구분선 */}
            <View style={styles.divider} />

            {/* 로그아웃 */}
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={() => {
                setShowMenu(false);
                signOut();
              }}
            >
              <Ionicons name="log-out-outline" size={22} color="#B42318" />
              <Text style={[styles.menuItemText, styles.logoutText]}>
                로그아웃
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // 로그인 버튼 (비로그인 상태)
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 6,
  },
  loginButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  // 프로필 버튼 (로그인 상태)
  profileButton: {
    padding: 4,
  },
  profileIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 16,
  },
  menuContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    width: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },

  // 사용자 정보 섹션
  userInfoSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: Colors.sectionBackground,
  },
  profileIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  userTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // 구분선
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },

  // 메뉴 항목
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "500",
  },

  // 로그아웃
  logoutItem: {
    backgroundColor: "#FDECEC",
  },
  logoutText: {
    color: "#B42318",
    fontWeight: "600",
  },
});
