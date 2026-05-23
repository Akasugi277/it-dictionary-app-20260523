import { Pressable, View } from "react-native";
import { AppText } from "../components/AppText";
import { styles } from "../styles";
import { Term, WeakTermRow } from "../types";

type RecordScreenProps = {
  accuracy: number;
  studyMinutes: number;
  streak: number;
  weakTermRows: WeakTermRow[];
  favoriteCount: number;
  historyCount: number;
  recentTerms: Term[];
  onOpenTermDetail: (term: Term) => void;
};

export function RecordScreen({
  accuracy,
  studyMinutes,
  streak,
  weakTermRows,
  favoriteCount,
  historyCount,
  recentTerms,
  onOpenTermDetail,
}: RecordScreenProps) {
  return (
    <>
      <View style={styles.panelCard}>
        <AppText style={styles.cardTitle}>学習記録</AppText>
        <AppText style={styles.bulletText}>・正答率: {accuracy}%</AppText>
        <AppText style={styles.bulletText}>・学習時間: {studyMinutes}分</AppText>
        <AppText style={styles.bulletText}>・連続学習日数: {streak}日</AppText>
      </View>

      <View style={styles.panelCard}>
        <AppText style={styles.cardTitle}>苦手単語</AppText>
        {weakTermRows.length ? (
          weakTermRows.map((row) => (
            <AppText key={row.id} style={styles.bulletText}>・{row.label} ({row.count}回)</AppText>
          ))
        ) : (
          <AppText style={styles.bodyText}>まだありません。</AppText>
        )}
      </View>

      <View style={styles.panelCard}>
        <AppText style={styles.cardTitle}>お気に入り・履歴</AppText>
        <AppText style={styles.bulletText}>・お気に入り: {favoriteCount}件</AppText>
        <AppText style={styles.bulletText}>・履歴: {historyCount}件</AppText>
        {recentTerms.map((term) => (
          <Pressable key={term.id} style={styles.historyRow} onPress={() => onOpenTermDetail(term)}>
            <AppText style={styles.historyName}>{term.term}</AppText>
            <AppText style={styles.arrow}>›</AppText>
          </Pressable>
        ))}
      </View>
    </>
  );
}
