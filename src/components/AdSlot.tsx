"use client";

/**
 * Google AdSense placeholder.
 * 1. Sign up at https://www.google.com/adsense/
 * 2. Add NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXX to .env.local
 * 3. Replace the placeholder below with your ad unit slot ID
 */
export function AdSlot({ slot = "0000000000" }: { slot?: string }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  if (!client) {
    return (
      <div className="flex min-h-[90px] items-center justify-center rounded-xl border border-dashed border-stone-700 bg-stone-950/50 px-4 text-center text-sm text-stone-500">
        Ad slot — set <code className="text-amber-300">NEXT_PUBLIC_ADSENSE_CLIENT</code> to enable Google Ads
      </div>
    );
  }

  return (
    <ins
      className="adsbygoogle block min-h-[90px] rounded-xl border border-stone-800 bg-stone-950"
      style={{ display: "block" }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
