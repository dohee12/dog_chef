import Colors from "@/constants/Colors";
import { usePet } from "@/context/PetContext";
import { Pet } from "@/types/Pet";
import { Ionicons } from "@expo/vector-icons";
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

  const [formData, setFormData] = useState<Omit<Pet, "id">>({
    name: "",
    breed: "",
    age: 0, // Calculated from birthDate
    weight: 0,
    allergies: [],
    healthConditions: [],
    birthDate: "",
    gender: "male",
    isNeutered: false,
  });

  const [weightInput, setWeightInput] = useState("");
  const [showBreedList, setShowBreedList] = useState(false);
  const [breedSearch, setBreedSearch] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [allergyInput, setAllergyInput] = useState("");
  const [healthInput, setHealthInput] = useState("");

  useEffect(() => {
    if (initialData) {
      const { id, ...rest } = initialData;
      setFormData(rest);
      setWeightInput(rest.weight.toString());
    }
  }, [initialData]);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    if (formData.birthDate) {
      const age = calculateAge(formData.birthDate);
      setFormData((prev) => ({ ...prev, age }));
    }
  }, [formData.birthDate]);

  const filteredBreeds = breedList.filter((b) => b.includes(breedSearch));

  const handleAddAllergy = () => {
    if (allergyInput.trim()) {
      setFormData({
        ...formData,
        allergies: [...formData.allergies, allergyInput.trim()],
      });
      setAllergyInput("");
    }
  };

  const handleAddHealth = () => {
    if (healthInput.trim()) {
      setFormData({
        ...formData,
        healthConditions: [...formData.healthConditions, healthInput.trim()],
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
      healthConditions: formData.healthConditions.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Alert.alert("오류", "반려견 이름을 입력해주세요.");
      return;
    }
    if (!formData.breed) {
      Alert.alert("오류", "견종을 선택해주세요.");
      return;
    }

    const petData = {
      ...formData,
      weight: parseFloat(weightInput) || 0,
    };

    if (initialData) {
      updatePet({ ...petData, id: initialData.id });
    } else {
      addPet(petData);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {initialData ? "반려견 수정" : "반려견 등록"}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView style={styles.content}>
          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>이름 *</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 뭉치"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          {/* Breed */}
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

          {/* Breed Modal */}
          <Modal
            visible={showBreedList}
            animationType="slide"
            transparent={true}
          >
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

          {/* BirthDate */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>생년월일</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                style={
                  formData.birthDate ? styles.inputText : styles.placeholder
                }
              >
                {formData.birthDate || "날짜 선택"}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Date Picker Modal */}
          <Modal
            visible={showDatePicker}
            animationType="slide"
            transparent={true}
          >
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
                    setFormData({ ...formData, birthDate: day.dateString });
                    setShowDatePicker(false);
                  }}
                  maxDate={new Date().toISOString().split("T")[0]}
                  markedDates={{
                    [formData.birthDate]: {
                      selected: true,
                      selectedColor: Colors.primary,
                    },
                  }}
                />
              </View>
            </View>
          </Modal>

          {/* Weight */}
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

          {/* Gender */}
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

          {/* Neutered */}
          <View style={styles.formGroup}>
            <View style={styles.switchContainer}>
              <Text style={styles.label}>중성화 여부</Text>
              <Switch
                value={formData.isNeutered}
                onValueChange={(value) =>
                  setFormData({ ...formData, isNeutered: value })
                }
                trackColor={{ false: "#d1d5db", true: Colors.primaryLight }}
                thumbColor={formData.isNeutered ? Colors.primary : "#f3f4f6"}
              />
            </View>
          </View>

          {/* Allergies */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>알러지</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="예: 닭고기"
                value={allergyInput}
                onChangeText={setAllergyInput}
                onSubmitEditing={handleAddAllergy}
              />
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={handleAddAllergy}
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>
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

          {/* Health Conditions */}
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
              {formData.healthConditions.map((health, index) => (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textDark,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
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
  inputText: {
    fontSize: 16,
    color: Colors.text,
  },
  placeholder: {
    fontSize: 16,
    color: "#9ca3af",
  },
  searchInput: {
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  radioGroup: {
    flexDirection: "row",
    gap: 12,
  },
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
  radioButtonText: {
    color: Colors.textLight,
  },
  radioButtonTextActive: {
    color: Colors.primaryDark,
    fontWeight: "bold",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagInputContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
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
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 16,
  },
  allergyChip: {
    backgroundColor: "#fee2e2",
  },
  allergyChipText: {
    marginRight: 4,
    color: "#b91c1c",
    fontWeight: "600",
  },
  healthChip: {
    backgroundColor: "#fef9c3",
  },
  healthChipText: {
    marginRight: 4,
    color: "#854d0e",
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 40,
  },
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
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Modal
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textDark,
  },
  breedList: {
    flex: 1,
  },
  breedItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBackground,
  },
  breedText: {
    fontSize: 16,
    color: Colors.text,
  },
});
