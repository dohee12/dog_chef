import { useAuth } from "@/context/AuthContext";
import LoginScreen from "@/screens/LoginScreen";
import PetFormScreen from "@/screens/PetFormScreen";
import RecipeDetailScreen from "@/screens/RecipeDetailScreen";
import RecipeFormScreen from "@/screens/RecipeFormScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import Colors from "../constants/Colors";
import TabNavigator from "./TabNavigator";

const stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { initializing } = useAuth();

  // 저장된 로그인 확인 중일 때만 표시. 로그인 버튼을 누를 때마다 화면 전체가
  // 다시 만들어지지 않도록 loading 이 아니라 initializing 을 본다.
  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors.background,
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
      }}
    >
      {/* 로그인 여부와 관계없이 모든 화면 접근 가능 */}
      <stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: "로그인",
          presentation: "modal",
          headerShown: false,
        }}
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
