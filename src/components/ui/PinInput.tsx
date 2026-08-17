 import {
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';
import { cn } from '../../lib/utils';

interface PinInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}

export default function PinInput({
  length,
  value,
  onChange,
  onComplete,
  error = false,
  autoFocus = true,
  disabled = false,
}: PinInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const cleanValue = String(value || '')
    .replace(/\D/g, '')
    .slice(0, length);

  useEffect(() => {
    if (
      autoFocus &&
      !disabled &&
      inputRef.current
    ) {
      const timer = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 120);

      return () => window.clearTimeout(timer);
    }
  }, [autoFocus, disabled]);

  const focusInput = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextValue = event.target.value
      .replace(/\D/g, '')
      .slice(0, length);

    onChange(nextValue);

    if (
      nextValue.length === length &&
      onComplete
    ) {
      onComplete(nextValue);
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();

      if (
        cleanValue.length === length &&
        onComplete
      ) {
        onComplete(cleanValue);
      }
    }
  };

  const handlePaste = (
    event: ClipboardEvent<HTMLInputElement>,
  ) => {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, length);

    onChange(pasted);

    if (
      pasted.length === length &&
      onComplete
    ) {
      onComplete(pasted);
    }

    focusInput();
  };

  return (
    <div
      className="relative w-full"
      onClick={focusInput}
    >
      {/* REAL KEYBOARD INPUT */}
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        autoComplete="one-time-code"
        enterKeyHint="done"
        value={cleanValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        disabled={disabled}
        maxLength={length}
        aria-label="PIN"
        className="
          absolute
          inset-0
          z-20
          h-full
          w-full
          cursor-text
          opacity-0
        "
      />

      {/* VISUAL PIN BOXES */}
      <div
        className="
          relative
          z-10
          flex
          w-full
          justify-center
          gap-2
          sm:gap-3
          pointer-events-none
        "
      >
        {Array.from({ length }).map((_, index) => {
          const digit =
            cleanValue[index] || '';

          const isCurrent =
            cleanValue.length === index &&
            cleanValue.length < length;

          return (
            <div
              key={index}
              className={cn(
                `
                  flex
                  h-14
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  border-2
                  text-2xl
                  font-black
                  transition-all
                  duration-200
                  sm:h-16
                  sm:w-14
                `,
                error
                  ? `
                    border-red-400
                    bg-red-50
                    text-red-700
                  `
                  : digit
                  ? `
                    border-blue-600
                    bg-blue-50
                    text-blue-700
                    shadow-sm
                  `
                  : isCurrent
                  ? `
                    border-blue-500
                    bg-white
                    shadow-[0_0_0_3px_rgba(37,99,235,0.10)]
                  `
                  : `
                    border-slate-200
                    bg-slate-50
                    text-slate-900
                  `,
              )}
            >
              {digit || ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}
