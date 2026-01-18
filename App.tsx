import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import { AuthProvider } from "./src/context/AuthContext";
import { PetProvider } from "./src/context/PetContext";
import { RecipeProvider } from "./src/context/RecipeContext";
import { ReviewProvider } from "./src/context/ReviewContext";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <NavigationContainer>
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
  );
}
