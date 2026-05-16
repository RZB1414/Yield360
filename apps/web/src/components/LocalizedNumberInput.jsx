import { useCallback, useEffect, useState } from 'react';
import { formatLocalizedNumber, parseLocalizedNumber } from '../lib/formatters.js';

function formatTypingValue(rawValue, fractionDigits, allowBlank) {
  const digitsOnly = String(rawValue ?? '').replace(/\D/g, '');

  if (!digitsOnly) {
    return allowBlank ? '' : formatLocalizedNumber(0, fractionDigits);
  }

  const numericValue = Number(digitsOnly) / 10 ** fractionDigits;
  return formatLocalizedNumber(numericValue, fractionDigits);
}

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
  allowBlank = false,
  clearOnFocus = false,
  formatWhileTyping = true
}) {
  const isLocked = readOnly || disabled;
  const [isFocused, setIsFocused] = useState(false);
  const [hasClearedOnFocus, setHasClearedOnFocus] = useState(false);
  const [displayValue, setDisplayValue] = useState(() => {
    if (allowBlank && (value === '' || value == null)) {
      return '';
    }

    return formatLocalizedNumber(value, fractionDigits);
  });

  const formatDisplay = useCallback((nextValue) => {
    if (allowBlank && (nextValue === '' || nextValue == null)) {
      return '';
    }

    return formatLocalizedNumber(nextValue, fractionDigits);
  }, [allowBlank, fractionDigits]);

  function formatEditableValue(nextValue) {
    if (allowBlank && (nextValue === '' || nextValue == null)) {
      return '';
    }

    const formattedValue = formatLocalizedNumber(nextValue, fractionDigits);
    return formattedValue.replace(/\./g, '');
  }

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatDisplay(value));
    }
  }, [formatDisplay, isFocused, value]);

  useEffect(() => {
    if (!isFocused) {
      setHasClearedOnFocus(false);
    }
  }, [isFocused]);

  function emitChange(rawValue) {
    if (!onChange) {
      return;
    }

    const normalizedValue = parseLocalizedNumber(rawValue);
    onChange({ target: { value: normalizedValue } });
  }

  function handleChange(event) {
    const nextValue = event.target.value;
    const formattedValue = formatWhileTyping
      ? formatTypingValue(nextValue, fractionDigits, allowBlank)
      : nextValue;

    setDisplayValue(formattedValue);
    emitChange(formattedValue);
  }

  function handleFocus() {
    if (!isLocked) {
      setIsFocused(true);

      if (clearOnFocus && !hasClearedOnFocus) {
        const shouldAlwaysClear = clearOnFocus === 'always';
        const normalizedCurrentValue = parseLocalizedNumber(value);

        if (shouldAlwaysClear || normalizedCurrentValue === '' || Number(normalizedCurrentValue) === 0) {
          setDisplayValue('');
          if (formatWhileTyping) {
            emitChange('');
          }
        } else if (formatWhileTyping) {
          setDisplayValue(formatEditableValue(value));
        } else {
          setDisplayValue(String(value ?? ''));
        }

        setHasClearedOnFocus(true);
      }
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
