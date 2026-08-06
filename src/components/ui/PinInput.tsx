import { useRef, useEffect, type KeyboardEvent } from 'react';
import { cn } from '../../lib/utils';

interface PinInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: boolean;
  autoFocus?: boolean;
}

export default function PinInput({ length, value, onChange, onComplete, error, autoFocus = true }: PinInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && refs.current[0]) refs.current[0].focus();
  }, [autoFocus]);

  const chars = value.split('');

  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, '').slice(-1);
    const newArr = [...chars];
    newArr[i] = digit;
    const newVal = newArr.join('').slice(0, length);
    onChange(newVal);
    if (digit && i < length - 1 && refs.current[i + 1]) {
      refs.current[i + 1]!.focus();
    }
    if (newVal.length === length && onComplete) onComplete(newVal);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !chars[i] && i > 0 && refs.current[i - 1]) {
      refs.current[i - 1]!.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    if (pasted.length === length && onComplete) onComplete(pasted);
    if (refs.current[Math.min(pasted.length, length - 1)]) {
      refs.current[Math.min(pasted.length, length - 1)]!.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={chars[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            'w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-2xl border-2 transition-all duration-200 focus:outline-none',
            error
              ? 'border-error-300 dark:border-error-500/50 bg-error-50 dark:bg-error-500/10'
              : chars[i]
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300'
              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100',
            'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
          )}
        />
      ))}
    </div>
  );
}
