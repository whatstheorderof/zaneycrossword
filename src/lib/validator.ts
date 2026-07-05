import type { CrosswordEntry, CrosswordPuzzle } from "./types";

const BLOCK = "#";

export function isBlock(cell: string | undefined): boolean {
  return !cell || cell === BLOCK;
}

export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function getEntryCells(entry: CrosswordEntry): [number, number][] {
  const cells: [number, number][] = [];
  const [startRow, startCol] = entry.start;
  const delta: [number, number] =
    entry.direction === "across" ? [0, 1] : [1, 0];

  for (let i = 0; i < entry.answer.length; i++) {
    cells.push([startRow + delta[0] * i, startCol + delta[1] * i]);
  }
  return cells;
}

export function validatePuzzle(puzzle: CrosswordPuzzle): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const { grid, entries } = puzzle;

  if (!grid.length || !grid[0]?.length) {
    return { valid: false, errors: ["Grid is empty"] };
  }

  const rows = grid.length;
  const cols = grid[0].length;

  if (!grid.every((row) => row.length === cols)) {
    errors.push("Grid rows have inconsistent widths");
  }

  const covered = new Set<string>();

  for (const entry of entries) {
    const answer = entry.answer.toUpperCase();
    if (answer.length < 2) {
      errors.push(`Entry "${answer}" is too short`);
      continue;
    }

    const cells = getEntryCells({ ...entry, answer });
    if (cells.length !== answer.length) {
      errors.push(`Entry "${answer}" cell count mismatch`);
    }

    for (let i = 0; i < cells.length; i++) {
      const [r, c] = cells[i]!;
      if (r < 0 || c < 0 || r >= rows || c >= cols) {
        errors.push(`Entry "${answer}" goes out of bounds`);
        continue;
      }

      const gridCell = grid[r]![c]!;
      if (isBlock(gridCell)) {
        errors.push(`Entry "${answer}" crosses a block at ${r},${c}`);
      }

      if (gridCell !== BLOCK && gridCell !== answer[i]) {
        errors.push(
          `Entry "${answer}" conflicts at ${r},${c}: grid has "${gridCell}", expected "${answer[i]}"`,
        );
      }

      covered.add(cellKey(r, c));
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r]![c]!;
      if (!isBlock(cell) && !covered.has(cellKey(r, c))) {
        errors.push(`Uncovered white cell at ${r},${c}`);
      }
    }
  }

  const whiteCells = rows * cols - grid.flat().filter(isBlock).length;
  if (covered.size !== whiteCells) {
    errors.push("Not all white cells belong to an entry");
  }

  return { valid: errors.length === 0, errors };
}

export function assignClueNumbers(puzzle: CrosswordPuzzle): CrosswordPuzzle {
  const numbers = new Map<string, number>();
  let next = 1;

  const sorted = [...puzzle.entries].sort((a, b) => {
    const [ar, ac] = a.start;
    const [br, bc] = b.start;
    return ar - br || ac - bc;
  });

  for (const entry of sorted) {
    const key = cellKey(entry.start[0], entry.start[1]);
    if (!numbers.has(key)) {
      numbers.set(key, next++);
    }
  }

  return {
    ...puzzle,
    entries: puzzle.entries.map((entry) => ({
      ...entry,
      number: numbers.get(cellKey(entry.start[0], entry.start[1])),
    })),
  };
}

export function puzzleToGridFromEntries(
  rows: number,
  cols: number,
  entries: CrosswordEntry[],
  blocks: string[][],
): string[][] {
  const grid = blocks.map((row) => [...row]);

  for (const entry of entries) {
    const cells = getEntryCells(entry);
    for (let i = 0; i < cells.length; i++) {
      const [r, c] = cells[i]!;
      grid[r]![c] = entry.answer[i]!;
    }
  }

  return grid;
}
