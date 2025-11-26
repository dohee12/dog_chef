import Colors from "@/constants/Colors";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const categories = [
  { name: '전체', icon: 'apps' as const },
  { name: '주식', icon: 'restaurant' as const },
  { name: '간식', icon: 'fast-food' as const },
  { name: '건강식', icon: 'heart' as const },
  { name: '특별식', icon: 'gift' as const }
];

interface Props {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.lightBackground,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  activeTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  text: {
    color: Colors.text,
    fontSize: 14,
    marginLeft: 4,
  },
  activeText: {
    color: "#fff",
    fontWeight: "700",
  },
});

export default function CategoryTabs({ activeCategory, onCategoryChange }: Props) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={styles.container}
    >
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.name}
          onPress={() => onCategoryChange(cat.name)}
          style={[styles.tab, activeCategory === cat.name && styles.activeTab]}
        >
          <Ionicons 
            name={cat.icon} 
            size={16} 
            color={activeCategory === cat.name ? "white" : Colors.text} 
          />
          <Text style={[styles.text, activeCategory === cat.name && styles.activeText]}>
            {cat.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
