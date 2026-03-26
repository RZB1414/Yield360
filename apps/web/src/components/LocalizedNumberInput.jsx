import { useEffect, useRef, useState } from 'react';
import { formatLocalizedNumber, parseLocalizedNumber } from '../lib/formatters.js';

function formatIntegerPart(digits) {
  if (!digits) {
    return '';
  }

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function liveFormat(raw) {
  const cleaned = raw.replace(/[^\d,]/g, '');

  if (!cleaned) {
    return '';
  }

  const commaIndex = cleaned.indexOf(',');

  if (commaIndex === -1) {
    return formatIntegerPart(cleaned);
  }

  const intPart = cleaned.slice(0, commaIndex);
  const decPart = cleaned.slice(commaIndex + 1).replace(/,/g, '');

  return `${formatIntegerPart(intPart || '0')},${decPart}`;
}

function countChar(str, char) {
  let count = 0;

  for (let i = 0; i < str.length; i += 1) {
    if (str[i] === char) {
      count += 1;
    }
  }

  return count;
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
  allowBlank = false
}) {
  const isLocked = readOnly || disabled;
  const inputRef = useRef(null);
  const cursorRef = useRef(null);
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

  useEffect(() => {
    if (cursorRef.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(cursorRef.current, cursorRef.current);
      cursorRef.current = null;
    }
  });

  function emitChange(rawValue) {
    if (!onChange) {
      return;
    }

    const normalizedValue = parseLocalizedNumber(rawValue);
    onChange({ target: { value: normalizedValue } });
  }

  function handleChange(event) {
    const rawInput = event.target.value;
    const cursorPosition = event.target.selectionStart;

    if (rawInput.replace(/[^\d,]/g, '') === '') {
      setDisplayValue('');
      emitChange('0');
      cursorRef.current = 0;
      return;
    }

    const oldDotsBeforeCursor = countChar(rawInput.slice(0, cursorPosition), '.');
    const formatted = liveFormat(rawInput);
    const digitsBeforeCursor = cursorPosition - oldDotsBeforeCursor;

    let newCursor = 0;
    let digitsSeen = 0;

    for (let i = 0; i < formatted.length; i += 1) {
      if (digitsSeen >= digitsBeforeCursor) {
        break;
      }

      newCursor = i + 1;

      if (formatted[i] !== '.') {
        digitsSeen += 1;
      }
    }

    setDisplayValue(formatted);
    emitChange(formatted);
    cursorRef.current = Math.min(newCursor, formatted.length);
  }

  function handleFocus() {
    if (!isLocked) {
      setIsFocused(true);
      const numericValue = Number(parseLocalizedNumber(String(value ?? '')));

      if (numericValue === 0) {
        setDisplayValue('');
      } else {
        // If it has value, make sure it is rendered in raw live format, not full format.
        // But since they just focused, we can keep the formatted version for now until they type.
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
      ref={inputRef}
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