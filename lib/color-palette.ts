export const SITE_COLOR_PALETTE = [
  "#6366F1",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#14B8A6",
  "#A855F7",
] as const;

/**
 * Returns the next color in the palette, cycling based on how many sites already exist.
 */
export function nextSiteColor(existingCount: number): string {
  return SITE_COLOR_PALETTE[existingCount % SITE_COLOR_PALETTE.length];
}

/**
 * Convert a hex color to an rgba string with the given alpha. Used for tint backgrounds.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
