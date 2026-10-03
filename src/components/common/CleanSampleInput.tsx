import React, { useState, useEffect } from 'react';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | null | undefined;
  onChangeValue: (val: number | null) => void;
  placeholder?: string;
  className?: string;
}

/**
 * CleanSampleInput handles measurement sample values (e.g. S1-S5 in SPC charts).
 * Allows values to be null (empty) or valid decimals.
 * Never locks the user with an undeletable '0'.
 */
export const CleanSampleInput: React.FC<Props> = ({
  value,
  onChangeValue,
  placeholder = '-',
  className = '',
  onFocus,
  onBlur,
  ...restProps
}) => {
  const [internalText, setInternalText] = useState<string>(() => {
    if (value === null || value === undefined) return '';
    return String(value);
  });
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      if (value === null || value === undefined) {
        setInternalText('');
      } else {
        setInternalText(String(value));
      }
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInternalText(raw);

    // If completely cleared or just minus
    if (raw === '' || raw === '-') {
      onChangeValue(null);
      return;
    }

    if (raw.endsWith('.')) {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        onChangeValue(parsed);
      }
      return;
    }

    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChangeValue(parsed);
    } else {
      onChangeValue(null);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (internalText === '0' || internalText === '0.000') {
      e.target.select();
    }
    onFocus?.(e);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (internalText === '' || internalText === '-') {
      setInternalText('');
      onChangeValue(null);
    } else {
      const parsed = parseFloat(internalText);
      if (!isNaN(parsed)) {
        setInternalText(String(parsed));
        onChangeValue(parsed);
      } else {
        setInternalText('');
        onChangeValue(null);
      }
    }
    onBlur?.(e);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
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
