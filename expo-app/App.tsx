import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, View, useWindowDimensions } from "react-native";
import { BottomNav } from "./src/components/BottomNav";
import { Header } from "./src/components/Header";
import {
  APP_STATE_HISTORY_KEY,
  APP_STATE_KEY,
  APP_STATE_META_KEY,
  APP_STATE_PER_TERM_KEY,
  APP_STATE_PROGRESS_KEY,
  APP_STATE_VERSION,
  LEGACY_APP_STATE_KEYS,
  TERMS,
  initialState,
} from "./src/data";
import { FontScaleProvider } from "./src/fontScale";
import { CategoryScreen } from "./src/screens/CategoryScreen";
import { DetailScreen } from "./src/screens/DetailScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { QuizScreen } from "./src/screens/QuizScreen";
import { RecordScreen } from "./src/screens/RecordScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { styles } from "./src/styles";
import { AppState, Domain, TabKey, Term, WeakTermRow } from "./src/types";
import { clamp, todayKey } from "./src/utils";

const TERM_ID_SET = new Set(TERMS.map((term) => term.id));
const APP_STATE_SPLIT_KEYS = [
  APP_STATE_META_KEY,
  APP_STATE_PROGRESS_KEY,
  APP_STATE_PER_TERM_KEY,
  APP_STATE_HISTORY_KEY,
] as const;

type SplitMetaState = Pick<AppState, "stateVersion" | "lang" | "fontScale">;
type SplitProgressState = Pick<AppState, "attempts" | "correct" | "studyMinutes" | "streak">;
type SplitPerTermState = Pick<AppState, "learnedCount" | "weakTerms" | "favorites">;
type SplitHistoryState = Pick<AppState, "history" | "lastStudyDate" | "dailyQuizDoneDate">;

function toSafeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toSafeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toSafeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toSafeTermNumberRecord(value: unknown) {
  if (!value || typeof value !== "object") return {} as Record<string, number>;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([id, count]) => TERM_ID_SET.has(id) && typeof count === "number" && count > 0)
      .map(([id, count]) => [id, count])
  ) as Record<string, number>;
}

function toSafeTermBooleanRecord(value: unknown) {
  if (!value || typeof value !== "object") return {} as Record<string, boolean>;
  return Object.fromEntries(
    Object.entries(value).filter(([id, enabled]) => TERM_ID_SET.has(id) && Boolean(enabled))
  ) as Record<string, boolean>;
}

function normalizeState(raw: unknown): AppState {
  if (!raw || typeof raw !== "object") return initialState;
  const candidate = raw as Partial<AppState>;

  return {
    stateVersion: APP_STATE_VERSION,
    learnedCount: toSafeTermNumberRecord(candidate.learnedCount),
    weakTerms: toSafeTermNumberRecord(candidate.weakTerms),
    favorites: toSafeTermBooleanRecord(candidate.favorites),
    history: toSafeStringArray(candidate.history).filter((id) => TERM_ID_SET.has(id)).slice(0, 25),
    attempts: Math.max(0, toSafeNumber(candidate.attempts)),
    correct: Math.max(0, toSafeNumber(candidate.correct)),
    studyMinutes: Math.max(0, toSafeNumber(candidate.studyMinutes)),
    streak: Math.max(0, toSafeNumber(candidate.streak)),
    lastStudyDate: toSafeString(candidate.lastStudyDate),
    dailyQuizDoneDate: toSafeString(candidate.dailyQuizDoneDate),
    lang: candidate.lang === "en" || candidate.lang === "zh" ? candidate.lang : "ja",
    fontScale: Math.max(0.8, Math.min(1.4, toSafeNumber(candidate.fontScale, 1))),
  };
}

