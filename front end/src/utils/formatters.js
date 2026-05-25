// ── Currency ──────────────────────────────────────────────────────────────────
// compact=true  → $1.2M / $577K / $45K
// compact=false → $1,200,000 (default)
export const formatCurrency = (value, compact = false) => {
  if (value === null || value === undefined || value === '' || isNaN(Number(value))) return 'N/A';
  const num = Number(value);
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);

  if (compact) {
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(0)}K`;
    return `${sign}$${abs.toFixed(0)}`;
  }

  return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// ── Percent ───────────────────────────────────────────────────────────────────
// Always 1 decimal, always shows sign: +12.4% / -3.1% / 0.0%
export const formatPercent = (value, decimals = 1, showSign = true) => {
  if (value === null || value === undefined || isNaN(Number(value))) return 'N/A';
  const num = Number(value);
  const sign = showSign && num > 0 ? '+' : '';
  return `${sign}${num.toFixed(decimals)}%`;
};

// ── Plain number ──────────────────────────────────────────────────────────────
// Locale-aware with commas, configurable decimals
export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || isNaN(Number(value))) return 'N/A';
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// ── Date ──────────────────────────────────────────────────────────────────────
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
