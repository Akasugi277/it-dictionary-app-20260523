import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Level = "初級" | "中級" | "上級";
type Domain = "ストラテジ系" | "マネジメント系" | "テクノロジ系";
type Lang = "ja" | "en" | "zh";

type Term = {
  id: string;
  name: string;
  reading: string;
  level: Level;
  domain: Domain;
  category: string;
  image: string;
  easy: string;
  example: string;
  workplace: string;
  keywords: string[];
  translation: { en: string; zh: string };
};

type PersistedState = {
  learnedCount: Record<string, number>;
  weakTerms: Record<string, number>;
  attempts: number;
  correct: number;
  studyMinutes: number;
  streak: number;
};

const APP_STATE_KEY = "itjp_expo_mvp_state_v1";

const DOMAIN_CATEGORY_MAP: Record<Domain, string[]> = {
  ストラテジ系: [
    "企業活動",
    "法務",
    "経営戦略",
    "技術戦略",
    "ビジネスインダストリ",
    "システム概略",
    "システム企画",
  ],
  マネジメント系: [
    "システム開発技術",
    "ソフトウェア開発管理技術",
    "プロジェクトマネジメント",
    "サービスマネジメント",
    "システム監査",
  ],
  テクノロジ系: [
    "基礎理論",
    "アルゴリズムとプログラミング",
    "コンピュータ構成要素",
    "ソフトウェア",
    "ハードウェア",
    "情報デザイン",
    "情報メディア",
    "データベース",
    "ネットワーク",
    "セキュリティ",
  ],
};

const TERMS: Term[] = [
  {
    id: "variable",
    name: "変数",
    reading: "へんすう",
    level: "初級",
    domain: "テクノロジ系",
    category: "アルゴリズムとプログラミング",
    image: "📦",
    easy: "データを入れておく箱です。",
    example: "名前を入力したら、その値を変数に保存します。",
    workplace: "この値は変数に入れてください。",
    keywords: ["箱", "値", "データ", "保存"],
    translation: {
      en: "A variable is a box for data.",
      zh: "变量是存放数据的盒子。",
    },
  },
  {
    id: "api",
    name: "API",
    reading: "エーピーアイ",
    level: "中級",
    domain: "テクノロジ系",
    category: "ネットワーク",
    image: "🔗",
    easy: "アプリどうしで情報をやりとりするためのルールです。",
    example: "天気アプリはAPIで天気情報を受け取ります。",
    workplace: "API接続の確認をお願いします。",
    keywords: ["ルール", "情報", "やりとり", "アプリ"],
    translation: {
      en: "API is a rule for app-to-app communication.",
      zh: "API 是应用之间通信的规则。",
    },
  },
  {
    id: "database",
    name: "データベース",
    reading: "でーたべーす",
    level: "中級",
    domain: "テクノロジ系",
    category: "データベース",
    image: "🗄️",
    easy: "データを整理して保存する場所です。",
    example: "利用者のメール情報をデータベースに保存します。",
    workplace: "データベースのバックアップを確認してください。",
    keywords: ["データ", "整理", "保存", "検索"],
    translation: {
      en: "A database stores data in an organized way.",
      zh: "数据库用于有序地保存数据。",
    },
  },
  {
    id: "normalization",
    name: "正規化",
    reading: "せいきか",
    level: "上級",
    domain: "テクノロジ系",
    category: "データベース",
    image: "🧩",
    easy: "データの重複を減らして管理しやすくする方法です。",
    example: "同じ住所情報を別テーブルに分けると正規化できます。",
    workplace: "この設計は正規化が必要です。",
    keywords: ["重複", "テーブル", "データ", "整理"],
    translation: {
      en: "Normalization reduces duplicate data.",
      zh: "规范化用于减少重复数据。",
    },
  },
  {
    id: "polymorphism",
    name: "ポリモーフィズム",
    reading: "ぽりもーふぃずむ",
    level: "上級",
    domain: "テクノロジ系",
    category: "ソフトウェア",
    image: "🎭",
    easy: "同じ命令でも型によって動きを変える考え方です。",
    example: "drawは図形ごとに違う処理をします。",
    workplace: "ポリモーフィズムで拡張性を上げましょう。",
    keywords: ["同じ", "型", "動き", "処理"],
    translation: {
      en: "Polymorphism changes behavior by type.",
      zh: "多态会根据类型改变行为。",
    },
  },
  {
    id: "login",
    name: "ログイン",
    reading: "ろぐいん",
    level: "初級",
    domain: "ストラテジ系",
    category: "システム概略",
    image: "🔐",
    easy: "IDとパスワードでサービスに入ることです。",
    example: "勤怠システムにログインして打刻します。",
    workplace: "ログインできない問題を調査してください。",
    keywords: ["ID", "パスワード", "認証", "入る"],
    translation: {
      en: "Login means entering a service by authentication.",
      zh: "登录是通过认证进入系统。",
    },
  },
];

