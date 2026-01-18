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

  // 초기 로드
  useEffect(() => {
    loadPets();
  }, []);

  // 인증 상태 변경 감지하여 반려견 목록 새로고침
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // 로그아웃 시 반려견 목록 초기화
      if (!session) {
        setPets([]);
      } else {
        // 로그인 시 반려견 목록 새로고침
        loadPets();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadPets = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // [중요] 로그인 안되어 있으면 목 데이터 사용
      if (!user) {
        console.log("로그인하지 않음. 목 데이터 사용");
        setPets(mockPets);
        return;
      }

      console.log("현재 사용자 ID:", user.id);

      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", user.id) // ✅ 내 반려견만 가져오기
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase 조회 에러:", error);
        throw error;
      }

      // [핵심] DB의 bigint ID를 숫자로 변환하여 타입 안정성 확보
      if (data) {
        console.log("조회된 반려견 수:", data.length);
        setPets(data.map((p) => ({ ...p, id: Number(p.id) })) as Pet[]);
      } else {
        setPets([]);
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
      // ✅ 현재 로그인한 사용자 ID 가져오기
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("오류", "로그인이 필요합니다.");
        return;
      }

      console.log("반려견 등록 - 사용자 ID:", user.id);

      // ✅ user_id를 현재 로그인한 사용자 ID로 설정
      const newPet = {
        ...petData,
        user_id: user.id, // 이것이 핵심!
      };

      const { data, error } = await supabase
        .from("pets")
        .insert([newPet])
        .select();

      if (error) {
        console.error("Supabase 삽입 에러:", error);

        // RLS 에러인 경우 상세 메시지
        if (error.code === "42501") {
          Alert.alert(
            "권한 오류",
            "Supabase RLS 정책이 설정되지 않았습니다.\n\n'Supabase_RLS_설정_가이드.md' 파일을 확인하세요."
          );
        } else {
          Alert.alert("오류", error.message);
        }
        return;
      }

      console.log("반려견 등록 성공:", data);
      Alert.alert("성공", "반려견이 등록되었습니다.");
      await loadPets(); // 목록 새로고침
    } catch (error: any) {
      console.error("추가 실패:", error);
      Alert.alert(
        "실패",
        "반려견 등록 중 오류가 발생했습니다.\n\n" + error.message
      );
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
      // 로그인 체크
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("오류", "로그인이 필요합니다.");
        return;
      }

      const { error } = await supabase
        .from("pets")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id); // 자신의 반려견만 삭제 가능

      if (error) {
        console.error("삭제 실패:", error);
        Alert.alert("오류", "반려견 삭제에 실패했습니다.");
        return;
      }

      setPets((prev) => prev.filter((p) => p.id !== id));
      Alert.alert("성공", "반려견이 삭제되었습니다.");
    } catch (error: any) {
      console.error("삭제 실패:", error);
      Alert.alert("오류", "반려견 삭제 중 오류가 발생했습니다.");
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
