import React, { useState, useEffect, useRef } from 'react';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | null | undefined;
  onChangeValue: (val: number) => void;
  allowDecimals?: boolean;
  min?: number;
  max?: number;
  step?: string | number;
  placeholder?: string;
  emptyAsZero?: boolean;
}

/**
 * CleanNumberInput completely eliminates the "undeletable 0" bug in React controlled inputs.
 * Features:
 * 1. When a user deletes a value or backspaces, it becomes an empty string "" cleanly.
 * 2. It never forcibly restores an unwanted '0' on blur or re-render if the user intended to clear it.
 * 3. The parent receives 0 for mathematical calculations, but the input displays empty string
 *    with a subtle, elegant placeholder (e.g. placeholder="0" or "0.000").
 * 4. Decimals (like 0.5, .25) can be typed naturally without focus jumps.
 * 5. Backspacing a '0' removes it instantly.
 */
export const CleanNumberInput: React.FC<Props> = ({
  value,
  onChangeValue,
  allowDecimals = true,
  min,
  max,
  step,
  placeholder = '0',
  emptyAsZero = true,
  className = '',
  onFocus,
  onBlur,
  ...restProps
}) => {
  // If value is null, undefined, or 0, initialize as empty string so the placeholder
  // displays cleanly without locking the user with a sticky '0'.
  const [internalText, setInternalText] = useState<string>(() => {
    if (value === null || value === undefined) return '';
    if (value === 0) return '';
    return String(value);
  });

  const [isFocused, setIsFocused] = useState(false);
  const isClearedByUserRef = useRef<boolean>(value === 0 || value === null || value === undefined);

  // Sync internal text when prop value changes from the outside while not focused
  useEffect(() => {
    if (!isFocused) {
      if (value === null || value === undefined) {
        setInternalText('');
        isClearedByUserRef.current = true;
      } else if (value === 0) {
        // If it's zero and was cleared by user, keep it empty string
        if (isClearedByUserRef.current || internalText === '') {
          setInternalText('');
        } else {
          // If explicitly set to 0 externally, still show empty so placeholder shows cleanly
          setInternalText('');
        }
      } else {
        // Non-zero value from parent
        setInternalText(String(value));
        isClearedByUserRef.current = false;
      }
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInternalText(raw);

    // If user completely deleted the content (empty string) or typed just minus
    if (raw === '' || raw === '-') {
      isClearedByUserRef.current = true;
      onChangeValue(0);
      return;
    }

    isClearedByUserRef.current = false;

    // Allow user to type '0' or trailing dot without premature parsing jumps
    if (raw === '0') {
      onChangeValue(0);
      return;
    }

    if (raw.endsWith('.')) {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        onChangeValue(parsed);
      }
      return;
    }

    const parsed = allowDecimals ? parseFloat(raw) : parseInt(raw, 10);
    if (!isNaN(parsed)) {
      let finalVal = parsed;
      if (min !== undefined && finalVal < min) finalVal = min;
      if (max !== undefined && finalVal > max) finalVal = max;
      onChangeValue(finalVal);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // If the input holds '0', select all so typing immediately replaces it,
    // or backspacing immediately clears it.
    if (internalText === '0') {
      e.target.select();
    }
    onFocus?.(e);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);

    if (internalText === '' || internalText === '-' || internalText === '0') {
      isClearedByUserRef.current = true;
      setInternalText('');
      onChangeValue(0);
    } else {
      const parsed = allowDecimals ? parseFloat(internalText) : parseInt(internalText, 10);
      if (!isNaN(parsed)) {
        if (parsed === 0) {
          // Zero is displayed as empty so placeholder shows cleanly
          setInternalText('');
          isClearedByUserRef.current = true;
          onChangeValue(0);
        } else {
          setInternalText(String(parsed));
          isClearedByUserRef.current = false;
          onChangeValue(parsed);
        }
      } else {
        setInternalText('');
        isClearedByUserRef.current = true;
        onChangeValue(0);
      }
    }
    onBlur?.(e);
  };

  return (
    <input
      type="text"
      inputMode={allowDecimals ? 'decimal' : 'numeric'}
      value={internalText}
      onChange={handleChange}
      onFocus={handleInputFocus}
      onBlur={handleInputBlur}
      placeholder={placeholder}
      className={className}
      {...restProps}
    />
  );
};
