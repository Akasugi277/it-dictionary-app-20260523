import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { AppText } from "../components/AppText";
import { AppTextInput } from "../components/AppTextInput";
import { LEVEL_ORDER } from "../data";
import { styles } from "../styles";
import { Term } from "../types";
import { levelColor } from "../utils";

type HomeScreenProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filteredTerms: Term[];
  todayWord: Term;
  streak: number;
  dailyDone: boolean;
  onOpenTermDetail: (term: Term) => void;
};

export function HomeScreen({
  search,
  onSearchChange,
  filteredTerms,
  todayWord,
  streak,
  dailyDone,
  onOpenTermDetail,
}: HomeScreenProps) {
  return (
    <>
      <AppTextInput
        value={search}
        onChangeText={onSearchChange}
        placeholder="知りたい用語を検索"
        style={styles.searchInput}
        placeholderTextColor="#8ea1b5"
      />

      <View style={styles.panelCard}>
        <AppText style={styles.cardTitle}>このアプリの目的</AppText>
        <AppText style={styles.bodyText}>
          N2レベルの留学生でも、やさしい日本語と具体例でIT用語を理解できるようにします。
        </AppText>
        <AppText style={[styles.cardTitle, styles.cardTitleGap]}>解決したい課題</AppText>
        <AppText style={styles.bodyText}>日本語理解力が低いと、IT用語の意味が理解しにくい。</AppText>
        <AppText style={[styles.cardTitle, styles.cardTitleGap]}>原因</AppText>
        <AppText style={styles.bulletText}>・専門用語が難しい</AppText>
        <AppText style={styles.bulletText}>・カタカナ語が多い</AppText>
        <AppText style={styles.bulletText}>・抽象的な説明が理解しづらい</AppText>
        <AppText style={styles.bulletText}>・ITと日本語を同時に学ぶ必要がある</AppText>
      </View>

      <View style={styles.panelCard}>
        <AppText style={styles.cardTitle}>学習ミッション</AppText>
        <AppText style={styles.bulletText}>・今日の単語: {todayWord.term}</AppText>
        <AppText style={styles.bulletText}>・連続学習日数: {streak}日</AppText>
        <AppText style={styles.bulletText}>・デイリークイズ: {dailyDone ? "完了" : "未完了"}</AppText>
      </View>

      <View style={styles.panelCard}>
        <AppText style={styles.cardTitle}>レベル別学習</AppText>
        {LEVEL_ORDER.map((level) => {
          const levelTerms = filteredTerms.filter((t) => t.level === level);
          return (
            <View key={level} style={styles.levelRow}>
              <AppText style={[styles.levelBadge, { backgroundColor: levelColor(level) }]}>{level}</AppText>
              <AppText style={styles.levelText}>{levelTerms.map((t) => t.term).join("、") || "-"}</AppText>
            </View>
          );
        })}
      </View>

      <View style={styles.panelCard}>
        <AppText style={styles.cardTitle}>単語学習</AppText>
        {filteredTerms.map((term) => (
          <Pressable key={term.id} style={styles.termRow} onPress={() => onOpenTermDetail(term)}>
            <Ionicons
              name={term.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color="#4a6581"
              style={styles.termIcon}
            />
            <View style={styles.termTextWrap}>
              <AppText style={styles.termName}>{term.term}</AppText>
              <AppText style={styles.termSub}>{term.level} / {term.category}</AppText>
            </View>
            <AppText style={styles.arrow}>›</AppText>
          </Pressable>
        ))}
      </View>
    </>
  );
}
