import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, View, useWindowDimensions } from "react-native";
import { BottomNav } from "./src/components/BottomNav";
import { Header } from "./src/components/Header";
import { APP_STATE_KEY, TERMS, initialState } from "./src/data";
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

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(APP_STATE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<AppState>;
        setState({ ...initialState, ...parsed });
      } catch {
        setState(initialState);
      }
    };
    load();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [state]);

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
      return <CategoryScreen domainProgress={domainProgress} />;
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
