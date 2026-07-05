"use client";

import { getShareText, getShareUrl } from "@/lib/daily";
import type { CrosswordPuzzle } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Share2, Copy, MessageCircle } from "lucide-react";
import { useState } from "react";

type ShareButtonProps = {
  puzzle: CrosswordPuzzle;
  elapsedMs: number;
};

export function ShareButton({ puzzle, elapsedMs }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const text = getShareText(puzzle, elapsedMs);
  const url = getShareUrl(puzzle.id);

  async function handleShare() {
    const payload = { title: "Zaney Crossword", text, url };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
  const smsUrl = `sms:?&body=${encodeURIComponent(`${text} ${url}`)}`;

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={handleShare}>
        <Share2 className="h-4 w-4" />
        {copied ? "Copied!" : "Share result"}
      </Button>
      <Button variant="outline" onClick={copyLink}>
        <Copy className="h-4 w-4" />
        Copy link
      </Button>
      <Button variant="outline" asChild>
        <a href={whatsappUrl} target="_blank" rel="noreferrer">
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
      </Button>
      <Button variant="outline" asChild>
        <a href={smsUrl}>iMessage / SMS</a>
      </Button>
    </div>
  );
}
