import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary-600 text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700',
      secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700',
      ghost: 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
      danger: 'bg-error-500 text-white hover:bg-error-600 shadow-lg shadow-error-500/25',
    };
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3.5 text-sm',
      lg: 'px-8 py-4 text-base',
    };
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'rounded-2xl font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
export default Button;
