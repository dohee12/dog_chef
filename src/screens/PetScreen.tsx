import PetCard from "@/components/PetCard";
import Colors from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { usePet } from "@/context/PetContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PetScreen({ navigation }: any) {
  const { user } = useAuth();
  const { pets, deletePet, loadPets } = usePet();
  const [refreshing, setRefreshing] = useState(false);

  // 화면에 포커스될 때마다 로그인 체크
  useFocusEffect(
    useCallback(() => {
      if (!user) {
        Alert.alert(
          "로그인 필요",
          "반려견 정보를 보려면 로그인이 필요합니다.",
          [
            {
              text: "로그인",
              onPress: () => navigation.navigate("Login"),
            },
            {
              text: "취소",
              style: "cancel",
            },
          ]
        );
      }
    }, [user, navigation])
  );

  const handleDeletePet = (id: number) => {
    Alert.alert("반려견 삭제", "정말로 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => deletePet(id),
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPets();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>내 반려견</Text>
        <Text style={styles.subtitle}>
          반려견 정보를 등록하고 맞춤 레시피를 추천받으세요
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {pets.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="paw" size={64} color="#52616D" />
            </View>
            <Text style={styles.emptyTitle}>등록된 반려견이 없습니다</Text>
            <Text style={styles.emptyText}>
              반려견 정보를 등록하고{"\n"}
              맞춤형 레시피를 추천받아보세요
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate("PetForm")}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>첫 반려견 등록하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onEdit={() => navigation.navigate("PetForm", { pet })}
                onDelete={() => handleDeletePet(Number(pet.id))}
              />
            ))}

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate("PetForm")}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>반려견 추가</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textDark,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.textLight,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textDark,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
  },
  bottomSpacer: {
    height: 20,
  },
});
