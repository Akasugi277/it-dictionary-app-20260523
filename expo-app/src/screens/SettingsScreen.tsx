import { Alert, Pressable, View } from "react-native";
import { AppText } from "../components/AppText";
import { styles } from "../styles";
import { Lang } from "../types";

type SettingsScreenProps = {
  lang: Lang;
  fontScale: number;
  accuracy: number;
  studyMinutes: number;
  streak: number;
  onSetLang: (lang: Lang) => void;
  onDecreaseFont: () => void;
  onIncreaseFont: () => void;
  onResetFont: () => void;
  onResetProgress: () => void;
};

export function SettingsScreen({
  lang,
  fontScale,
  accuracy,
  studyMinutes,
  streak,
  onSetLang,
  onDecreaseFont,
  onIncreaseFont,
  onResetFont,
  onResetProgress,
}: SettingsScreenProps) {
  const askReset = () => {
    Alert.alert("学習記録をリセット", "現在の学習記録を初期化します。よろしいですか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "リセット", style: "destructive", onPress: onResetProgress },
    ]);
  };

  return (
    <>
      <View style={styles.panelCard}>
        <AppText style={styles.cardTitle}>表示言語</AppText>
        <View style={styles.levelToggleRow}>
          <Pressable style={[styles.langChip, lang === "ja" && styles.langChipActive]} onPress={() => onSetLang("ja")}>
            <AppText style={[styles.langChipText, lang === "ja" && styles.langChipTextActive]}>日本語</AppText>
          </Pressable>
          <Pressable style={[styles.langChip, lang === "en" && styles.langChipActive]} onPress={() => onSetLang("en")}>
            <AppText style={[styles.langChipText, lang === "en" && styles.langChipTextActive]}>EN</AppText>
          </Pressable>
          <Pressable style={[styles.langChip, lang === "zh" && styles.langChipActive]} onPress={() => onSetLang("zh")}>
            <AppText style={[styles.langChipText, lang === "zh" && styles.langChipTextActive]}>中文</AppText>
          </Pressable>
        </View>
      </View>

      <View style={styles.panelCard}>
        <AppText style={styles.cardTitle}>文字サイズ</AppText>
        <AppText style={styles.bodyText}>現在: {Math.round(fontScale * 100)}%</AppText>
        <View style={styles.rowButtons}>
          <Pressable style={styles.secondaryButton} onPress={onDecreaseFont}>
            <AppText style={styles.secondaryButtonText}>小さく</AppText>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={onIncreaseFont}>
            <AppText style={styles.primaryButtonText}>大きく</AppText>
          </Pressable>
        </View>
        <View style={styles.rowButtons}>
          <Pressable style={styles.ghostButton} onPress={onResetFont}>
            <AppText style={styles.ghostButtonText}>標準に戻す</AppText>
          </Pressable>
        </View>
      </View>

      <View style={styles.panelCard}>
        <AppText style={styles.cardTitle}>現在の学習サマリー</AppText>
        <AppText style={styles.bulletText}>・正答率: {accuracy}%</AppText>
        <AppText style={styles.bulletText}>・学習時間: {studyMinutes}分</AppText>
        <AppText style={styles.bulletText}>・連続学習日数: {streak}日</AppText>
      </View>

      <View style={styles.panelCard}>
        <AppText style={styles.cardTitle}>データ管理</AppText>
        <AppText style={styles.bodyText}>学習履歴・苦手単語・お気に入りなどを初期化します。</AppText>
        <View style={styles.rowButtons}>
          <Pressable style={styles.ghostButton} onPress={askReset}>
            <AppText style={styles.ghostButtonText}>学習記録をリセット</AppText>
          </Pressable>
        </View>
      </View>
    </>
  );
}
