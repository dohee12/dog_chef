import { Alert, Platform } from "react-native";

// react-native-web 의 Alert.alert 는 아무것도 하지 않는다.
// 웹에서는 브라우저 alert/confirm 으로 대신 보여준다.

export function notify(title: string, message?: string) {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

/** 확인을 누르면 true. */
export function confirmAsync(
  title: string,
  message: string,
  confirmText = "확인",
  destructive = false
): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "취소", style: "cancel", onPress: () => resolve(false) },
      {
        text: confirmText,
        style: destructive ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ]);
  });
}
