import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  showBack = true,
  rightAction,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E9EF] bg-white/95 backdrop-blur-md">
      <div className="flex min-h-[60px] items-center justify-between px-4">

        <div className="flex min-w-0 items-center gap-3">

          {showBack && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E9EEF5] text-[#102A56] transition active:scale-95"
              aria-label="Go back"
            >
              <ArrowLeft
                className="h-[18px] w-[18px]"
                strokeWidth={2.3}
              />
            </button>
          )}

          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-extrabold text-[#102A56]">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-0.5 truncate text-[10px] font-medium text-[#8A95A5]">
                {subtitle}
              </p>
            )}
          </div>

        </div>

        {rightAction && (
          <div className="ml-3 shrink-0 text-[#F28C28]">
            {rightAction}
          </div>
        )}

      </div>
    </header>
  );
}
