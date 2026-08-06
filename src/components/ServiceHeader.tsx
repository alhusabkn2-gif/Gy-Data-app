import { type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChevronLeft, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function ServiceHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-800 dark:via-primary-900 dark:to-slate-950 px-5 pt-10 pb-24 overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex items-center gap-3"
      >
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all ring-1 ring-white/10"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-display text-white">{title}</h1>
          <p className="text-white/60 text-xs">{subtitle}</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-1 ring-white/10">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative mt-5 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/10"
      >
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white/50 text-[10px] font-medium uppercase tracking-wider">Wallet Balance</p>
          <p className="text-white font-bold font-display text-base">{formatCurrency(user?.wallet_balance || 0)}</p>
        </div>
      </motion.div>
    </div>
  );
}
