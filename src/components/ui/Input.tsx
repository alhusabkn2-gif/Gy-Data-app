import {
  type InputHTMLAttributes,
  forwardRef,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/utils';

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  prefix?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      icon,
      prefix,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-[#14213D]">
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A95A5]">
              {icon}
            </div>
          )}

          {prefix && (
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#8A95A5]">
              {prefix}
            </span>
          )}

          <input
            ref={ref}
            className={cn(
              'w-full rounded-2xl border bg-[#F7F8FA] px-4 py-3.5 text-[#14213D] placeholder-[#8A95A5] transition-all duration-200 focus:border-[#102A56] focus:outline-none focus:ring-2 focus:ring-[#102A56]/10',
              icon ? 'pl-11' : '',
              prefix ? 'pl-12' : '',
              error
                ? 'border-[#DC3545]'
                : 'border-[#E4E8EE]',
              className,
            )}
            {...props}
          />
        </div>

        {error && (
          <p className="mt-1.5 text-sm text-[#DC3545]">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
