export function formatNumber(value: number, digits = 2) {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString("id-ID", { maximumFractionDigits: digits });
}

export function formatRupiah(value: number) {
  if (!Number.isFinite(value)) return "Rp -";
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

export function formatDate(epochSeconds: number) {
  if (!epochSeconds) return "-";
  return new Date(epochSeconds * 1000).toLocaleString("id-ID");
}
