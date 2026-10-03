/**
 * Utility functions for clean measurement formatting.
 * Adapts to user input without forcing arbitrary trailing zeroes (e.g. 0.5 stays 0.5, not 0.500).
 */

export function formatMeasurement(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '-';
  // Avoid floating point precision issues (e.g. 0.50000000001) while preserving natural digits
  const rounded = Math.round(val * 10000) / 10000;
  return rounded.toString();
}

export function formatTolerance(nominal: number, tolPlus: number, tolMinus: number): string {
  const nomStr = formatMeasurement(nominal);
  if (tolPlus === tolMinus) {
    return `${nomStr} ±${formatMeasurement(tolPlus)}`;
  }
  return `${nomStr} (+${formatMeasurement(tolPlus)} / -${formatMeasurement(tolMinus)})`;
}
