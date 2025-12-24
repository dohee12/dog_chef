import { supabase } from "@/lib/supabase";
import { Pet } from "@/types/Pet";
import { mockPets } from "@/utils/mockData";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";

interface PetContextType {
  pets: Pet[];
  loading: boolean;
  addPet: (pet: Omit<Pet, "id">) => Promise<void>;
  updatePet: (pet: Pet) => Promise<void>;
  deletePet: (id: number | string) => Promise<void>;
  loadPets: () => Promise<void>;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

export const PetProvider = ({ children }: { children: React.ReactNode }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // [중요] 로그인 안되어 있으면 목록 비움 (보안)
      if (!user) {
        setPets([]);
        return;
      }

      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", user.id) // 내 강아지만 가져오기
        .order("created_at", { ascending: false });

      if (error) throw error;

      // [핵심] DB의 bigint ID를 숫자로 변환하여 타입 안정성 확보
      if (data) {
        setPets(data.map((p) => ({ ...p, id: Number(p.id) })) as Pet[]);
      }
    } catch (error) {
      console.error("반려견 로드 실패:", error);
      setPets(mockPets);
    } finally {
      setLoading(false);
    }
  };

  const addPet = async (petData: Omit<Pet, "id">) => {
    try {
      const { error } = await supabase.from("pets").insert([petData]);
      if (error) throw error;
      await loadPets(); // 목록 새로고침
    } catch (error) {
      console.error("추가 실패:", error);
      Alert.alert("실패", "반려견 등록 중 오류가 발생했습니다.");
    }
  };

  const updatePet = async (updatedPet: Pet) => {
    try {
      const { error } = await supabase
        .from("pets")
        .update(updatedPet)
        .eq("id", updatedPet.id);

      if (error) throw error;
      await loadPets();
    } catch (error) {
      console.error("수정 실패:", error);
    }
  };

  const deletePet = async (id: number | string) => {
    try {
      const { error } = await supabase.from("pets").delete().eq("id", id);
      if (error) throw error;
      setPets((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("삭제 실패:", error);
    }
  };

  return (
    <PetContext.Provider
      value={{ pets, loading, addPet, updatePet, deletePet, loadPets }}
    >
      {children}
    </PetContext.Provider>
  );
};

export const usePet = () => {
  const context = useContext(PetContext);
  if (!context) throw new Error("usePet은 PetProvider 안에서 사용해야 합니다.");
  return context;
};
