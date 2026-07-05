import {
  buildEntriesFromAssignment,
  getTemplate,
  parseTemplate,
} from "./clues";
import type { CrosswordPuzzle, PuzzleSize } from "./types";
import {
  assignClueNumbers,
  puzzleToGridFromEntries,
  validatePuzzle,
} from "./validator";
import { getWordsByLength } from "./words";

export type GeneratorOptions = {
  size: PuzzleSize;
  seed: number;
  templateIndex?: number;
  difficulty?: number;
};

type Slot = { direction: "across" | "down"; cells: [number, number][] };

const candidateCache = new Map<string, string[]>();

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function constraintsKey(constraints: (string | null)[]): string {
  return constraints.map((c) => c ?? ".").join("");
}

function getCandidates(length: number, letterConstraints: (string | null)[]): string[] {
  const key = `${length}:${constraintsKey(letterConstraints)}`;
  const cached = candidateCache.get(key);
  if (cached) return cached;

  const words = getWordsByLength(length).filter((word) => {
    if (word.length !== length) return false;
    for (let i = 0; i < letterConstraints.length; i++) {
      const constraint = letterConstraints[i];
      if (constraint && word[i] !== constraint) return false;
    }
    return true;
  });

  candidateCache.set(key, words);
  return words;
}

function getConstraints(
  slotIndex: number,
  slots: Slot[],
  assignment: string[],
): (string | null)[] {
  const slot = slots[slotIndex]!;
  return slot.cells.map((_, i) => {
    for (let prev = 0; prev < slots.length; prev++) {
      if (!assignment[prev]) continue;
      const prevSlot = slots[prev]!;
      const overlapIndex = prevSlot.cells.findIndex(
        ([r, c]) => slot.cells[i]![0] === r && slot.cells[i]![1] === c,
      );
      if (overlapIndex >= 0) {
        return assignment[prev]![overlapIndex]!.toUpperCase();
      }
    }
    return null;
  });
}

function pickNextSlot(slots: Slot[], assignment: string[], rand: () => number): number {
  let bestIndex = -1;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let i = 0; i < slots.length; i++) {
    if (assignment[i]) continue;
    const constraints = getConstraints(i, slots, assignment);
    const count = getCandidates(slots[i]!.cells.length, constraints).length;
    const known = constraints.filter(Boolean).length;
    const score = count - known * 0.01 + rand() * 0.001;
    if (score < bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function greedyFill(
  slots: Slot[],
  seed: number,
  maxRounds: number,
): string[] | null {
  for (let round = 0; round < maxRounds; round++) {
    const assignment = new Array<string>(slots.length).fill("");
    const usedWords = new Set<string>();
    let failed = false;

    const order = slots
      .map((slot, index) => ({ index, length: slot.cells.length }))
      .sort((a, b) => a.length - b.length || a.index - b.index);

    for (const { index } of order) {
      const constraints = getConstraints(index, slots, assignment);
      const candidates = getCandidates(slots[index]!.cells.length, constraints).filter(
        (word) => !usedWords.has(word),
      );
      if (!candidates.length) {
        failed = true;
        break;
      }

      const pick =
        candidates[(seed + index * 997 + round * 131) % candidates.length]!;
      assignment[index] = pick;
      usedWords.add(pick);
    }

    if (!failed) return assignment;
  }

  return null;
}

function solveSlots(
  slots: Slot[],
  assignment: string[],
  usedWords: Set<string>,
  rand: () => number,
): string[] | null {
  const slotIndex = pickNextSlot(slots, assignment, rand);
  if (slotIndex < 0) return [...assignment];

  const slot = slots[slotIndex]!;
  const constraints = getConstraints(slotIndex, slots, assignment);
  const candidates = shuffle(
    getCandidates(slot.cells.length, constraints),
    rand,
  ).filter((word) => !usedWords.has(word));

  const limit = slot.cells.length <= 4 ? 80 : 40;
  for (const word of candidates.slice(0, limit)) {
    assignment[slotIndex] = word;
    usedWords.add(word);
    const result = solveSlots(slots, assignment, usedWords, rand);
    if (result) return result;
    usedWords.delete(word);
    assignment[slotIndex] = "";
  }

  return null;
}

export function generatePuzzle(options: GeneratorOptions): CrosswordPuzzle | null {
  const { size, seed } = options;
  const rand = mulberry32(seed);
  const templateIndex =
    options.templateIndex ?? Math.floor(rand() * 1000) % 5;
  const template = getTemplate(size, templateIndex);
  const { rows, cols, blocks, slots } = parseTemplate(template);

  const solved =
    greedyFill(slots, seed, 400) ??
    (() => {
      const assignment = new Array<string>(slots.length).fill("");
      const usedWords = new Set<string>();
      return solveSlots(slots, assignment, usedWords, rand);
    })();

  if (!solved) return null;

  const entries = buildEntriesFromAssignment(slots, solved, seed);
  const grid = puzzleToGridFromEntries(rows, cols, entries, blocks);

  const puzzle: CrosswordPuzzle = assignClueNumbers({
    id: `${size}-${seed}`,
    date: "",
    size,
    title: `Zaney ${size.charAt(0).toUpperCase()}${size.slice(1)} #${seed}`,
    grid,
    entries,
    difficulty: options.difficulty ?? Math.min(5, 1 + Math.floor(slots.length / 8)),
  });

  const validation = validatePuzzle(puzzle);
  if (!validation.valid) {
    return null;
  }

  return puzzle;
}

export function generatePuzzleWithRetry(
  options: GeneratorOptions,
  maxAttempts = 40,
): CrosswordPuzzle | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const puzzle = generatePuzzle({
      ...options,
      seed: options.seed + attempt * 997,
      templateIndex: (options.templateIndex ?? 0) + attempt,
    });
    if (puzzle) return puzzle;
  }
  return null;
}

export function clearGeneratorCache() {
  candidateCache.clear();
}
