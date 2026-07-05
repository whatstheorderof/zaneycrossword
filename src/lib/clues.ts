import type { CrosswordEntry } from "./types";

const TEMPLATES: Record<string, string[]> = {
  mini: [
    [
      ".#...",
      ".....",
      ".....",
      ".....",
      "...#.",
    ].join("\n"),
    [
      "#....",
      ".....",
      ".#.#.",
      ".....",
      "....#",
    ].join("\n"),
    [
      "..#..",
      ".....",
      "#...#",
      ".....",
      "..#..",
    ].join("\n"),
    [
      ".#.#.",
      ".....",
      "..#..",
      ".....",
      ".#.#.",
    ].join("\n"),
  ],
  medium: [
    [
      "....#",
      ".....",
      ".....",
      "#....",
      ".....",
      ".....",
      "....#",
    ].join("\n"),
    [
      ".#...",
      ".....",
      ".....",
      "...#.",
      ".....",
      ".....",
      "...#.",
    ].join("\n"),
    [
      "#....",
      ".....",
      "..#..",
      ".....",
      "....#",
      ".....",
      "..#..",
    ].join("\n"),
  ],
  weekend: [
    [
      ".....#.....",
      ".....#.....",
      ".....#.....",
      "###########",
      ".....#.....",
      ".....#.....",
      ".....#.....",
      "###########",
      ".....#.....",
      ".....#.....",
      ".....#.....",
    ].join("\n"),
    [
      "...#...",
      ".......",
      ".......",
      ".#####.",
      ".......",
      ".#####.",
      ".......",
      ".......",
      "...#...",
    ].join("\n"),
  ],
};

const FUNNY_CLUE_TEMPLATES = [
  "What your group chat thinks this means ({len})",
  "Honestly just vibes ({len})",
  "Your aunt's favorite word, probably ({len})",
  "Sounds fake but is real ({len})",
  "The answer your brain refused until 2am ({len})",
  "Main character energy, {len} letters",
  "Would absolutely win a pub quiz round ({len})",
  "The kind of word that shows up in crosswords ({len})",
  "Not a Pokémon, but close enough ({len})",
  "What autocorrect wishes you'd typed ({len})",
  "Extremely crossword-coded ({len})",
  "Your therapist's notes, abbreviated ({len})",
  "A word with unnecessary confidence ({len})",
  "The plot twist in a cozy mystery ({len})",
  "Something you'd shout on a game show ({len})",
];

const CLUE_HINTS: Record<string, string[]> = {
  CAT: ["meows", "has whiskers", "internet royalty"],
  DOG: ["good boy energy", "tail wagging", "fetch enthusiast"],
  SUN: ["center of attention", "tanning sponsor", "daytime star"],
  TEA: ["spilled in drama", "British reputation", "steeping business"],
  BED: ["nap headquarters", "alarm clock rival", "pillow zone"],
  RUN: ["cardio optional", "escape plan", "shoelace test"],
  ART: ["museums love it", "subjective chaos", "frame-worthy"],
  EGG: ["breakfast icon", "omelette starter", "fragile round thing"],
  ICE: ["cube life", "cold shoulder material", "slip hazard"],
  RED: ["stop sign color", "very dramatic", "apple classic"],
  ACE: ["pilot nickname", "card shark favorite", "nailed it"],
  JOY: ["pure serotonin", "holiday movie ending", "dopamine delivery"],
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function generateFunnyClue(word: string, seed: number): string {
  const upper = word.toUpperCase();
  const hints = CLUE_HINTS[upper];
  if (hints && hints.length > 0) {
    const hint = hints[seed % hints.length]!;
    return `${hint.charAt(0).toUpperCase()}${hint.slice(1)} (${upper.length})`;
  }

  const template =
    FUNNY_CLUE_TEMPLATES[seed % FUNNY_CLUE_TEMPLATES.length]!;
  return template.replace("{len}", String(upper.length));
}

export function getTemplate(size: "mini" | "medium" | "weekend", index: number): string {
  const templates = TEMPLATES[size];
  return templates[index % templates.length]!;
}

export function parseTemplate(template: string): {
  rows: number;
  cols: number;
  blocks: string[][];
  slots: { direction: "across" | "down"; cells: [number, number][] }[];
} {
  const lines = template.trim().split("\n");
  const rows = lines.length;
  const cols = lines[0]!.length;
  const blocks = lines.map((line) =>
    line.split("").map((ch) => (ch === "#" ? "#" : ".")),
  );

  const slots: { direction: "across" | "down"; cells: [number, number][] }[] = [];

  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      if (blocks[r]![c] === "#") {
        c++;
        continue;
      }
      const cells: [number, number][] = [];
      while (c < cols && blocks[r]![c] !== "#") {
        cells.push([r, c]);
        c++;
      }
      if (cells.length >= 2) {
        slots.push({ direction: "across", cells });
      }
    }
  }

  for (let c = 0; c < cols; c++) {
    let r = 0;
    while (r < rows) {
      if (blocks[r]![c] === "#") {
        r++;
        continue;
      }
      const cells: [number, number][] = [];
      while (r < rows && blocks[r]![c] !== "#") {
        cells.push([r, c]);
        r++;
      }
      if (cells.length >= 2) {
        slots.push({ direction: "down", cells });
      }
    }
  }

  return { rows, cols, blocks, slots };
}

export function buildEntriesFromAssignment(
  slots: { direction: "across" | "down"; cells: [number, number][] }[],
  assignment: string[],
  seed: number,
): CrosswordEntry[] {
  return slots.map((slot, i) => {
    const answer = assignment[i]!.toUpperCase();
    const [startRow, startCol] = slot.cells[0]!;
    return {
      answer,
      clue: generateFunnyClue(answer, seed + i * 17 + hashString(answer)),
      direction: slot.direction,
      start: [startRow, startCol] as [number, number],
    };
  });
}
