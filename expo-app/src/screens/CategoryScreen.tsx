import { View } from "react-native";
import { AppText } from "../components/AppText";
import { DOMAIN_TREE } from "../data";
import { styles } from "../styles";
import { Domain } from "../types";

type CategoryScreenProps = {
  domainProgress: Record<Domain, number>;
};

export function CategoryScreen({ domainProgress }: CategoryScreenProps) {
  const domainRows: Domain[] = ["ストラテジ系", "マネジメント系", "テクノロジ系"];

  return (
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
  );
}