const TERM_MAP: Record<string, string[]> = {
  Webサイト: ["サーバ", "データベース"],
  サーバ: ["データベース", "API"],
  API: ["データベース"],
  ログイン: ["認証", "セキュリティ"],
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function scoreClass(total: number) {
  if (total >= 12) return styles.good;
  if (total >= 9) return styles.mid;
  return styles.low;
}

export default function App() {
  const [lang, setLang] = useState<Lang>("ja");
  const [termId, setTermId] = useState(TERMS[0].id);
  const [quizTermId, setQuizTermId] = useState(TERMS[1].id);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);
  const [learnedCount, setLearnedCount] = useState<Record<string, number>>({});
  const [weakTerms, setWeakTerms] = useState<Record<string, number>>({});
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [studyMinutes, setStudyMinutes] = useState(0);
  const [streak, setStreak] = useState(1);

  useEffect(() => {
    const loadState = async () => {
      try {
        const raw = await AsyncStorage.getItem(APP_STATE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        if (parsed.learnedCount) setLearnedCount(parsed.learnedCount);
        if (parsed.weakTerms) setWeakTerms(parsed.weakTerms);
        if (typeof parsed.attempts === "number") setAttempts(parsed.attempts);
        if (typeof parsed.correct === "number") setCorrect(parsed.correct);
        if (typeof parsed.studyMinutes === "number") setStudyMinutes(parsed.studyMinutes);
        if (typeof parsed.streak === "number") setStreak(parsed.streak);
      } catch {
        // ignore parse/storage errors and continue with defaults
      }
    };

    loadState();
  }, []);

  useEffect(() => {
    const saveState = async () => {
      const payload: PersistedState = {
        learnedCount,
        weakTerms,
        attempts,
        correct,
        studyMinutes,
        streak,
      };
      try {
        await AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(payload));
      } catch {
        // ignore write failures in MVP mode
      }
    };

    saveState();
  }, [attempts, correct, learnedCount, streak, studyMinutes, weakTerms]);

  const selectedTerm = useMemo(
    () => TERMS.find((t) => t.id === termId) ?? TERMS[0],
    [termId]
  );

  const quizTerm = useMemo(
    () => TERMS.find((t) => t.id === quizTermId) ?? TERMS[1],
    [quizTermId]
  );

  const weakTermRows = useMemo(
    () =>
      Object.entries(weakTerms as Record<string, number>)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, cnt]) => `${TERMS.find((t) => t.id === id)?.name ?? id} (${cnt})`),
    [weakTerms]
  );

  const accuracy = attempts === 0 ? 0 : Math.round((correct / attempts) * 100);

  const progress = useMemo(() => {
    const learnedSum = Object.values(learnedCount as Record<string, number>).reduce(
      (sum, n) => sum + n,
      0
    );
    return {
      ストラテジ系: clamp((Object.keys(learnedCount).length / DOMAIN_CATEGORY_MAP["ストラテジ系"].length) * 35),
      マネジメント系: clamp(accuracy),
      テクノロジ系: clamp((learnedSum / 12) * 100),
    };
  }, [accuracy, learnedCount]);

  const missions = [
    `今日の単語: ${TERMS[new Date().getDate() % TERMS.length].name}`,
    `連続学習日数: ${streak}日`,
    attempts > 0 ? "デイリークイズ: 完了" : "デイリークイズ: 1問解く",
  ];

  const mapRows = TERM_MAP[selectedTerm.name] ?? ["Webサイト", "サーバ", "データベース"];

  const cycleTerm = () => {
    const idx = TERMS.findIndex((t) => t.id === termId);
    const next = TERMS[(idx + 1) % TERMS.length];
    setTermId(next.id);
  };

  const cycleQuiz = () => {
    const idx = TERMS.findIndex((t) => t.id === quizTermId);
    const next = TERMS[(idx + 1) % TERMS.length];
    setQuizTermId(next.id);
    setAnswer("");
    setFeedback("");
    setScore(0);
  };

  const markLearned = () => {
    setLearnedCount((prev: Record<string, number>) => ({
      ...prev,
      [selectedTerm.id]: (prev[selectedTerm.id] ?? 0) + 1,
    }));
    setStudyMinutes((m: number) => m + 5);
  };

  const gradeAnswer = () => {
    const text = answer.trim();
    if (!text) {
      setFeedback("回答を入力してください。");
      setScore(0);
      return;
    }

    const hit = quizTerm.keywords.reduce(
      (sum: number, k: string) => sum + (text.includes(k) ? 1 : 0),
      0
    );
    const accuracyPoint = Math.min(5, hit + (text.includes(quizTerm.name) ? 1 : 0));
    const clarityPoint = text.length >= 34 ? 4 : text.length >= 20 ? 3 : 2;
    const concretePoint = /例えば|たとえば|例|実際|とき/.test(text) ? 4 : 2;
    const total = accuracyPoint + clarityPoint + concretePoint;

    setAttempts((v: number) => v + 1);
    setStudyMinutes((m: number) => m + 3);

    if (total >= 10) {
      setCorrect((v: number) => v + 1);
    } else {
      setWeakTerms((prev: Record<string, number>) => ({
        ...prev,
        [quizTerm.id]: (prev[quizTerm.id] ?? 0) + 1,
      }));
    }

    setScore(total);
    if (total >= 12) {
      setFeedback("とても分かりやすい説明です。意味・具体性ともに十分です。");
    } else if (total >= 9) {
      setFeedback("よい説明です。もう少し具体例を入れるとさらに伝わります。");
    } else {
      setFeedback("キーワードと具体例を増やすと、説明の正確さが上がります。");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>やさしいIT日本語学習アプリ</Text>
          <Text style={styles.subtitle}>React + Expo MVP（留学生N2向け）</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>学習サマリー</Text>
          <View style={styles.summaryRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>連続日数</Text>
              <Text style={styles.statValue}>{streak}日</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>学習時間</Text>
              <Text style={styles.statValue}>{studyMinutes}分</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>正答率</Text>
              <Text style={styles.statValue}>{accuracy}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>学習記録（分野別）</Text>
          {(Object.keys(progress) as Domain[]).map((name) => (
            <View key={name} style={styles.progressBlock}>
              <View style={styles.progressHead}>
                <Text style={styles.progressName}>{name}</Text>
                <Text style={styles.progressPercent}>{Math.round(progress[name])}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round(progress[name])}%` }]} />
              </View>
            </View>
          ))}
          <Text style={styles.smallLabel}>苦手単語</Text>
          {weakTermRows.length > 0 ? (
            weakTermRows.map((row: string) => (
              <Text key={row} style={styles.bulletText}>
                ・{row}
              </Text>
            ))
          ) : (
            <Text style={styles.bulletText}>・まだありません</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>単語学習</Text>
          <View style={styles.inlineButtons}>
            <Pressable style={styles.secondaryButton} onPress={cycleTerm}>
              <Text style={styles.buttonText}>別の単語</Text>
            </Pressable>
            <Pressable
              style={styles.langButton}
              onPress={() => setLang((v) => (v === "ja" ? "en" : v === "en" ? "zh" : "ja"))}
            >
              <Text style={styles.buttonText}>言語: {lang.toUpperCase()}</Text>
            </Pressable>
          </View>
          <Text style={styles.termImage}>{selectedTerm.image}</Text>
          <Text style={styles.termName}>
            {selectedTerm.name}（{selectedTerm.reading}）
          </Text>
          <Text style={styles.termMeta}>
            {selectedTerm.level} / {selectedTerm.domain} / {selectedTerm.category}
          </Text>
          <Text style={styles.infoBox}>やさしい説明: {selectedTerm.easy}</Text>
          <Text style={styles.infoBox}>具体例: {selectedTerm.example}</Text>
          <Text style={styles.infoBox}>現場会話: {selectedTerm.workplace}</Text>
          {lang !== "ja" && (
            <Text style={styles.infoBox}>
              翻訳: {lang === "en" ? selectedTerm.translation.en : selectedTerm.translation.zh}
            </Text>
          )}
          <Pressable style={styles.primaryButton} onPress={markLearned}>
            <Text style={styles.buttonText}>理解できた（記録する）</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>クイズ（自分で説明→AI添削）</Text>
          <Text style={styles.quizPrompt}>
            「{quizTerm.name}」を説明してください。ヒント: {quizTerm.keywords.join("、")}
          </Text>
          <TextInput
            style={styles.input}
            multiline
            placeholder="自分の言葉で説明を書いてください"
            value={answer}
            onChangeText={setAnswer}
          />
          <View style={styles.inlineButtons}>
            <Pressable style={styles.primaryButton} onPress={gradeAnswer}>
              <Text style={styles.buttonText}>AI添削する</Text>
            </Pressable>
            <Pressable style={styles.ghostButton} onPress={cycleQuiz}>
              <Text style={styles.buttonText}>次の問題</Text>
            </Pressable>
          </View>
          {feedback ? (
            <View style={styles.feedbackBox}>
              <Text style={[styles.scorePill, scoreClass(score)]}>総合: {score}/15</Text>
              <Text style={styles.feedbackText}>{feedback}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>関連用語マップ</Text>
          <Text style={styles.mapText}>{selectedTerm.name}</Text>
          {mapRows.map((node) => (
            <Text key={node} style={styles.mapText}>
              ↓ {node}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>学習ミッション</Text>
          {missions.map((mission: string) => (
            <Text key={mission} style={styles.bulletText}>
              ・{mission}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f2747",
  },
  page: {
    paddingBottom: 28,
    backgroundColor: "#eef4ff",
  },
  header: {
    backgroundColor: "#1f4eb3",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "#dbeafe",
    marginTop: 4,
    fontSize: 14,
  },
  card: {
    marginHorizontal: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
  },
  cardTitle: {
    color: "#0e3a8a",
    fontWeight: "700",
    fontSize: 17,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  statLabel: {
    color: "#334155",
    fontSize: 12,
  },
  statValue: {
    marginTop: 4,
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "700",
  },
  progressBlock: {
    marginBottom: 10,
  },
  progressHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressName: {
    color: "#0f172a",
  },
  progressPercent: {
    color: "#0e3a8a",
    fontWeight: "700",
  },
  track: {
    height: 14,
    borderRadius: 999,
    backgroundColor: "#dbeafe",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: "#2563eb",
  },
  smallLabel: {
    marginTop: 8,
    color: "#334155",
    fontWeight: "700",
  },
  bulletText: {
    marginTop: 4,
    color: "#334155",
    lineHeight: 20,
  },
  inlineButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: "#1d4ed8",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryButton: {
    backgroundColor: "#0f766e",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  ghostButton: {
    backgroundColor: "#475569",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  langButton: {
    backgroundColor: "#7c3aed",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  termImage: {
    fontSize: 46,
    textAlign: "center",
  },
  termName: {
    marginTop: 6,
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "700",
  },
  termMeta: {
    marginTop: 4,
    color: "#334155",
    fontSize: 13,
  },
  infoBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    color: "#334155",
    lineHeight: 21,
  },
  quizPrompt: {
    color: "#334155",
    marginBottom: 8,
  },
  input: {
    minHeight: 120,
    borderColor: "#cbd5e1",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    textAlignVertical: "top",
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  feedbackBox: {
    marginTop: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    padding: 10,
  },
  feedbackText: {
    color: "#1e293b",
    lineHeight: 20,
  },
  scorePill: {
    alignSelf: "flex-start",
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: "700",
  },
  good: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  mid: {
    backgroundColor: "#fef9c3",
    color: "#854d0e",
  },
  low: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  mapText: {
    color: "#0f172a",
    lineHeight: 24,
  },
});
