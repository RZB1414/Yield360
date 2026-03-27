import { useEffect, useState } from 'react';
import { formatLocalizedNumber, parseLocalizedNumber } from '../lib/formatters.js';

export function LocalizedNumberInput({
  value,
  onChange,
  readOnly = false,
  disabled = false,
  step,
  min,
  fieldPath,
  hasError = false,
  fractionDigits = 2,
  className,
  allowBlank = false
}) {
  const isLocked = readOnly || disabled;
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(() => {
    if (allowBlank && (value === '' || value == null)) {
      return '';
    }

    return formatLocalizedNumber(value, fractionDigits);
  });

  function formatDisplay(nextValue) {
    if (allowBlank && (nextValue === '' || nextValue == null)) {
      return '';
    }

    return formatLocalizedNumber(nextValue, fractionDigits);
  }

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatDisplay(value));
    }
  }, [allowBlank, fractionDigits, isFocused, value]);

  function emitChange(rawValue) {
    if (!onChange) {
      return;
    }

    const normalizedValue = parseLocalizedNumber(rawValue);
    onChange({ target: { value: normalizedValue } });
  }

  function handleChange(event) {
    const nextValue = event.target.value;
    setDisplayValue(nextValue);
    emitChange(nextValue);
  }

  function handleFocus() {
    if (!isLocked) {
      setIsFocused(true);
    }
  }

  function handleBlur() {
    if (!isLocked) {
      setIsFocused(false);
      setDisplayValue(formatDisplay(value));
    }
  }

  return (
    <input
      className={className}
      type="text"
      inputMode="decimal"
      step={step}
      min={min}
      value={isLocked ? formatDisplay(value) : displayValue}
      onChange={isLocked ? undefined : handleChange}
      onFocus={isLocked ? undefined : handleFocus}
      onBlur={isLocked ? undefined : handleBlur}
      readOnly={readOnly}
      disabled={disabled}
      data-field-path={fieldPath}
      aria-invalid={hasError}
    />
  );
}