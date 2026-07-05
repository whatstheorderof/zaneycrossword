"use client";

import type { CrosswordEntry, CrosswordPuzzle, Direction, GameStats } from "@/lib/types";
import { cellKey, getEntryCells, isBlock } from "@/lib/validator";
import { useCallback, useEffect, useMemo, useState } from "react";

const STATS_KEY = "zaney-crossword-stats";
const PROGRESS_PREFIX = "zaney-crossword-progress-";

export function loadStats(): GameStats {
  if (typeof window === "undefined") {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastPlayedDate: null,
      puzzlesCompleted: 0,
    };
  }
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) ?? "null") ?? {
      currentStreak: 0,
      longestStreak: 0,
      lastPlayedDate: null,
      puzzlesCompleted: 0,
    };
  } catch {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastPlayedDate: null,
      puzzlesCompleted: 0,
    };
  }
}

export function saveStats(stats: GameStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function loadProgress(puzzleId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(`${PROGRESS_PREFIX}${puzzleId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed.cells ?? {};
  } catch {
    return {};
  }
}

function saveProgress(
  puzzleId: string,
  cells: Record<string, string>,
  elapsedMs: number,
  completedAt?: string,
) {
  localStorage.setItem(
    `${PROGRESS_PREFIX}${puzzleId}`,
    JSON.stringify({ cells, elapsedMs, completedAt }),
  );
}

function findEntryAt(
  entries: CrosswordEntry[],
  row: number,
  col: number,
  direction: Direction,
): CrosswordEntry | null {
  return (
    entries.find((entry) => {
      if (entry.direction !== direction) return false;
      const cells = getEntryCells(entry);
      return cells.some(([r, c]) => r === row && c === col);
    }) ?? null
  );
}

export function useCrosswordGame(puzzle: CrosswordPuzzle) {
  const [cells, setCells] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [direction, setDirection] = useState<Direction>("across");
  const [checkedCells, setCheckedCells] = useState<Set<string>>(new Set());
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [hintsUsed, setHintsUsed] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const saved = loadProgress(puzzle.id);
    setCells(saved);
    setSelected(null);
    setDirection("across");
    setCheckedCells(new Set());
    setRevealedCells(new Set());
    setHintsUsed(0);
    setElapsedMs(0);
    setRunning(true);
    setCompleted(false);
  }, [puzzle.id]);

  useEffect(() => {
    if (!running || completed) return;
    const timer = window.setInterval(() => {
      setElapsedMs((prev) => prev + 1000);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, completed]);

  const activeEntry = useMemo(() => {
    if (!selected) return null;
    const [row, col] = selected;
    return (
      findEntryAt(puzzle.entries, row, col, direction) ??
      findEntryAt(
        puzzle.entries,
        row,
        col,
        direction === "across" ? "down" : "across",
      )
    );
  }, [selected, direction, puzzle.entries]);

  const activeCells = useMemo(() => {
    if (!activeEntry) return new Set<string>();
    return new Set(getEntryCells(activeEntry).map(([r, c]) => cellKey(r, c)));
  }, [activeEntry]);

  const solutionMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of puzzle.entries) {
      for (const [r, c] of getEntryCells(entry)) {
        const idx = getEntryCells(entry).findIndex(([rr, cc]) => rr === r && cc === c);
        map.set(cellKey(r, c), entry.answer[idx]!);
      }
    }
    return map;
  }, [puzzle.entries]);

  const checkCompletion = useCallback(
    (nextCells: Record<string, string>) => {
      for (const [key, letter] of solutionMap.entries()) {
        if ((nextCells[key] ?? "").toUpperCase() !== letter) {
          return false;
        }
      }
      return true;
    },
    [solutionMap],
  );

  const persist = useCallback(
    (nextCells: Record<string, string>, done = false) => {
      saveProgress(puzzle.id, nextCells, elapsedMs, done ? new Date().toISOString() : undefined);
    },
    [puzzle.id, elapsedMs],
  );

  const selectCell = useCallback(
    (row: number, col: number) => {
      if (isBlock(puzzle.grid[row]?.[col])) return;

      if (selected && selected[0] === row && selected[1] === col) {
        setDirection((d) => (d === "across" ? "down" : "across"));
      } else {
        setSelected([row, col]);
        const across = findEntryAt(puzzle.entries, row, col, "across");
        const down = findEntryAt(puzzle.entries, row, col, "down");
        if (direction === "across" && across) setDirection("across");
        else if (direction === "down" && down) setDirection("down");
        else if (across) setDirection("across");
        else if (down) setDirection("down");
      }
    },
    [puzzle.entries, puzzle.grid, selected, direction],
  );

  const setCellValue = useCallback(
    (row: number, col: number, value: string) => {
      const key = cellKey(row, col);
      const next = { ...cells, [key]: value.toUpperCase().slice(-1) };
      if (!value) delete next[key];
      setCells(next);
      persist(next);

      if (checkCompletion(next)) {
        setCompleted(true);
        setRunning(false);
        persist(next, true);
      }
    },
    [cells, persist, checkCompletion],
  );

  const moveSelection = useCallback(
    (deltaRow: number, deltaCol: number) => {
      if (!selected) return;
      let [row, col] = selected;
      const rows = puzzle.grid.length;
      const cols = puzzle.grid[0]?.length ?? 0;

      for (let step = 0; step < rows * cols; step++) {
        row += deltaRow;
        col += deltaCol;
        if (row < 0 || col < 0 || row >= rows || col >= cols) return;
        if (!isBlock(puzzle.grid[row]![col])) {
          selectCell(row, col);
          return;
        }
      }
    },
    [selected, puzzle.grid, selectCell],
  );

  const advanceInWord = useCallback(
    (backwards = false) => {
      if (!activeEntry || !selected) return;
      const entryCells = getEntryCells(activeEntry);
      const idx = entryCells.findIndex(([r, c]) => r === selected[0] && c === selected[1]);
      const nextIdx = backwards ? idx - 1 : idx + 1;
      if (nextIdx >= 0 && nextIdx < entryCells.length) {
        const [r, c] = entryCells[nextIdx]!;
        setSelected([r, c]);
      }
    },
    [activeEntry, selected],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!selected) return;
      const [row, col] = selected;

      if (event.key === "Tab") {
        event.preventDefault();
        setDirection((d) => (d === "across" ? "down" : "across"));
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (direction === "across") moveSelection(0, 1);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (direction === "across") moveSelection(0, -1);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (direction === "down") moveSelection(1, 0);
        else setDirection("down");
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (direction === "down") moveSelection(-1, 0);
        else setDirection("across");
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        const hadValue = Boolean(cells[cellKey(row, col)]);
        setCellValue(row, col, "");
        if (!hadValue) advanceInWord(true);
        return;
      }

      if (/^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
        setCellValue(row, col, event.key);
        advanceInWord(false);
      }
    },
    [selected, direction, moveSelection, setCellValue, cells, advanceInWord],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const checkLetter = useCallback(() => {
    if (!selected) return;
    const [row, col] = selected;
    const key = cellKey(row, col);
    const correct = solutionMap.get(key);
    if (!correct) return;
    const nextChecked = new Set(checkedCells);
    nextChecked.add(key);
    setCheckedCells(nextChecked);
    if ((cells[key] ?? "").toUpperCase() !== correct) {
      const next = { ...cells, [key]: correct };
      setCells(next);
      persist(next);
    }
  }, [selected, solutionMap, checkedCells, cells, persist]);

  const revealLetter = useCallback(() => {
    if (!selected) return;
    const [row, col] = selected;
    const key = cellKey(row, col);
    const correct = solutionMap.get(key);
    if (!correct) return;
    const next = { ...cells, [key]: correct };
    setCells(next);
    setRevealedCells(new Set(revealedCells).add(key));
    setHintsUsed((h) => h + 1);
    persist(next);
    if (checkCompletion(next)) {
      setCompleted(true);
      setRunning(false);
      persist(next, true);
    }
  }, [selected, solutionMap, cells, revealedCells, persist, checkCompletion]);

  const revealWord = useCallback(() => {
    if (!activeEntry) return;
    const next = { ...cells };
    for (const [r, c] of getEntryCells(activeEntry)) {
      const key = cellKey(r, c);
      next[key] = solutionMap.get(key) ?? "";
    }
    setCells(next);
    setHintsUsed((h) => h + 1);
    persist(next);
    if (checkCompletion(next)) {
      setCompleted(true);
      setRunning(false);
      persist(next, true);
    }
  }, [activeEntry, cells, solutionMap, persist, checkCompletion]);

  const clearPuzzle = useCallback(() => {
    setCells({});
    setCheckedCells(new Set());
    setRevealedCells(new Set());
    setHintsUsed(0);
    setElapsedMs(0);
    setRunning(true);
    setCompleted(false);
    persist({});
  }, [persist]);

  return {
    cells,
    selected,
    direction,
    activeEntry,
    activeCells,
    checkedCells,
    revealedCells,
    hintsUsed,
    elapsedMs,
    completed,
    selectCell,
    setDirection,
    checkLetter,
    revealLetter,
    revealWord,
    clearPuzzle,
  };
}
