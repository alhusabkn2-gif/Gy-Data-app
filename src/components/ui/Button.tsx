import {
  ButtonHTMLAttributes,
  ReactNode,
} from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success';

type ButtonSize =
  | 'sm'
  | 'md'
  | 'lg'
  | 'icon';

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses: Record<
  ButtonVariant,
  string
> = {
  primary:
    'bg-[#071d49] text-white shadow-lg shadow-[#071d49]/20 hover:bg-[#0b2a63] focus-visible:ring-[#071d49]/20',

  secondary:
    'border border-slate-200 bg-white text-[#071d49] shadow-sm hover:bg-slate-50 focus-visible:ring-slate-300',

  outline:
    'border border-[#071d49] bg-transparent text-[#071d49] hover:bg-[#071d49] hover:text-white focus-visible:ring-[#071d49]/20',

  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-[#071d49] focus-visible:ring-slate-200',

  danger:
    'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600 focus-visible:ring-red-500/20',

  success:
    'bg-green-500 text-white shadow-lg shadow-green-500/20 hover:bg-green-600 focus-visible:ring-green-500/20',
};

const sizeClasses: Record<
  ButtonSize,
  string
> = {
  sm:
    'min-h-[38px] rounded-xl px-3.5 text-xs',

  md:
    'min-h-[46px] rounded-2xl px-5 text-sm',

  lg:
    'min-h-[54px] rounded-2xl px-6 text-sm',

  icon:
    'h-11 w-11 rounded-2xl p-0',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled =
    disabled || loading;

  return (
    <button
      {...props}
      type={type}
      disabled={isDisabled}
      aria-busy={
        loading ? 'true' : undefined
      }
      className={cn(
        'relative inline-flex items-center justify-center gap-2',
        'font-bold tracking-[-0.01em]',
        'outline-none select-none',
        'transition-all duration-200',
        'active:scale-[0.98]',
        'focus-visible:ring-4',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />

          <span>
            Please wait...
          </span>
        </>
      ) : (
        <>
          {leftIcon && (
            <span className="shrink-0">
              {leftIcon}
            </span>
          )}

          {children && (
            <span className="truncate">
              {children}
            </span>
          )}

          {rightIcon && (
            <span className="shrink-0">
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  );
}
