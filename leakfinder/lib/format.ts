// Indian-format currency helpers.

/** Full ₹ with Indian digit grouping, e.g. 1234567 -> "₹12,34,567". */
export function inr(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

/** Compact ₹ in lakh/crore for headlines, e.g. 12300000 -> "₹1.23 Cr". */
export function inrCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  if (abs >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return "₹" + Math.round(n).toString();
}
