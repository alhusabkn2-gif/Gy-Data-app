import { motion } from 'framer-motion';
import { Home, Smartphone, Wallet, Receipt, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/services', label: 'Services', icon: Smartphone },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
  { path: '/transactions', label: 'History', icon: Receipt },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 sm:max-w-md sm:left-1/2 sm:-translate-x-1/2">
      <div className="glass border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-colors"
              >
                {active && (
                  <motion.div
                    layoutId="navActive"
                    className="absolute inset-0 bg-primary-50 dark:bg-primary-500/10 rounded-2xl"
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  />
                )}
                <Icon
                  className={cn(
                    'relative w-5 h-5 transition-colors',
                    active ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500',
                  )}
                />
                <span
                  className={cn(
                    'relative text-[10px] font-medium transition-colors',
                    active ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500',
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
  );
}
