import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { AppText } from "../components/AppText";
import { DOMAIN_TREE } from "../data";
import { styles } from "../styles";
import { Domain, Term } from "../types";

type CategoryScreenProps = {
  domainProgress: Record<Domain, number>;
  terms: Term[];
  onOpenTermDetail: (term: Term) => void;
};

export function CategoryScreen({ domainProgress, terms, onOpenTermDetail }: CategoryScreenProps) {
  const domainRows: Domain[] = ["ストラテジ系", "マネジメント系", "テクノロジ系"];

  return (
    <>
      <View style={styles.panelCard}>
        <AppText style={styles.cardTitle}>分野別 学習記録</AppText>
        {domainRows.map((domain) => (
          <View key={domain} style={styles.progressBlock}>
            <View style={styles.progressHeader}>
              <AppText style={styles.progressName}>{domain}</AppText>
              <AppText style={styles.progressPercent}>{Math.round(domainProgress[domain])}%</AppText>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(domainProgress[domain])}%` }]} />
            </View>
            <AppText style={styles.categoryListText}>{DOMAIN_TREE[domain].join(" / ")}</AppText>
          </View>
        ))}
      </View>

      {domainRows.map((domain) => {
        const domainTerms = terms.filter((term) => term.domain === domain);
        return (
          <View key={`${domain}-terms`} style={styles.panelCard}>
            <AppText style={styles.cardTitle}>{domain} の用語</AppText>
            {domainTerms.map((term) => (
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
        );
      })}
    </>
  );
}
