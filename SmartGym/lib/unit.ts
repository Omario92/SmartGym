/**
 * Weight conversion utilities
 * Stored internally as kg (standard metrics), converted on-the-fly for display.
 */

export function getDisplayWeight(weightKg: number, unit: 'kg' | 'lbs'): number {
  if (!weightKg) return 0;
  if (unit === 'lbs') {
    return Math.round(weightKg * 2.20462);
  }
  // Keep 1 decimal place for kg if it has decimals (e.g. 7.5 kg)
  return Math.round(weightKg * 10) / 10;
}

export function getInputWeightInKg(weight: number, unit: 'kg' | 'lbs'): number {
  if (!weight) return 0;
  if (unit === 'lbs') {
    return Math.round((weight / 2.20462) * 10) / 10;
  }
  return Math.round(weight * 10) / 10;
}

export function formatWeight(weightKg: number, unit: 'kg' | 'lbs', showUnit = true): string {
  if (!weightKg) return '';
  const displayVal = getDisplayWeight(weightKg, unit);
  return `${displayVal}${showUnit ? (unit === 'lbs' ? ' lbs' : ' kg') : ''}`;
}
