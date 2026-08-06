import { type InputHTMLAttributes, forwardRef, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  prefix?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, prefix, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {icon}
            </div>
          )}
          {prefix && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-medium pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200',
              icon ? 'pl-11' : '',
              prefix ? 'pl-12' : '',
              error ? 'border-error-300 dark:border-error-500/50' : 'border-slate-200 dark:border-slate-700',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-sm text-error-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
