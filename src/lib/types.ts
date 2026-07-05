export type PuzzleSize = "mini" | "medium" | "weekend";

export type Direction = "across" | "down";

export type CrosswordEntry = {
  answer: string;
  clue: string;
  direction: Direction;
  start: [number, number];
  number?: number;
};

export type CrosswordPuzzle = {
  id: string;
  date: string;
  size: PuzzleSize;
  title: string;
  grid: string[][];
  entries: CrosswordEntry[];
  difficulty: number;
};

export type PuzzleIndexEntry = {
  id: string;
  date: string;
  size: PuzzleSize;
  title: string;
  difficulty: number;
};

export type UserProgress = {
  puzzleId: string;
  cells: Record<string, string>;
  elapsedMs: number;
  completedAt?: string;
  hintsUsed: number;
};

export type GameStats = {
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  puzzlesCompleted: number;
};
