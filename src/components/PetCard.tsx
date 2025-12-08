import Colors from "@/constants/Colors";
import { Pet } from "@/types/Pet";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  pet: Pet;
  onEdit: () => void;
  onDelete: () => void;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.lightBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    overflow: "hidden",
  },
  petImage: {
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textDark,
    marginRight: 8,
  },
  genderIcon: {
    marginLeft: 2,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 2,
  },
  allergyText: {
    fontSize: 12,
    color: Colors.warningText,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default function PetCard({ pet, onEdit, onDelete }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {pet.image ? (
          <Image
            source={{ uri: pet.image }}
            style={styles.petImage}
            contentFit="cover"
          />
        ) : (
          <Ionicons name="paw" size={30} color={Colors.textLight} />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{pet.name}</Text>
          <Ionicons
            name={pet.gender === "male" ? "male" : "female"}
            size={16}
            color={pet.gender === "male" ? "#3b82f6" : "#ec4899"}
          />
        </View>
        <Text style={styles.detailText}>
          {pet.breed} · {pet.age}살
        </Text>
        <Text style={styles.detailText}>
          {pet.weight}kg · {pet.isNeutered ? "중성화 완료" : "중성화 전"}
        </Text>
        {pet.allergies.length > 0 && (
          <Text style={styles.allergyText} numberOfLines={1}>
            ⚠️ 알러지: {pet.allergies.join(", ")}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={20} color={Colors.textLight} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color={Colors.warningText} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
