import { CrosswordGame } from "@/components/crossword/CrosswordGame";
import { AdSlot } from "@/components/AdSlot";
import { SiteHeader } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { getDailyPuzzle, getDailyPuzzleId } from "@/lib/daily";
import { generatePuzzleWithRetry } from "@/lib/generator";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function resolvePuzzle(id: string) {
  const dailyMatch = id.match(/^daily-(\d{4}-\d{2}-\d{2})$/);
  if (dailyMatch) {
    const date = new Date(`${dailyMatch[1]}T12:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    if (getDailyPuzzleId(date) !== id) return null;
    return getDailyPuzzle(date);
  }

  const generatedMatch = id.match(/^(mini|medium|weekend)-(\d+)$/);
  if (generatedMatch) {
    const size = generatedMatch[1] as "mini" | "medium" | "weekend";
    const seed = Number(generatedMatch[2]);
    const puzzle = generatePuzzleWithRetry({ size, seed });
    return puzzle ? { ...puzzle, id } : null;
  }

  return null;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const puzzle = resolvePuzzle(id);
  if (!puzzle) return { title: "Puzzle not found" };

  return {
    title: `${puzzle.title} | Zaney Crossword`,
    description: `Play ${puzzle.title} — a ${puzzle.size} Zaney Crossword with funny clues.`,
    openGraph: {
      title: puzzle.title,
      description: "Can you solve today's Zaney Crossword?",
      url: `/play/${id}`,
    },
  };
}

export default async function PlayPage({ params }: PageProps) {
  const { id } = await params;
  const puzzle = resolvePuzzle(id);
  if (!puzzle) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Badge className="capitalize">{puzzle.size}</Badge>
          {puzzle.date ? <Badge>{puzzle.date}</Badge> : null}
        </div>
        <h1 className="mb-6 text-3xl font-bold text-stone-50">{puzzle.title}</h1>
        <div className="mb-6">
          <AdSlot />
        </div>
        <CrosswordGame puzzle={puzzle} />
      </main>
    </>
  );
}
