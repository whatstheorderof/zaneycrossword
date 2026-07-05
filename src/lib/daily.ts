import type { CrosswordPuzzle, PuzzleSize } from "./types";
import { generatePuzzleWithRetry } from "./generator";

const puzzleCache = new Map<string, CrosswordPuzzle>();

const SIZE_BY_WEEKDAY: Record<number, PuzzleSize> = {
  0: "weekend",
  1: "mini",
  2: "mini",
  3: "medium",
  4: "medium",
  5: "medium",
  6: "weekend",
};

function hashDate(date: string): number {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash * 31 + date.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getDailySize(date: Date): PuzzleSize {
  return SIZE_BY_WEEKDAY[date.getDay()] ?? "mini";
}

export function getDailyPuzzleId(date: Date): string {
  return `daily-${formatDate(date)}`;
}

export function getDailyPuzzle(date: Date = new Date()): CrosswordPuzzle {
  const dateStr = formatDate(date);
  const cacheKey = `daily-${dateStr}`;
  const cached = puzzleCache.get(cacheKey);
  if (cached) return cached;

  const size = getDailySize(date);
  const seed = hashDate(dateStr) % 900_000 + 1000;

  const puzzle =
    generatePuzzleWithRetry({ size, seed, difficulty: getDifficultyForStreak(0) }, 15) ??
    generatePuzzleWithRetry({ size: "mini", seed: seed + 42 }, 15)!;

  const result = {
    ...puzzle,
    id: getDailyPuzzleId(date),
    date: dateStr,
    title: `Zaney Daily — ${dateStr}`,
  };
  puzzleCache.set(cacheKey, result);
  return result;
}

export function getDifficultyForStreak(streak: number): number {
  if (streak < 3) return 1;
  if (streak < 7) return 2;
  if (streak < 14) return 3;
  if (streak < 30) return 4;
  return 5;
}

export function getShareText(puzzle: CrosswordPuzzle, elapsedMs: number): string {
  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);
  const time = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  return `I solved today's Zaney Crossword (${puzzle.size}) in ${time}! Can you beat me?`;
}

export function getShareUrl(puzzleId: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "https://zaney-crossword.vercel.app";
  return `${base}/play/${puzzleId}`;
}
