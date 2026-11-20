import {
  createNavigationContainerRef,
  NavigationContainer,
} from "@react-navigation/native";
import React from "react";
// 기존 앱 (백엔드 연동 화면). 지금은 App.tsx 가 v12 목업 화면(src/v12)을 띄운다.
import WebShell from "./src/components/WebShell";
import { AuthProvider } from "./src/context/AuthContext";
import { PetProvider } from "./src/context/PetContext";
import { RecipeProvider } from "./src/context/RecipeContext";
import { ReviewProvider } from "./src/context/ReviewContext";
import RootNavigator from "./src/navigation/RootNavigator";

// PC 웹 왼쪽 검색창에서 검색 화면으로 이동할 때 쓴다
const navigationRef = createNavigationContainerRef<any>();

export default function App() {
  return (
    <WebShell navigationRef={navigationRef}>
      <NavigationContainer ref={navigationRef}>
        <AuthProvider>
          <RecipeProvider>
            <ReviewProvider>
              <PetProvider>
                <RootNavigator />
              </PetProvider>
            </ReviewProvider>
          </RecipeProvider>
        </AuthProvider>
      </NavigationContainer>
    </WebShell>
  );
}
