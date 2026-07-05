"use client";

import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generatePuzzleWithRetry } from "@/lib/generator";
import type { CrosswordPuzzle, PuzzleSize } from "@/lib/types";
import { validatePuzzle } from "@/lib/validator";
import Link from "next/link";
import { useMemo, useState } from "react";

const SIZES: PuzzleSize[] = ["mini", "medium", "weekend"];

export default function GeneratorPage() {
  const [size, setSize] = useState<PuzzleSize>("mini");
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 900_000) + 1000);
  const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null);
  const [status, setStatus] = useState<string>("");

  const validation = useMemo(
    () => (puzzle ? validatePuzzle(puzzle) : null),
    [puzzle],
  );

  function handleGenerate() {
    setStatus("Generating...");
    const result = generatePuzzleWithRetry({ size, seed });
    if (!result) {
      setPuzzle(null);
      setStatus("Could not generate a valid puzzle for this seed. Try another seed.");
      return;
    }
    setPuzzle(result);
    setStatus(`Generated ${result.entries.length} entries. Valid: ${validatePuzzle(result).valid}`);
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold text-stone-50">Puzzle Generator</h1>
        <p className="mt-2 text-stone-400">
          Generate validated, completable crosswords. Every puzzle passes the solver check before it ships.
        </p>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Build a puzzle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {SIZES.map((option) => (
                <Button
                  key={option}
                  variant={size === option ? "default" : "outline"}
                  onClick={() => setSize(option)}
                  className="capitalize"
                >
                  {option}
                </Button>
              ))}
            </div>

            <label className="block text-sm text-stone-400">
              Seed
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-stone-100"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleGenerate}>Generate</Button>
              <Button
                variant="outline"
                onClick={() => setSeed(Math.floor(Math.random() * 900_000) + 1000)}
              >
                Random seed
              </Button>
            </div>

            {status ? <p className="text-sm text-stone-400">{status}</p> : null}

            {puzzle && validation ? (
              <div className="rounded-xl border border-stone-800 bg-stone-950 p-4 text-sm">
                <p className="font-medium text-stone-200">{puzzle.title}</p>
                <p className="text-stone-400">
                  Grid {puzzle.grid.length}×{puzzle.grid[0]?.length} · {puzzle.entries.length} clues ·
                  difficulty {puzzle.difficulty}
                </p>
                <p className={validation.valid ? "text-emerald-400" : "text-red-400"}>
                  {validation.valid ? "✓ Completable & valid" : `✗ ${validation.errors.join(", ")}`}
                </p>
                <Link
                  href={`/play/${puzzle.id}`}
                  className="mt-3 inline-block text-amber-300 hover:underline"
                >
                  Play this puzzle →
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Batch generation (10,000+)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-stone-400">
            <p>Run locally to build the puzzle bank:</p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-stone-900 p-3 text-amber-200">
              npm run generate:puzzles -- --count 10000
            </pre>
            <p className="mt-3">
              Output goes to <code className="text-amber-300">public/puzzles/</code> with an index file.
              Only validated puzzles are written.
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
