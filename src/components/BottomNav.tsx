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
import {
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { cn } from '../lib/utils';

const navItems = [
  {
    path: '/',
    label: 'Home',
    icon: Home,
  },
  {
    path: '/services',
    label: 'Services',
    icon: Smartphone,
  },
  {
    path: '/wallet',
    label: 'Wallet',
    icon: Wallet,
  },
  {
    path: '/transactions',
    label: 'History',
    icon: Receipt,
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: User,
  },
];

const LONG_PRESS_TIME = 2000;

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const timerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

  const startAdminHold = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;

      navigate('/super-admin-login', {
        replace: false,
      });
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
      {/* ------------------------------------------------------------------ */}
      {/* BOTTOM NAVIGATION                                                  */}
      {/* ------------------------------------------------------------------ */}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50">
        <div className="mx-auto w-full max-w-md px-3 pb-[max(0.45rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto overflow-hidden rounded-[25px] border border-[#E5E9EF] bg-white/[0.98] p-1.5 shadow-[0_12px_40px_rgba(16,42,86,0.16)] backdrop-blur-xl">

            <div className="flex items-center justify-between gap-1">
              {navItems.map((item) => {
                const active =
                  location.pathname === item.path ||
                  (item.path !== '/' &&
                    location.pathname.startsWith(
                      item.path,
                    ));

                const Icon = item.icon;

                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() =>
                      navigate(item.path)
                    }
                    aria-current={
                      active
                        ? 'page'
                        : undefined
                    }
                    className={cn(
                      'relative flex min-w-0 flex-1 flex-col items-center justify-center rounded-[19px] px-1 py-2 transition-all duration-200',
                      'active:scale-95',
                      active
                        ? 'text-[#102A56]'
                        : 'text-[#8A95A5] hover:text-[#102A56]',
                    )}
                  >
                    {/* ACTIVE BACKGROUND */}

                    {active && (
                      <motion.div
                        layoutId="gy-bottom-nav-active"
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 32,
                        }}
                        className="absolute inset-0 rounded-[19px] bg-[#F5F6F8]"
                      />
                    )}

                    {/* ACTIVE TOP DOT */}

                    {active && (
                      <motion.div
                        layoutId="gy-bottom-nav-dot"
                        className="absolute -top-0.5 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-[#F28C28]"
                      />
                    )}

                    {/* ICON */}

                    <motion.div
                      animate={
                        active
                          ? {
                              y: -1,
                              scale: 1.04,
                            }
                          : {
                              y: 0,
                              scale: 1,
                            }
                      }
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 25,
                      }}
                      className="relative flex h-7 w-7 items-center justify-center"
                    >
                      <Icon
                        className={cn(
                          'h-[19px] w-[19px]',
                          active
                            ? 'stroke-[2.5] text-[#102A56]'
                            : 'stroke-[1.8] text-[#8A95A5]',
                        )}
                      />
                    </motion.div>

                    {/* LABEL */}

                    <span
                      className={cn(
                        'relative mt-0.5 text-[9px] leading-3',
                        active
                          ? 'font-bold text-[#102A56]'
                          : 'font-medium text-[#8A95A5]',
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
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SUPER ADMIN LONG PRESS                                             */}
      {/* ------------------------------------------------------------------ */}

      <button
        type="button"
        aria-label="Super Admin Login"
        onPointerDown={startAdminHold}
        onPointerUp={cancelAdminHold}
        onPointerCancel={cancelAdminHold}
        onPointerLeave={cancelAdminHold}
        onContextMenu={(event) =>
          event.preventDefault()
        }
        className="fixed bottom-24 right-4 z-[99999] flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 shadow-[0_8px_25px_rgba(15,23,42,0.15)] backdrop-blur-md transition-transform active:scale-90 dark:border-slate-700 dark:bg-slate-900/95"
        style={{
          touchAction: 'none',
          WebkitTapHighlightColor:
            'transparent',
        }}
      >
        <ShieldCheck className="h-[19px] w-[19px] text-slate-400 dark:text-slate-500" />
      </button>
    </>
  );
}
