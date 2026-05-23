import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { AppText } from "../components/AppText";
import { styles } from "../styles";
import { Lang, Term } from "../types";

type DetailScreenProps = {
  selectedTerm: Term;
  isDesktop: boolean;
  lang: Lang;
  isFavorite: boolean;
  onBack: () => void;
  onSetLang: (lang: Lang) => void;
  onMarkLearned: () => void;
  onSpeak: () => void;
  onToggleFavorite: () => void;
};

export function DetailScreen({
  selectedTerm,
  isDesktop,
  lang,
  isFavorite,
  onBack,
  onSetLang,
  onMarkLearned,
  onSpeak,
  onToggleFavorite,
}: DetailScreenProps) {
  const translation = lang === "ja" ? "" : selectedTerm.translations[lang];

  return (
    <View style={styles.detailPane}>
      {!isDesktop && (
        <Pressable onPress={onBack}>
          <AppText style={styles.backText}>← 戻る</AppText>
        </Pressable>
      )}

      <View style={styles.detailTitleRow}>
        <Ionicons
          name={selectedTerm.icon as keyof typeof Ionicons.glyphMap}
          size={24}
          color="#10263f"
        />
        <AppText style={styles.detailTitle}>{selectedTerm.term}</AppText>
      </View>
      <AppText style={styles.detailSub}>{selectedTerm.reading} / {selectedTerm.level} / {selectedTerm.domain}</AppText>

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

      <View style={styles.detailCard}>
        <AppText style={styles.detailCardTitle}>やさしい説明</AppText>
        <AppText style={styles.bodyText}>{selectedTerm.easy}</AppText>

        <AppText style={styles.detailCardTitle}>具体例</AppText>
        <AppText style={styles.bodyText}>{selectedTerm.example}</AppText>

        <AppText style={styles.detailCardTitle}>現場での会話</AppText>
        <AppText style={styles.bodyText}>{selectedTerm.workplace}</AppText>

        {translation ? (
          <>
            <AppText style={styles.detailCardTitle}>母語翻訳</AppText>
            <AppText style={styles.bodyText}>{translation}</AppText>
          </>
        ) : null}

        <View style={styles.rowButtons}>
          <Pressable style={styles.primaryButton} onPress={onMarkLearned}>
            <AppText style={styles.primaryButtonText}>理解した（記録）</AppText>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onSpeak}>
            <AppText style={styles.secondaryButtonText}>発音読み上げ</AppText>
          </Pressable>
        </View>

        <View style={styles.rowButtons}>
          <Pressable style={styles.ghostButton} onPress={onToggleFavorite}>
            <AppText style={styles.ghostButtonText}>{isFavorite ? "お気に入り解除" : "お気に入り追加"}</AppText>
          </Pressable>
        </View>
      </View>

      <View style={styles.detailCard}>
        <AppText style={styles.detailCardTitle}>関連用語マップ</AppText>
        <AppText style={styles.bodyText}>Webサイト</AppText>
        <AppText style={styles.bodyText}>↓</AppText>
        <AppText style={styles.bodyText}>サーバ</AppText>
        <AppText style={styles.bodyText}>↓</AppText>
        <AppText style={styles.bodyText}>データベース</AppText>
        {selectedTerm.related.map((r) => (
          <AppText key={r} style={styles.relatedText}>・{r}</AppText>
        ))}
      </View>
    </View>
  );
}
