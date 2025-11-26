import PetFormScreen from "@/screens/PetFormScreen";
import RecipeDetailScreen from "@/screens/RecipeDetailScreen";
import RecipeFormScreen from "@/screens/RecipeFormScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import Colors from "../constants/Colors";
import TabNavigator from "./TabNavigator";

const stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
      }}
    >
      <stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ title: "레시피 상세", presentation: "modal" }}
      />
      <stack.Screen
        name="RecipeForm"
        component={RecipeFormScreen}
        options={{ title: "레시피 작성", presentation: "modal" }}
      />
      <stack.Screen
        name="PetForm"
        component={PetFormScreen}
        options={{ title: "반려견 정보 작성", presentation: "modal" }}
      />
    </stack.Navigator>
  );
}
