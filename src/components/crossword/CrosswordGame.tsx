"use client";

import type { CrosswordPuzzle } from "@/lib/types";
import { cellKey, isBlock } from "@/lib/validator";
import { cn } from "@/lib/utils";
import { useCrosswordGame } from "@/hooks/use-crossword-game";
import { ShareButton } from "@/components/ShareButton";

type CrosswordGameProps = {
  puzzle: CrosswordPuzzle;
};

function formatTime(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getNumberAt(puzzle: CrosswordPuzzle, row: number, col: number): number | null {
  const entry = puzzle.entries.find(
    (e) => e.start[0] === row && e.start[1] === col && e.number,
  );
  return entry?.number ?? null;
}

export function CrosswordGame({ puzzle }: CrosswordGameProps) {
  const game = useCrosswordGame(puzzle);
  const rows = puzzle.grid.length;
  const cols = puzzle.grid[0]?.length ?? 0;
  const cellSize =
    puzzle.size === "weekend" ? 28 : puzzle.size === "medium" ? 32 : 40;

  const across = puzzle.entries
    .filter((e) => e.direction === "across")
    .sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  const down = puzzle.entries
    .filter((e) => e.direction === "down")
    .sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-stone-400">Timer</p>
            <p className="font-mono text-2xl text-amber-300">{formatTime(game.elapsedMs)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={game.checkLetter}
              className="rounded-lg border border-stone-700 px-3 py-2 text-sm hover:bg-stone-900"
            >
              Check letter
            </button>
            <button
              type="button"
              onClick={game.revealLetter}
              className="rounded-lg border border-stone-700 px-3 py-2 text-sm hover:bg-stone-900"
            >
              Reveal letter
            </button>
            <button
              type="button"
              onClick={game.revealWord}
              className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 hover:bg-amber-500/20"
            >
              Hint: reveal word
            </button>
            <button
              type="button"
              onClick={game.clearPuzzle}
              className="rounded-lg border border-stone-700 px-3 py-2 text-sm hover:bg-stone-900"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-950 p-4">
          <div
            className="mx-auto grid w-fit gap-0 border border-stone-700"
            style={{
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            }}
          >
            {Array.from({ length: rows }).map((_, row) =>
              Array.from({ length: cols }).map((__, col) => {
                const cell = puzzle.grid[row]![col]!;
                const key = cellKey(row, col);
                const blocked = isBlock(cell);
                const isSelected =
                  game.selected?.[0] === row && game.selected?.[1] === col;
                const inWord = game.activeCells.has(key);
                const userValue = game.cells[key] ?? "";
                const isChecked = game.checkedCells.has(key);
                const isRevealed = game.revealedCells.has(key);
                const number = getNumberAt(puzzle, row, col);

                if (blocked) {
                  return (
                    <div
                      key={key}
                      style={{ width: cellSize, height: cellSize }}
                      className="bg-stone-900"
                    />
                  );
                }

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => game.selectCell(row, col)}
                    style={{ width: cellSize, height: cellSize }}
                    className={cn(
                      "relative border border-stone-800 bg-stone-950 text-lg font-semibold uppercase transition-colors",
                      inWord && "bg-amber-500/10",
                      isSelected && "ring-2 ring-amber-400 ring-inset",
                      isChecked && "bg-emerald-500/10",
                      isRevealed && "bg-violet-500/10",
                    )}
                  >
                    {number ? (
                      <span className="absolute left-0.5 top-0 text-[9px] font-normal text-stone-500">
                        {number}
                      </span>
                    ) : null}
                    <span>{userValue}</span>
                  </button>
                );
              }),
            )}
          </div>
        </div>

        {game.completed ? (
          <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
            <p>
              Puzzle complete in {formatTime(game.elapsedMs)}!
              {game.hintsUsed > 0 ? ` (${game.hintsUsed} hints used)` : " No hints needed. Legend."}
            </p>
            <ShareButton puzzle={puzzle} elapsedMs={game.elapsedMs} />
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-stone-800 bg-stone-950 p-4">
          <p className="mb-2 text-xs uppercase tracking-widest text-stone-500">
            {game.direction} · {game.activeEntry ? `${game.activeEntry.number}. ${game.activeEntry.clue}` : "Select a cell"}
          </p>
        </div>

        <ClueSection
          title="Across"
          clues={across}
          activeEntry={game.activeEntry}
          onSelect={(entry) => {
            game.setDirection("across");
            game.selectCell(entry.start[0], entry.start[1]);
          }}
        />
        <ClueSection
          title="Down"
          clues={down}
          activeEntry={game.activeEntry}
          onSelect={(entry) => {
            game.setDirection("down");
            game.selectCell(entry.start[0], entry.start[1]);
          }}
        />
      </div>
    </div>
  );
}

function ClueSection({
  title,
  clues,
  activeEntry,
  onSelect,
}: {
  title: string;
  clues: CrosswordPuzzle["entries"];
  activeEntry: CrosswordPuzzle["entries"][number] | null;
  onSelect: (entry: CrosswordPuzzle["entries"][number]) => void;
}) {
  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950 p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-300">
        {title}
      </h3>
      <ol className="space-y-2 text-sm text-stone-300">
        {clues.map((entry) => (
          <li key={`${entry.direction}-${entry.number}-${entry.answer}`}>
            <button
              type="button"
              onClick={() => onSelect(entry)}
              className={cn(
                "w-full rounded-lg px-2 py-1.5 text-left hover:bg-stone-900",
                activeEntry === entry && "bg-amber-500/10 text-amber-100",
              )}
            >
              <span className="font-semibold text-stone-500">{entry.number}.</span>{" "}
              {entry.clue}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
