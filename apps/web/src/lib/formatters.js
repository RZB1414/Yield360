export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value ?? 0));
}

export function formatPercent(value) {
  return `${Number(value ?? 0).toFixed(2)}%`;
}

export function formatPlainNumber(value, fractionDigits = 0) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(Number(value ?? 0));
}

export function formatTableNumber(value) {
  return formatPlainNumber(value, 2);
}

export function formatLocalizedNumber(value, fractionDigits = 2) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(Number(value ?? 0));
}

export function parseLocalizedNumber(value) {
  if (value == null) {
    return '';
  }

  const text = String(value).trim();

  if (!text) {
    return '';
  }

  const hasComma = text.includes(',');
  const hasDot = text.includes('.');
  let normalized = text.replace(/[^0-9,.-]/g, '');

  if (hasComma && hasDot) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    normalized = normalized.replace(',', '.');
  } else if (hasDot) {
    normalized = normalized.replace(/\./g, '');
  }

  const numericValue = Number(normalized);

  return Number.isFinite(numericValue) ? String(numericValue) : '';
}

function parseValidDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatDate(value) {
  const date = parseValidDate(value);

  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export function formatDateOnly(value) {
  const date = parseValidDate(value);

  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR').format(date);
}