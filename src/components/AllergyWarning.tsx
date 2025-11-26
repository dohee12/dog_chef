import Colors from "@/constants/Colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  allergicIngredients: string[];
  affectedPets: string[];
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.warningBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 10,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    color: Colors.warningText,
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 4,
  },
  text: {
    color: Colors.textDark,
    fontSize: 13,
    lineHeight: 18,
  },
  highlight: {
    fontWeight: "bold",
    color: Colors.warningText,
  }
});

export default function AllergyWarning({ allergicIngredients, affectedPets }: Props) {
  if (allergicIngredients.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="warning" size={24} color={Colors.warningText} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>알러지 주의</Text>
        <Text style={styles.text}>
          <Text style={styles.highlight}>{affectedPets.join(", ")}</Text>에게 알러지를 유발할 수 있는 재료가 포함되어 있습니다:{"\n"}
          <Text style={styles.highlight}>{allergicIngredients.join(", ")}</Text>
        </Text>
      </View>
    </View>
  );
}