function buildSplitPayload(state: AppState) {
  const meta: SplitMetaState = {
    stateVersion: APP_STATE_VERSION,
    lang: state.lang,
    fontScale: state.fontScale,
  };
  const progress: SplitProgressState = {
    attempts: state.attempts,
    correct: state.correct,
    studyMinutes: state.studyMinutes,
    streak: state.streak,
  };
  const perTerm: SplitPerTermState = {
    learnedCount: state.learnedCount,
    weakTerms: state.weakTerms,
    favorites: state.favorites,
  };
  const history: SplitHistoryState = {
    history: state.history,
    lastStudyDate: state.lastStudyDate,
    dailyQuizDoneDate: state.dailyQuizDoneDate,
  };

  return { meta, progress, perTerm, history };
}

function parseJsonSafe(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

async function loadPersistedState() {
  const splitEntries = await AsyncStorage.multiGet([...APP_STATE_SPLIT_KEYS]);
  const splitMap = new Map(splitEntries);
  const metaRaw = splitMap.get(APP_STATE_META_KEY) ?? null;
  const progressRaw = splitMap.get(APP_STATE_PROGRESS_KEY) ?? null;
  const perTermRaw = splitMap.get(APP_STATE_PER_TERM_KEY) ?? null;
  const historyRaw = splitMap.get(APP_STATE_HISTORY_KEY) ?? null;

  if (metaRaw || progressRaw || perTermRaw || historyRaw) {
    return {
      source: "split" as const,
      state: normalizeState({
        ...(parseJsonSafe(metaRaw) ?? {}),
        ...(parseJsonSafe(progressRaw) ?? {}),
        ...(parseJsonSafe(perTermRaw) ?? {}),
        ...(parseJsonSafe(historyRaw) ?? {}),
      }),
    };
  }

  const currentRaw = await AsyncStorage.getItem(APP_STATE_KEY);
  if (currentRaw) {
    return {
      source: "single" as const,
      key: APP_STATE_KEY,
      state: normalizeState(parseJsonSafe(currentRaw)),
    };
  }

  for (const legacyKey of LEGACY_APP_STATE_KEYS) {
    const legacyRaw = await AsyncStorage.getItem(legacyKey);
    if (legacyRaw) {
      return {
        source: "single" as const,
        key: legacyKey,
        state: normalizeState(parseJsonSafe(legacyRaw)),
      };
    }
  }

  return null;
}

async function persistStateAsSplit(state: AppState) {
  const payload = buildSplitPayload(state);
  await AsyncStorage.multiSet([
    [APP_STATE_META_KEY, JSON.stringify(payload.meta)],
    [APP_STATE_PROGRESS_KEY, JSON.stringify(payload.progress)],
    [APP_STATE_PER_TERM_KEY, JSON.stringify(payload.perTerm)],
    [APP_STATE_HISTORY_KEY, JSON.stringify(payload.history)],
  ]);
}

function persistSplitKey(key: string, value: unknown) {
  return AsyncStorage.setItem(key, JSON.stringify(value));
}

export default function App() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1120;

  const [tab, setTab] = useState<TabKey>("home");
  const [state, setState] = useState<AppState>(initialState);
  const [selectedTermId, setSelectedTermId] = useState<string>(TERMS[0].id);
  const [showDetailMobile, setShowDetailMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizFeedback, setQuizFeedback] = useState("");
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizTermId, setQuizTermId] = useState<string>(TERMS[1].id);
  const [isHydrated, setIsHydrated] = useState(false);

  const metaState = useMemo<SplitMetaState>(
    () => ({
      stateVersion: APP_STATE_VERSION,
      lang: state.lang,
      fontScale: state.fontScale,
    }),
    [state.lang, state.fontScale]
  );

  const progressState = useMemo<SplitProgressState>(
    () => ({
      attempts: state.attempts,
      correct: state.correct,
      studyMinutes: state.studyMinutes,
      streak: state.streak,
    }),
    [state.attempts, state.correct, state.studyMinutes, state.streak]
  );

  const perTermState = useMemo<SplitPerTermState>(
    () => ({
      learnedCount: state.learnedCount,
      weakTerms: state.weakTerms,
      favorites: state.favorites,
    }),
    [state.learnedCount, state.weakTerms, state.favorites]
  );

  const historyState = useMemo<SplitHistoryState>(
    () => ({
      history: state.history,
      lastStudyDate: state.lastStudyDate,
      dailyQuizDoneDate: state.dailyQuizDoneDate,
    }),
    [state.history, state.lastStudyDate, state.dailyQuizDoneDate]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const persisted = await loadPersistedState();
        if (persisted) {
          const normalized = persisted.state;
          setState(normalized);

          // Phase B: persist as split keys and remove old single-key storage.
          await persistStateAsSplit(normalized);
          if (persisted.source === "single") {
            await AsyncStorage.removeItem(persisted.key);
          }
        }
        await AsyncStorage.multiRemove([APP_STATE_KEY, ...LEGACY_APP_STATE_KEYS]);
      } catch {
        setState(initialState);
      } finally {
        setIsHydrated(true);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    persistSplitKey(APP_STATE_META_KEY, metaState).catch(() => undefined);
  }, [isHydrated, metaState]);

  useEffect(() => {
    if (!isHydrated) return;
    persistSplitKey(APP_STATE_PROGRESS_KEY, progressState).catch(() => undefined);
  }, [isHydrated, progressState]);

  useEffect(() => {
    if (!isHydrated) return;
    persistSplitKey(APP_STATE_PER_TERM_KEY, perTermState).catch(() => undefined);
  }, [isHydrated, perTermState]);

  useEffect(() => {
    if (!isHydrated) return;
    persistSplitKey(APP_STATE_HISTORY_KEY, historyState).catch(() => undefined);
  }, [isHydrated, historyState]);

  const selectedTerm = useMemo(
    () => TERMS.find((t) => t.id === selectedTermId) ?? TERMS[0],
    [selectedTermId]
  );

  const quizTerm = useMemo(
    () => TERMS.find((t) => t.id === quizTermId) ?? TERMS[1],
    [quizTermId]
  );

  const filteredTerms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return TERMS;
    return TERMS.filter((t) => {
      const text = `${t.term} ${t.reading} ${t.easy} ${t.category} ${t.domain}`.toLowerCase();
      return text.includes(q);
    });
  }, [search]);

  const favoriteTerms = useMemo(
    () => TERMS.filter((t) => state.favorites[t.id]),
    [state.favorites]
  );

  const recentTerms = useMemo(() => {
    if (!state.history.length) return TERMS.slice(0, 3);
    return state.history
      .map((id) => TERMS.find((t) => t.id === id))
      .filter((t): t is Term => Boolean(t))
      .slice(0, 5);
  }, [state.history]);

  const weakTermRows = useMemo<WeakTermRow[]>(
    () =>
      Object.entries(state.weakTerms)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => {
          const t = TERMS.find((term) => term.id === id);
          return {
            id,
            label: t ? t.term : id,
            count,
          };
        }),
    [state.weakTerms]
  );

  const accuracy = state.attempts === 0 ? 0 : Math.round((state.correct / state.attempts) * 100);

  const domainProgress = useMemo(() => {
    const byDomain: Record<Domain, number> = {
      ストラテジ系: 0,
      マネジメント系: 0,
      テクノロジ系: 0,
    };

    TERMS.forEach((term) => {
      byDomain[term.domain] += state.learnedCount[term.id] ?? 0;
    });

    return {
      ストラテジ系: clamp((byDomain.ストラテジ系 / 6) * 100),
      マネジメント系: clamp((byDomain.マネジメント系 / 6) * 100),
      テクノロジ系: clamp((byDomain.テクノロジ系 / 10) * 100),
    };
  }, [state.learnedCount]);

  const todayWord = TERMS[new Date().getDate() % TERMS.length];

  const registerStudyActivity = (minutes: number) => {
    const today = todayKey();
    setState((prev) => {
      let nextStreak = prev.streak;
      if (prev.lastStudyDate !== today) {
        if (!prev.lastStudyDate) {
          nextStreak = 1;
        } else {
          const prevDate = new Date(`${prev.lastStudyDate}T00:00:00`);
          const currDate = new Date(`${today}T00:00:00`);
          const diff = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          nextStreak = diff === 1 ? prev.streak + 1 : 1;
        }
      }
      return {
        ...prev,
        studyMinutes: prev.studyMinutes + minutes,
        streak: nextStreak,
        lastStudyDate: today,
      };
    });
  };

  const openTermDetail = (term: Term) => {
    setSelectedTermId(term.id);
    setState((prev) => ({
      ...prev,
      history: [term.id, ...prev.history.filter((id) => id !== term.id)].slice(0, 25),
    }));
    if (!isDesktop) setShowDetailMobile(true);
  };

  const toggleFavorite = (termId: string) => {
    setState((prev) => ({
      ...prev,
      favorites: {
        ...prev.favorites,
        [termId]: !prev.favorites[termId],
      },
    }));
  };

  const markLearned = (termId: string) => {
    registerStudyActivity(4);
    setState((prev) => ({
      ...prev,
      learnedCount: {
        ...prev.learnedCount,
        [termId]: (prev.learnedCount[termId] ?? 0) + 1,
      },
    }));
  };

  const resetProgress = () => {
    setState((prev) => ({ ...initialState, lang: prev.lang, fontScale: prev.fontScale }));
    setSearch("");
    setQuizAnswer("");
    setQuizFeedback("");
    setQuizScore(null);
    setQuizTermId(TERMS[1].id);
    setSelectedTermId(TERMS[0].id);
    setShowDetailMobile(false);
    setTab("home");
  };

  const speakTerm = () => {
    Speech.stop();
    Speech.speak(`${selectedTerm.term}。${selectedTerm.easy}`, {
      language: "ja-JP",
      rate: 0.95,
      pitch: 1,
    });
  };

  const pickNextQuizTerm = (preferWeak: boolean) => {
    if (preferWeak && weakTermRows.length > 0) {
      setQuizTermId(weakTermRows[0].id);
      setQuizAnswer("");
      setQuizFeedback("");
      setQuizScore(null);
      return;
    }

    const current = TERMS.findIndex((t) => t.id === quizTermId);
    const next = TERMS[(current + 1) % TERMS.length];
    setQuizTermId(next.id);
    setQuizAnswer("");
    setQuizFeedback("");
    setQuizScore(null);
  };

  const gradeQuiz = () => {
    const text = quizAnswer.trim();
    if (!text) {
      setQuizFeedback("回答を入力してください。");
      setQuizScore(null);
      return;
    }

    registerStudyActivity(3);

    const keywordHits = quizTerm.keywords.reduce((sum, kw) => sum + (text.includes(kw) ? 1 : 0), 0);
    const accuracyPoint = Math.min(5, keywordHits + (text.includes(quizTerm.term) ? 1 : 0));
    const clarityPoint = text.length >= 35 ? 4 : text.length >= 20 ? 3 : 2;
    const concretePoint = /例えば|たとえば|例|実際|とき|場面/.test(text) ? 4 : 2;
    const total = accuracyPoint + clarityPoint + concretePoint;

    setQuizScore(total);

    setState((prev) => {
      const next: AppState = {
        ...prev,
        attempts: prev.attempts + 1,
        dailyQuizDoneDate: todayKey(),
      };

      if (total >= 10) {
        next.correct = prev.correct + 1;
      } else {
        next.weakTerms = {
          ...prev.weakTerms,
          [quizTerm.id]: (prev.weakTerms[quizTerm.id] ?? 0) + 1,
        };
      }
      return next;
    });

    if (total >= 12) {
      setQuizFeedback("とても良い説明です。意味の正確さと具体性が十分です。");
    } else if (total >= 9) {
      setQuizFeedback("よい説明です。もう少し具体例を入れるとわかりやすいです。");
    } else {
      setQuizFeedback("キーワードを1つ以上追加し、実際の場面を書くと良くなります。");
    }
  };

  const renderMainByTab = () => {
    if (tab === "settings") {
      return (
        <SettingsScreen
          lang={state.lang}
          fontScale={state.fontScale}
          accuracy={accuracy}
          studyMinutes={state.studyMinutes}
          streak={state.streak}
          onSetLang={(lang) => setState((prev) => ({ ...prev, lang }))}
          onDecreaseFont={() =>
            setState((prev) => ({
              ...prev,
              fontScale: Math.max(0.8, Math.min(1.4, prev.fontScale - 0.1)),
            }))
          }
          onIncreaseFont={() =>
            setState((prev) => ({
              ...prev,
              fontScale: Math.max(0.8, Math.min(1.4, prev.fontScale + 0.1)),
            }))
          }
          onResetFont={() => setState((prev) => ({ ...prev, fontScale: 1 }))}
          onResetProgress={resetProgress}
        />
      );
    }
    if (tab === "categories") {
      return (
        <CategoryScreen
          domainProgress={domainProgress}
          terms={TERMS}
          onOpenTermDetail={openTermDetail}
        />
      );
    }
    if (tab === "quiz") {
      return (
        <QuizScreen
          quizTerm={quizTerm}
          quizAnswer={quizAnswer}
          quizFeedback={quizFeedback}
          quizScore={quizScore}
          onChangeAnswer={setQuizAnswer}
          onGradeQuiz={gradeQuiz}
          onNextQuiz={() => pickNextQuizTerm(false)}
          onAutoReview={() => pickNextQuizTerm(true)}
        />
      );
    }
    if (tab === "record") {
      return (
        <RecordScreen
          accuracy={accuracy}
          studyMinutes={state.studyMinutes}
          streak={state.streak}
          weakTermRows={weakTermRows}
          favoriteCount={favoriteTerms.length}
          historyCount={state.history.length}
          recentTerms={recentTerms}
          onOpenTermDetail={openTermDetail}
        />
      );
    }
    return (
      <HomeScreen
        search={search}
        onSearchChange={setSearch}
        filteredTerms={filteredTerms}
        todayWord={todayWord}
        streak={state.streak}
        dailyDone={state.dailyQuizDoneDate === todayKey()}
        onOpenTermDetail={openTermDetail}
      />
    );
  };

  const renderMainPanel = () => (
    <View style={styles.mainPanel}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {renderMainByTab()}
      </ScrollView>
      <BottomNav tab={tab} onChangeTab={setTab} />
    </View>
  );

  return (
    <FontScaleProvider value={state.fontScale}>
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        {isDesktop ? (
          <View style={styles.desktopWrap}>
            <View style={styles.desktopLeft}>{renderMainPanel()}</View>
            <View style={styles.desktopRight}>
              <DetailScreen
                selectedTerm={selectedTerm}
                isDesktop={true}
                lang={state.lang}
                isFavorite={Boolean(state.favorites[selectedTerm.id])}
                onBack={() => undefined}
                onSetLang={(lang) => setState((prev) => ({ ...prev, lang }))}
                onMarkLearned={() => markLearned(selectedTerm.id)}
                onSpeak={speakTerm}
                onToggleFavorite={() => toggleFavorite(selectedTerm.id)}
              />
            </View>
          </View>
        ) : showDetailMobile ? (
          <DetailScreen
            selectedTerm={selectedTerm}
            isDesktop={false}
            lang={state.lang}
            isFavorite={Boolean(state.favorites[selectedTerm.id])}
            onBack={() => setShowDetailMobile(false)}
            onSetLang={(lang) => setState((prev) => ({ ...prev, lang }))}
            onMarkLearned={() => markLearned(selectedTerm.id)}
            onSpeak={speakTerm}
            onToggleFavorite={() => toggleFavorite(selectedTerm.id)}
          />
        ) : (
          renderMainPanel()
        )}
      </SafeAreaView>
    </FontScaleProvider>
  );
}
