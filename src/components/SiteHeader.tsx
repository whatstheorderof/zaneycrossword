import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function SiteHeader() {
  return (
    <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 font-black text-stone-950">
            Z
          </div>
          <div>
            <p className="text-lg font-semibold text-stone-50">Zaney Crossword</p>
            <p className="text-xs text-stone-500">Funny clues. Daily vibes. Big grids on weekends.</p>
          </div>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/" className="text-stone-300 hover:text-amber-300">
            Daily
          </Link>
          <Link href="/archive" className="text-stone-300 hover:text-amber-300">
            Archive
          </Link>
          <Link href="/generator" className="text-stone-300 hover:text-amber-300">
            Generator
          </Link>
          <Badge>MVP</Badge>
        </nav>
      </div>
    </header>
  );
}
