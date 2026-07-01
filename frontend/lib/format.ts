export function formatAmount(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
