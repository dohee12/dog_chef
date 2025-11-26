import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import { PetProvider } from "./src/context/PetContext";
import { RecipeProvider } from "./src/context/RecipeContext";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <NavigationContainer>
      <RecipeProvider>
        <PetProvider>
          <RootNavigator />
        </PetProvider>
      </RecipeProvider>
    </NavigationContainer>
  );
}
