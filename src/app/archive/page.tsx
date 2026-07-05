import { SiteHeader } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { getDailyPuzzle, formatDate } from "@/lib/daily";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ArchivePage() {
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date;
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold text-stone-50">Daily Archive</h1>
        <p className="mt-2 text-stone-400">Replay the last two weeks of Zaney dailies.</p>

        <ul className="mt-8 space-y-3">
          {days.map((date) => {
            const puzzle = getDailyPuzzle(date);
            return (
              <li key={puzzle.id}>
                <Link
                  href={`/play/${puzzle.id}`}
                  className="flex items-center justify-between rounded-xl border border-stone-800 bg-stone-950 px-4 py-3 hover:border-amber-500/30"
                >
                  <div>
                    <p className="font-medium text-stone-100">{formatDate(date)}</p>
                    <p className="text-sm text-stone-500">{puzzle.title}</p>
                  </div>
                  <Badge className="capitalize">{puzzle.size}</Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
