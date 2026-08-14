import { motion } from 'framer-motion';
import { ArrowLeft, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showNotification?: boolean;
  onNotificationClick?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  showBack = false,
  showNotification = false,
  onNotificationClick,
  rightContent,
  className = '',
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <header
      className={[
        'relative flex items-center justify-between gap-3 py-4',
        className,
      ].join(' ')}
    >
      {/* LEFT */}

      <div className="flex min-w-0 items-center gap-3">
        {showBack && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={handleBack}
            aria-label="Go back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#071d49] shadow-sm transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
        )}

        <div className="min-w-0">
          <h1 className="truncate font-[Plus_Jakarta_Sans] text-[20px] font-extrabold tracking-tight text-[#071d49]">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* RIGHT */}

      <div className="flex shrink-0 items-center gap-2">
        {rightContent}

        {showNotification && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={onNotificationClick}
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#071d49] shadow-sm transition-colors hover:bg-slate-50"
          >
            <Bell className="h-[18px] w-[18px]" />

            <span className="absolute right-[8px] top-[7px] h-2 w-2 rounded-full border-2 border-white bg-red-500" />
          </motion.button>
        )}
      </div>
    </header>
  );
}
