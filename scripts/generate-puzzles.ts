#!/usr/bin/env node
/**
 * Fast batch puzzle generator with MRV backtracking (mini grids).
 * Every puzzle is validated before write.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildEntriesFromAssignment,
  getTemplate,
  parseTemplate,
} from "../src/lib/clues.ts";
import type { CrosswordPuzzle, PuzzleIndexEntry, PuzzleSize } from "../src/lib/types.ts";
import {
  assignClueNumbers,
  puzzleToGridFromEntries,
  validatePuzzle,
} from "../src/lib/validator.ts";
import { getWordsByLength } from "../src/lib/words.ts";

type Slot = { direction: "across" | "down"; cells: [number, number][] };

const candidateCache = new Map<string, string[]>();

function constraintKey(len: number, constraints: (string | null)[]): string {
  return `${len}:${constraints.map((c) => c ?? ".").join("")}`;
}

function getCandidates(len: number, constraints: (string | null)[]): string[] {
  const key = constraintKey(len, constraints);
  const hit = candidateCache.get(key);
  if (hit) return hit;
  const words = getWordsByLength(len).filter((word) => {
    for (let i = 0; i < constraints.length; i++) {
      if (constraints[i] && word[i] !== constraints[i]) return false;
    }
    return true;
  });
  candidateCache.set(key, words);
  return words;
}

function getConstraints(slotIndex: number, slots: Slot[], assignment: string[]): (string | null)[] {
  const slot = slots[slotIndex]!;
  return slot.cells.map((_, i) => {
    for (let prev = 0; prev < slots.length; prev++) {
      const word = assignment[prev];
      if (!word) continue;
      const overlap = slots[prev]!.cells.findIndex(
        ([r, c]) => slot.cells[i]![0] === r && slot.cells[i]![1] === c,
      );
      if (overlap >= 0) return word[overlap]!.toUpperCase();
    }
    return null;
  });
}

function pickSlot(slots: Slot[], assignment: string[], seed: number): number {
  let best = -1;
  let bestCount = Number.POSITIVE_INFINITY;
  for (let i = 0; i < slots.length; i++) {
    if (assignment[i]) continue;
    const count = getCandidates(slots[i]!.cells.length, getConstraints(i, slots, assignment)).length;
    if (count < bestCount) {
      bestCount = count;
      best = i;
    }
  }
  return best;
}

function solveMini(
  slots: Slot[],
  assignment: string[],
  used: Set<string>,
  seed: number,
  depth: number,
): boolean {
  if (depth === slots.length) return true;

  const slotIndex = pickSlot(slots, assignment, seed);
  if (slotIndex < 0) return true;

  const constraints = getConstraints(slotIndex, slots, assignment);
  const candidates = getCandidates(slots[slotIndex]!.cells.length, constraints).filter(
    (w) => !used.has(w),
  );

  const start = (seed + depth * 131) % Math.max(candidates.length, 1);
  const limit = Math.min(candidates.length, 30);

  for (let n = 0; n < limit; n++) {
    const word = candidates[(start + n) % candidates.length]!;
    assignment[slotIndex] = word;
    used.add(word);
    if (solveMini(slots, assignment, used, seed, depth + 1)) return true;
    used.delete(word);
    assignment[slotIndex] = "";
  }

  return false;
}

function buildPuzzle(size: PuzzleSize, seed: number, templateIndex: number): CrosswordPuzzle | null {
  const template = getTemplate(size, templateIndex);
  const { rows, cols, blocks, slots } = parseTemplate(template);
  const assignment = new Array<string>(slots.length).fill("");
  const used = new Set<string>();

  if (!solveMini(slots, assignment, used, seed, 0)) return null;

  const entries = buildEntriesFromAssignment(slots, assignment, seed);
  const grid = puzzleToGridFromEntries(rows, cols, entries, blocks);
  const puzzle = assignClueNumbers({
    id: `${size}-${seed}`,
    date: "",
    size,
    title: `Zaney ${size.charAt(0).toUpperCase()}${size.slice(1)} #${seed}`,
    grid,
    entries,
    difficulty: Math.min(5, 1 + Math.floor(slots.length / 8)),
  });

  return validatePuzzle(puzzle).valid ? puzzle : null;
}

const args = process.argv.slice(2);
if (args.includes("--debug")) {
  const puzzle = buildPuzzle("mini", 1000, 0);
  console.log(puzzle ? `ok ${puzzle.entries.length} entries` : "failed");
  process.exit(0);
}

const countFlagIndex = args.findIndex((a) => a === "--count" || a.startsWith("--count="));
let count = 100;
if (countFlagIndex >= 0) {
  const flag = args[countFlagIndex]!;
  count = flag.includes("=") ? Number(flag.split("=")[1]) : Number(args[countFlagIndex + 1] ?? 100);
}

const outDir = join(process.cwd(), "public", "puzzles");
const size: PuzzleSize = "mini";
const templateCount = 4;
const index: PuzzleIndexEntry[] = [];

let generated = 0;
let seed = 1000;
const started = Date.now();
const maxSeed = seed + count * 80;

mkdirSync(outDir, { recursive: true });
console.log(`Generating ${count} validated mini puzzles...`);

while (generated < count && seed < maxSeed) {
  const puzzle = buildPuzzle(size, seed, seed % templateCount);

  if (puzzle) {
    const id = `${size}-${seed}`;
    writeFileSync(join(outDir, `${id}.json`), JSON.stringify({ ...puzzle, id, date: "" }));
    index.push({
      id,
      date: "",
      size,
      title: puzzle.title,
      difficulty: puzzle.difficulty,
    });
    generated++;

    if (generated % 1000 === 0 || generated === count) {
      const elapsed = ((Date.now() - started) / 1000).toFixed(1);
      const rate = (generated / (Date.now() - started) * 1000).toFixed(0);
      console.log(`  ${generated}/${count} (${elapsed}s, ${rate}/s)`);
      writeFileSync(join(outDir, "index.json"), JSON.stringify(index));
      candidateCache.clear();
    }
  }

  seed++;
}

writeFileSync(join(outDir, "index.json"), JSON.stringify(index));
console.log(`Done. ${generated} puzzles in ${((Date.now() - started) / 1000).toFixed(1)}s.`);

if (generated < count) process.exitCode = 1;
