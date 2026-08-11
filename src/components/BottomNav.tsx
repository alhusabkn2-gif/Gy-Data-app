import { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  Smartphone,
  Wallet,
  Receipt,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/services', label: 'Services', icon: Smartphone },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
  { path: '/transactions', label: 'History', icon: Receipt },
  { path: '/profile', label: 'Profile', icon: User },
];

const LONG_PRESS_TIME = 2000;

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLongPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      navigate('/super-admin-login');
    }, LONG_PRESS_TIME);
  };

  const stopLongPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:max-w-md sm:left-1/2 sm:-translate-x-1/2">
        <div className="glass border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const active =
                location.pathname === item.path ||
                (item.path !== '/' &&
                  location.pathname.startsWith(item.path));

              const Icon = item.icon;

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="relative flex flex-col items-center gap-1 rounded-2xl px-4 py-2 transition-colors"
                >
                  {active && (
                    <motion.div
                      layoutId="navActive"
                      className="absolute inset-0 rounded-2xl bg-primary-50 dark:bg-primary-500/10"
                    />
                  )}

                  <Icon
                    className={cn(
                      'relative h-5 w-5',
                      active
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-slate-400 dark:text-slate-500',
                    )}
                  />

                  <span
                    className={cn(
                      'relative text-[10px] font-medium',
                      active
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-slate-400 dark:text-slate-500',
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Super Admin access */}
      <button
        type="button"
        aria-label="Super Admin Login"
        onTouchStart={(e) => {
          e.preventDefault();
          startLongPress();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          stopLongPress();
        }}
        onTouchCancel={stopLongPress}
        onMouseDown={startLongPress}
        onMouseUp={stopLongPress}
        onMouseLeave={stopLongPress}
        onContextMenu={(e) => e.preventDefault()}
        className="fixed bottom-24 right-4 z-[9999] flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
        style={{
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <ShieldCheck className="h-5 w-5 text-slate-300 dark:text-slate-600" />
      </button>
    </>
  );
}
