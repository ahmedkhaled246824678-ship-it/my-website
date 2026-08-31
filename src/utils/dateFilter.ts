/**
 * Helper utilities for checking date ranges in accounting records
 */

export function isDateInRange(
  dateStr: string | undefined | null,
  startDate?: string,
  endDate?: string
): boolean {
  if (!startDate && !endDate) return true;
  if (!dateStr) return false;

  // Extract YYYY-MM-DD
  const dateOnly = String(dateStr).trim().slice(0, 10);
  if (!dateOnly || dateOnly === '-' || dateOnly === 'افتتاحي') return true;

  if (startDate && dateOnly < startDate) return false;
  if (endDate && dateOnly > endDate) return false;
  return true;
}

export function formatFilterPeriodDescription(startDate?: string, endDate?: string, defaultLabel?: string): string {
  if (!startDate && !endDate) return defaultLabel || 'كافة الفترات المالية';
  if (startDate && endDate) {
    if (startDate === endDate) return `يوم ${startDate}`;
    return `الفترة من ${startDate} إلى ${endDate}`;
  }
  if (startDate) return `من تاريخ ${startDate} حتى الآن`;
  if (endDate) return `حتى تاريخ ${endDate}`;
  return 'كافة الفترات';
}
