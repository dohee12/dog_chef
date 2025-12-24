import IngredientSelector from "@/components/IngredientSelector";
import Colors from "@/constants/Colors";
import { usePet } from "@/context/PetContext";
import { Pet } from "@/types/Pet";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";

const breedList = [
  "골든 리트리버",
  "그레이하운드",
  "닥스훈트",
  "도베르만",
  "래브라도 리트리버",
  "말티즈",
  "믹스견",
  "비글",
  "비숑 프리제",
  "사모예드",
  "샤페이",
  "셰퍼드",
  "시바견",
  "시베리안 허스키",
  "시츄",
  "웰시코기",
  "요크셔테리어",
  "재패니즈 스피츠",
  "저먼 셰퍼드",
  "진돗개",
  "차우차우",
  "치와와",
  "코카 스파니엘",
  "포메라니안",
  "푸들",
  "프렌치 불독",
];

export default function PetFormScreen({ navigation, route }: any) {
  const initialData = route.params?.pet as Pet;
  const { addPet, updatePet } = usePet();

  // [수정] user_id 속성 추가 (Type Error 해결)
  const [formData, setFormData] = useState<Omit<Pet, "id">>({
    user_id: "anonymous_user",
    device_id: "user_mobile_device",
    name: "",
    breed: "",
    age: 0,
    weight: 0,
    allergies: [],
    health_conditions: [],
    birth_date: "",
    gender: "male",
    is_neutered: false,
    image: "",
  });

  const [weightInput, setWeightInput] = useState("");
  const [showBreedList, setShowBreedList] = useState(false);
  const [breedSearch, setBreedSearch] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [healthInput, setHealthInput] = useState("");
  const [showAllergySheet, setShowAllergySheet] = useState(false);

  useEffect(() => {
    if (initialData) {
      const { id, ...rest } = initialData;
      setFormData(rest);
      setWeightInput(rest.weight.toString());
    }
  }, [initialData]);

  const calculateAge = (birth_date: string) => {
    if (!birth_date) return 0;
    const today = new Date();
    const birth = new Date(birth_date);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  useEffect(() => {
    if (formData.birth_date) {
      const age = calculateAge(formData.birth_date);
      setFormData((prev) => ({ ...prev, age }));
    }
  }, [formData.birth_date]);

  const filteredBreeds = breedList.filter((b) => b.includes(breedSearch));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setFormData({ ...formData, image: result.assets[0].uri });
    }
  };

  const handleToggleAllergy = (allergy: string) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter((a) => a !== allergy)
        : [...prev.allergies, allergy],
    }));
  };

  const handleAddHealth = () => {
    if (healthInput.trim()) {
      setFormData({
        ...formData,
        health_conditions: [...formData.health_conditions, healthInput.trim()],
      });
      setHealthInput("");
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setFormData({
      ...formData,
      allergies: formData.allergies.filter((_, i) => i !== index),
    });
  };

  const handleRemoveHealth = (index: number) => {
    setFormData({
      ...formData,
      health_conditions: formData.health_conditions.filter(
        (_, i) => i !== index
      ),
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("오류", "반려견 이름을 입력해주세요.");
      return;
    }
    if (!formData.breed) {
      Alert.alert("오류", "견종을 선택해주세요.");
      return;
    }

    // [중요 수정] SQL 스키마 컬럼명에 정확히 맞춘 데이터 구성 (PGRST204 에러 방지)
    const petDataForDB = {
      user_id: formData.user_id,
      name: formData.name,
      breed: formData.breed,
      age: formData.age,
      weight: parseFloat(weightInput) || 0,
      gender: formData.gender,
      is_neutered: formData.is_neutered, // [DB 컬럼명] is_neutered
      image: formData.image,
      allergies: formData.allergies,
      health_conditions: formData.health_conditions, // [DB 컬럼명] health_conditions
      birth_date: formData.birth_date, // [DB 컬럼명]
      device_id: "user_mobile_device", // [필수 필드] NOT NULL 해결
    };

    try {
      if (initialData) {
        // id를 숫자로 강제 변환하여 업데이트
        await updatePet({ ...petDataForDB, id: Number(initialData.id) } as any);
      } else {
        await addPet(petDataForDB as any);
      }
      navigation.goBack();
    } catch (error: any) {
      console.error("저장 실패 상세:", error.message);
      Alert.alert(
        "실패",
        "데이터베이스 저장에 실패했습니다. 컬럼명을 확인하세요."
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView style={styles.content}>
          <View style={styles.imageSection}>
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              {formData.image ? (
                <Image
                  source={{ uri: formData.image }}
                  style={styles.profileImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={32} color={Colors.textLight} />
                  <Text style={styles.imagePlaceholderText}>사진 추가</Text>
                </View>
              )}
              <View style={styles.editIconBadge}>
                <Ionicons name="pencil" size={12} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>이름 *</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 뭉치"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>견종 *</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowBreedList(true)}
            >
              <Text
                style={formData.breed ? styles.inputText : styles.placeholder}
              >
                {formData.breed || "견종 선택"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>생년월일</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                style={
                  formData.birth_date ? styles.inputText : styles.placeholder
                }
              >
                {formData.birth_date || "날짜 선택"}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>체중 (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="5"
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>성별</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  formData.gender === "male" && styles.radioButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, gender: "male" })}
              >
                <Text
                  style={[
                    styles.radioButtonText,
                    formData.gender === "male" && styles.radioButtonTextActive,
                  ]}
                >
                  남아
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  formData.gender === "female" && styles.radioButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, gender: "female" })}
              >
                <Text
                  style={[
                    styles.radioButtonText,
                    formData.gender === "female" &&
                      styles.radioButtonTextActive,
                  ]}
                >
                  여아
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.switchContainer}>
              <Text style={styles.label}>중성화 여부</Text>
              <Switch
                value={formData.is_neutered}
                onValueChange={(value) =>
                  setFormData({ ...formData, is_neutered: value })
                }
                trackColor={{ false: "#d1d5db", true: Colors.primaryLight }}
                thumbColor={formData.is_neutered ? Colors.primary : "#f3f4f6"}
              />
            </View>
          </View>

          {/* 알러지 및 건강상태 섹션 동일 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>알러지 (재료 선택)</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowAllergySheet(true)}
            >
              <Text style={styles.selectButtonText}>알러지 재료 선택하기</Text>
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={Colors.primary}
              />
            </TouchableOpacity>
            <View style={styles.tagContainer}>
              {formData.allergies.map((allergy, index) => (
                <View key={index} style={[styles.tagChip, styles.allergyChip]}>
                  <Text style={styles.allergyChipText}>{allergy}</Text>
                  <TouchableOpacity onPress={() => handleRemoveAllergy(index)}>
                    <Ionicons name="close-circle" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>건강 상태</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="예: 슬개골 탈구"
                value={healthInput}
                onChangeText={setHealthInput}
                onSubmitEditing={handleAddHealth}
              />
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={handleAddHealth}
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.tagContainer}>
              {formData.health_conditions.map((health, index) => (
                <View key={index} style={[styles.tagChip, styles.healthChip]}>
                  <Text style={styles.healthChipText}>{health}</Text>
                  <TouchableOpacity onPress={() => handleRemoveHealth(index)}>
                    <Ionicons name="close-circle" size={16} color="#eab308" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.submitButtonContainer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>
              {initialData ? "수정 완료" : "반려견 등록"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 모달창 동일 */}
      <Modal visible={showBreedList} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>견종 선택</Text>
              <TouchableOpacity onPress={() => setShowBreedList(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="견종 검색"
              value={breedSearch}
              onChangeText={setBreedSearch}
            />
            <ScrollView style={styles.breedList}>
              {filteredBreeds.map((breed, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.breedItem}
                  onPress={() => {
                    setFormData({ ...formData, breed });
                    setShowBreedList(false);
                  }}
                >
                  <Text style={styles.breedText}>{breed}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showDatePicker} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>생년월일 선택</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={(day: any) => {
                setFormData({ ...formData, birth_date: day.dateString });
                setShowDatePicker(false);
              }}
              maxDate={new Date().toISOString().split("T")[0]}
              markedDates={{
                [formData.birth_date]: {
                  selected: true,
                  selectedColor: Colors.primary,
                },
              }}
            />
          </View>
        </View>
      </Modal>

      <IngredientSelector
        visible={showAllergySheet}
        onClose={() => setShowAllergySheet(false)}
        selectedIngredients={formData.allergies}
        onToggle={handleToggleAllergy}
        title="알러지 선택"
        subtitle="반려견이 알러지가 있는 재료를 선택하세요"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  flex: { flex: 1 },
  content: { flex: 1, padding: 20, paddingTop: 10 },
  imageSection: { alignItems: "center", marginBottom: 24 },
  imageButton: { position: "relative" },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.lightBackground,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderStyle: "dashed",
  },
  imagePlaceholderText: { fontSize: 12, color: Colors.textLight, marginTop: 4 },
  editIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  formGroup: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.textDark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputText: { fontSize: 16, color: Colors.text },
  placeholder: { fontSize: 16, color: "#9ca3af" },
  searchInput: {
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  radioGroup: { flexDirection: "row", gap: 12 },
  radioButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.lightBackground,
    borderWidth: 1,
    borderColor: "transparent",
  },
  radioButtonActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  radioButtonText: { color: Colors.textLight },
  radioButtonTextActive: { color: Colors.primaryDark, fontWeight: "bold" },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagInputContainer: { flexDirection: "row", gap: 8, marginBottom: 8 },
  tagInput: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  addTagButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 16,
  },
  allergyChip: { backgroundColor: "#fee2e2" },
  allergyChipText: { marginRight: 4, color: "#b91c1c", fontWeight: "600" },
  healthChip: { backgroundColor: "#fef9c3" },
  healthChipText: { marginRight: 4, color: "#854d0e", fontWeight: "600" },
  bottomSpacer: { height: 40 },
  submitButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "white",
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  submitButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  selectButton: {
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  selectButtonText: { fontSize: 14, color: Colors.text },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: Colors.textDark },
  breedList: { flex: 1 },
  breedItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBackground,
  },
  breedText: { fontSize: 16, color: Colors.text },
});
