# Zaney Crossword

Daily mini, medium, and weekend giant crosswords with funny clues. Built with Next.js and deployable on Vercel.

## Features (MVP)

- Crossword grid with across/down clues
- Keyboard input, check letter, reveal letter, hint ladder (reveal word)
- Timer and local progress saving
- Daily puzzle (mini Mon–Tue, medium Wed–Fri, weekend giant Sat–Sun)
- Share via Web Share API, WhatsApp, iMessage/SMS, or copy link
- Puzzle generator page + batch script for 10,000+ validated puzzles
- Google AdSense slot (enable with env var)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Generate puzzle bank

Every generated puzzle is validated before save — no unfinishable grids.

```bash
npm run generate:puzzles -- --count=10000
```

Output: `public/puzzles/index.json` + individual puzzle JSON files.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import in [Vercel](https://vercel.com/new)
3. Set environment variables:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXX
```

## Project structure

```
src/
  app/              # Pages (daily, play, archive, generator)
  components/       # Game UI, ads, sharing
  hooks/            # Game state hook
  lib/              # Generator, validator, clues, daily logic
scripts/
  generate-puzzles.ts
public/puzzles/     # Pre-generated puzzle bank (after running script)
```

## Data model

```ts
type CrosswordPuzzle = {
  id: string;
  date: string;
  size: "mini" | "medium" | "weekend";
  title: string;
  grid: string[][];
  entries: {
    answer: string;
    clue: string;
    direction: "across" | "down";
    start: [number, number];
    number?: number;
  }[];
  difficulty: number;
};
```

## Roadmap

- AI clue variants
- Cryptic mode
- Pop culture packs
- Community submissions
- Constructor dashboard
- Streak-based difficulty scaling in UI
