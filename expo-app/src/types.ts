export type Level = "初級" | "中級" | "上級";
export type Domain = "ストラテジ系" | "マネジメント系" | "テクノロジ系";
export type Lang = "ja" | "en" | "zh";
export type TabKey = "home" | "categories" | "quiz" | "record" | "settings";

export type Term = {
  id: string;
  term: string;
  reading: string;
  level: Level;
  domain: Domain;
  category: string;
  icon: string;
  easy: string;
  example: string;
  workplace: string;
  translations: {
    en: string;
    zh: string;
  };
  keywords: string[];
  related: string[];
};

export type AppState = {
  stateVersion: number;
  learnedCount: Record<string, number>;
  weakTerms: Record<string, number>;
  favorites: Record<string, boolean>;
  history: string[];
  attempts: number;
  correct: number;
  studyMinutes: number;
  streak: number;
  lastStudyDate: string;
  dailyQuizDoneDate: string;
  lang: Lang;
  fontScale: number;
};

export type WeakTermRow = {
  id: string;
  label: string;
  count: number;
};
