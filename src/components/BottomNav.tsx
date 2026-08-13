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

  const startAdminHold = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      navigate('/super-admin-login', { replace: false });
    }, LONG_PRESS_TIME);
  };

  const cancelAdminHold = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <>
      {/* Normal bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:max-w-md sm:left-1/2 sm:-translate-x-1/2">
        <div className="border-t border-[#18345f] bg-[#07152f] px-2 py-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(7,21,47,0.18)]">
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
                  className="relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors"
                >
                  {active && (
                    <motion.div
                      layoutId="navActive"
                      className="absolute inset-0 rounded-xl bg-white/10"
                    />
                  )}

                  <Icon
                    className={cn(
                      'relative h-[18px] w-[18px]',
                      active
                        ? 'text-white'
                        : 'text-white/45',
                    )}
                  />

                  <span
                    className={cn(
                      'relative text-[9px] font-medium',
                      active
                        ? 'text-white'
                        : 'text-white/45',
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

      {/* Super Admin long-press button */}
      <button
        type="button"
        aria-label="Super Admin Login"
        onPointerDown={startAdminHold}
        onPointerUp={cancelAdminHold}
        onPointerCancel={cancelAdminHold}
        onPointerLeave={cancelAdminHold}
        onContextMenu={(event) => event.preventDefault()}
        className="fixed bottom-24 right-4 z-[99999] flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-300 bg-white shadow-2xl dark:border-slate-600 dark:bg-slate-900"
        style={{
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <ShieldCheck className="h-6 w-6 text-slate-400 dark:text-slate-500" />
      </button>
    </>
  );
}
