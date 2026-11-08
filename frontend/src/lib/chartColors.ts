/**
 * Chart fills reuse the Tailwind theme tokens as CSS variables so the six
 * charts and the chips all draw the same channel/category colors.
 */
export const CHANNEL_COLORS: Record<string, string> = {
  "Facebook and Instagram Ads": "var(--color-ch-facebook)",
  "TikTok Creator Collabs": "var(--color-ch-tiktok)",
  "Discord and Gaming Community Sponsorships": "var(--color-ch-discord)",
  "Campus Pop-up Booths": "var(--color-ch-popup)",
};

export const CHART_FALLBACK = "var(--color-ink-500)";

/** One color per loyalty tier, toned steps of the accent violet. */
export const TIER_COLORS: Record<string, string> = {
  Bronze: "#d08c60",
  Silver: "#94a3b8",
  Gold: "#eab308",
};

export const ACCENT = "var(--color-accent-600)";
export const ACCENT_SOFT = "var(--color-accent-100)";
