import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { AppText } from "./AppText";
import { styles } from "../styles";
import { TabKey } from "../types";

type BottomNavProps = {
  tab: TabKey;
  onChangeTab: (tab: TabKey) => void;
};

const tabs: Array<{ key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: "home", label: "ホーム", icon: "home-outline" },
  { key: "categories", label: "カテゴリ", icon: "grid-outline" },
  { key: "quiz", label: "クイズ", icon: "help-circle-outline" },
  { key: "record", label: "記録", icon: "bar-chart-outline" },
  { key: "settings", label: "設定", icon: "settings-outline" },
];

export function BottomNav({ tab, onChangeTab }: BottomNavProps) {
  return (
    <View style={styles.bottomNav}>
      {tabs.map((item) => {
        const active = tab === item.key;
        return (
          <Pressable key={item.key} style={styles.navItem} onPress={() => onChangeTab(item.key)}>
            <Ionicons
              name={item.icon}
              size={18}
              color={active ? "#0f69b0" : "#6f8195"}
              style={styles.navIcon}
            />
            <AppText style={[styles.navText, active && styles.navTextActive]}>{item.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
