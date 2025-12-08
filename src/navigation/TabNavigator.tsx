import FavoritesScreen from "@/screens/FavoritesScreen";
import HomeScreen from "@/screens/HomeScreen";
import PetScreen from "@/screens/PetScreen";
import SearchScreen from "@/screens/SearchScreen";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import Colors from "../constants/Colors";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.borderLight,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Search") {
            iconName = focused ? "search" : "search-outline";
          } else if (route.name === "Favorites") {
            iconName = focused ? "heart" : "heart-outline";
          } else if (route.name === "Pet") {
            iconName = focused ? "paw" : "paw-outline";
          } else {
            iconName = "help";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "홈" }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: "검색" }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: "찜" }}
      />
      <Tab.Screen
        name="Pet"
        component={PetScreen}
        options={{ title: "반려견" }}
      />
    </Tab.Navigator>
  );
}
