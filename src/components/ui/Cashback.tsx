import { motion } from 'framer-motion';
import { Sparkles, Gift } from 'lucide-react';
import { cn } from '../../lib/utils';

export function CashbackBadge({ percentage, className }: { percentage: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold shadow-sm',
        className,
      )}
    >
      <Sparkles className="w-2.5 h-2.5" />
      Earn {percentage}% Cashback
    </motion.div>
  );
}

export function CashbackCard({ balance, className }: { balance: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={cn(
        'relative rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-5 overflow-hidden shadow-xl shadow-orange-500/20',
        className,
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Gift className="w-4 h-4 text-white" />
          </div>
          <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Cashback Balance</p>
        </div>
        <p className="text-white text-2xl font-bold font-display">
          ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-white/60 text-[11px] mt-1.5">Earn cashback on eligible transactions</p>
      </div>
    </motion.div>
  );
}

export function CashbackEarned({ amount, className }: { amount: number; className?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20', className)}>
      <Gift className="w-3 h-3 text-amber-500" />
      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">+₦{amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
      <span className="text-[10px] text-amber-500/70">cashback</span>
    </div>
  );
}
