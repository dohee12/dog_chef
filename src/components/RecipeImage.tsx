import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";

// 레시피 사진. 주소가 비었거나 사진을 못 불러오면(404 등) 빈칸 대신 회색 자리표시를 보여준다.
// 엉뚱한 음식 사진으로 대신하지 않는다: 다른 요리처럼 보이면 더 헷갈린다.
export default function RecipeImage({ uri }: { uri?: string }) {
  const [failed, setFailed] = React.useState(false);

  // 레시피를 고쳐 주소가 바뀌면 다시 시도한다
  React.useEffect(() => setFailed(false), [uri]);

  if (!uri || failed) {
    return (
      <View style={styles.placeholder}>
        <Ionicons name="image-outline" size={48} color={Colors.borderDark} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={styles.image}
      contentFit="cover"
      transition={200}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  image: { width: "100%", height: "100%" },
  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.lightBackground,
    alignItems: "center",
    justifyContent: "center",
  },
});
