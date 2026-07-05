import { CrosswordGame } from "@/components/crossword/CrosswordGame";
import { AdSlot } from "@/components/AdSlot";
import { SiteHeader } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDailyPuzzle, getDailySize, formatDate } from "@/lib/daily";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const today = new Date();
  const puzzle = getDailyPuzzle(today);
  const size = getDailySize(today);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge>Daily Puzzle</Badge>
              <Badge className="border-stone-600 bg-stone-900 text-stone-300">
                {formatDate(today)}
              </Badge>
              <Badge className="border-stone-600 bg-stone-900 capitalize text-stone-300">
                {size}
              </Badge>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-stone-50">
              {puzzle.title}
            </h1>
            <p className="mt-2 max-w-2xl text-stone-400">
              Solve across and down with Zaney&apos;s unhinged-but-fair clue style.
              Mini Mon–Tue, medium midweek, weekend giants on Sat–Sun.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How to play</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-stone-400">
              <p>Click a cell, type letters, use arrow keys to move.</p>
              <p>Tap the same cell again to flip across/down.</p>
              <p>Check letter, reveal letter, or burn a hint on a whole word.</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <AdSlot />
        </div>

        <CrosswordGame puzzle={puzzle} />

        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link href="/archive" className="text-amber-300 hover:underline">
            Play past dailies →
          </Link>
          <Link href="/generator" className="text-amber-300 hover:underline">
            Generate a custom puzzle →
          </Link>
        </div>
      </main>
    </>
  );
}
