import { ApiError, api, getCurrentUser, onAuthChange, toRemoteImage } from "@/lib/api";
import { notify } from "@/lib/dialog";
import { Pet } from "@/types/Pet";
import { mockPets } from "@/utils/mockData";
import React, { createContext, useContext, useEffect, useState } from "react";

interface PetContextType {
  pets: Pet[];
  loading: boolean;
  addPet: (pet: Omit<Pet, "id">) => Promise<void>;
  updatePet: (pet: Pet) => Promise<void>;
  deletePet: (id: number | string) => Promise<void>;
  loadPets: () => Promise<void>;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : String(error);

export const PetProvider = ({ children }: { children: React.ReactNode }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);

  // 처음 한 번 + 로그인/로그아웃 때마다 다시 불러온다
  useEffect(() => {
    loadPets();
    return onAuthChange(() => {
      loadPets();
    });
  }, []);

  const loadPets = async () => {
    // 로그인 전에는 둘러보기용 예시 데이터를 보여준다
    if (!getCurrentUser()) {
      setPets(mockPets);
      return;
    }
    setLoading(true);
    try {
      setPets(await api.get<Pet[]>("/pets"));
    } catch (error) {
      console.error("반려견 로드 실패:", error);
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  const addPet = async (petData: Omit<Pet, "id">) => {
    if (!getCurrentUser()) {
      notify("오류", "로그인이 필요합니다.");
      return;
    }
    try {
      // user_id 는 서버가 로그인 정보로 채운다 (보내도 무시됨)
      await api.post("/pets", { ...petData, image: await toRemoteImage(petData.image) });
      notify("성공", "반려견이 등록되었습니다.");
      await loadPets();
    } catch (error) {
      console.error("반려견 등록 실패:", error);
      notify("실패", "반려견 등록 중 오류가 발생했습니다.\n\n" + errorMessage(error));
    }
  };

  const updatePet = async (updatedPet: Pet) => {
    try {
      const { id, ...data } = updatedPet;
      await api.patch(`/pets/${id}`, { ...data, image: await toRemoteImage(data.image) });
      await loadPets();
    } catch (error) {
      console.error("반려견 수정 실패:", error);
      notify("실패", "반려견 수정에 실패했습니다.\n\n" + errorMessage(error));
    }
  };

  const deletePet = async (id: number | string) => {
    if (!getCurrentUser()) {
      notify("오류", "로그인이 필요합니다.");
      return;
    }
    try {
      await api.delete(`/pets/${id}`);
      setPets((prev) => prev.filter((p) => p.id !== id));
      notify("성공", "반려견이 삭제되었습니다.");
    } catch (error) {
      console.error("반려견 삭제 실패:", error);
      notify("오류", "반려견 삭제에 실패했습니다.\n\n" + errorMessage(error));
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
