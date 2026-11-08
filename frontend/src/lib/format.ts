/** Formats a number as Philippine peso, e.g. 1234.5 -> "₱1,234" (or with decimals). */
export function peso(value: number, decimals = 0): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Formats a number with thousands separators. */
export function num(value: number): string {
  return new Intl.NumberFormat("en-PH").format(value);
}

/** Compact peso for chart axes: ₱1.8M, ₱420K. */
export function pesoCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e6) return `₱${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `₱${(value / 1e3).toFixed(0)}K`;
  return peso(value);
}
