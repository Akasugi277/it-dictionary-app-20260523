import { Level } from "./types";

export function todayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

export function levelColor(level: Level) {
  if (level === "初級") return "#10b981";
  if (level === "中級") return "#f59e0b";
  return "#ef4444";
}
