import { View } from "react-native";
import { AppText } from "./AppText";
import { styles } from "../styles";

export function Header() {
  return (
    <View style={styles.header}>
      <AppText style={styles.headerTitle}>ITサポーター</AppText>
    </View>
  );
}
