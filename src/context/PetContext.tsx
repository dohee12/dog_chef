import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pet } from "@/types/Pet";
import { mockPets } from "@/utils/mockData";

interface PetContextType {
  pets: Pet[];
  addPet: (pet: Omit<Pet, "id">) => void;
  updatePet: (pet: Pet) => void;
  deletePet: (id: number) => void;
  loadPets: () => Promise<void>;
}

const PetContext = createContext<PetContextType>({
  pets: [],
  addPet: () => {},
  updatePet: () => {},
  deletePet: () => {},
  loadPets: async () => {},
});

export const PetProvider = ({ children }: { children: React.ReactNode }) => {
  const [pets, setPets] = useState<Pet[]>([]);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      const storedPets = await AsyncStorage.getItem("pets");
      if (storedPets) {
        // 저장된 데이터 사용
        setPets(JSON.parse(storedPets));
      } else {
        // 초기값 사용 및 저장
        setPets(mockPets); 
        await AsyncStorage.setItem("pets", JSON.stringify(mockPets));
      }
    } catch (error) {
      console.error("Failed to load pets", error);
      // 에러 시 mock data
      setPets(mockPets);
    }
  };

  const savePets = async (newPets: Pet[]) => {
    setPets(newPets);
    try {
      await AsyncStorage.setItem("pets", JSON.stringify(newPets));
    } catch (error) {
      console.error("Failed to save pets", error);
    }
  };

  const addPet = (petData: Omit<Pet, "id">) => {
    const newId =
      pets.length > 0 ? Math.max(...pets.map((p) => p.id)) + 1 : 1;
    const newPet: Pet = { ...petData, id: newId };
    // 최신 등록한 펫을 맨 앞에 추가
    savePets([newPet, ...pets]);
  };

  const updatePet = (updatedPet: Pet) => {
    const newPets = pets.map((pet) =>
      pet.id === updatedPet.id ? updatedPet : pet
    );
    savePets(newPets);
  };

  const deletePet = (id: number) => {
    const newPets = pets.filter((pet) => pet.id !== id);
    savePets(newPets);
  };

  return (
    <PetContext.Provider value={{ pets, addPet, updatePet, deletePet, loadPets }}>
      {children}
    </PetContext.Provider>
  );
};

export const usePet = () => useContext(PetContext);
