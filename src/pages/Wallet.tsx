import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet as WalletIcon, Eye, EyeOff, Copy, Check, Plus, ArrowDownLeft,
  ArrowUpRight, TrendingUp, RefreshCw, ChevronRight,
  Smartphone, Zap, Tv, GraduationCap, BookOpen, Trophy, Wifi,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { AnimatedCard } from '../components/ui/NetworkLogo';
import { CashbackCard, CashbackEarned } from '../components/ui/Cashback';

const SERVICE_ICONS: Record<string, typeof Smartphone> = {
  data: Smartphone, airtime: Smartphone, electricity: Zap, cable: Tv,
  waec: GraduationCap, jamb: BookOpen, betting: Trophy, smile: Wifi, internet: Wifi,
};

export default function Wallet() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pullStart, setPullStart] = useState(0);
  const [pullDist, setPullDist] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchAll(); }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    const [txRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('phone', user.phone).order('created_at', { ascending: false }).limit(20),
    ]);
    setTransactions(txRes.data || []);
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    await fetchAll();
  };

  // Pull to refresh
  const onTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      setPullStart(e.touches[0].clientY);
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (pullStart > 0) {
      const dist = e.touches[0].clientY - pullStart;
      if (dist > 0) setPullDist(Math.min(dist * 0.5, 80));
    }
  };
  const onTouchEnd = () => {
    if (pullDist > 60) onRefresh();
    setPullStart(0);
    setPullDist(0);
  };

  const copyAccount = () => {
    const acct = user?.phone?.slice(-10) || '';
    navigator.clipboard?.writeText(acct);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const accountNumber = user?.phone?.slice(-10) || '0000000000';

  // Analytics
  const totalSpent = transactions.filter(t => t.type === 'purchase' && t.status === 'success').reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalFunded = transactions.filter(t => t.type === 'funding' && t.status === 'success').reduce((s, t) => s + parseFloat(t.amount), 0);
  const txCount = transactions.filter(t => t.status === 'success').length;
  const cashbackBalance = 1250;

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950"
    >
      {/* Pull indicator */}
      <div className="flex items-center justify-center overflow-hidden" style={{ height: pullDist }}>
        <AnimatePresence>
          {pullDist > 10 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RefreshCw className={`w-5 h-5 text-primary-500 ${refreshing ? 'animate-spin' : ''}`} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="px-5 pt-10">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">My Wallet</h1>
          <button onClick={onRefresh} className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center active:scale-90 transition-all">
            <RefreshCw className={`w-4 h-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </motion.div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your balance and transactions</p>
      </div>

      {/* Wallet Balance Card */}
      <div className="px-5 mt-5">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -3 }}
          className="relative rounded-[28px] overflow-hidden shadow-2xl shadow-primary-900/40"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary-900 to-primary-800" />
          <div className="absolute top-0 right-0 w-56 h-56 bg-primary-500/25 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-44 h-44 bg-accent-500/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <WalletIcon className="w-4 h-4 text-white/50" />
                <p className="text-white/50 text-xs font-medium tracking-wide">Wallet Balance</p>
              </div>
              <button onClick={() => setShowBalance(!showBalance)} className="p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all">
                <AnimatePresence mode="wait">
                  {showBalance ? (
                    <motion.div key="off" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}>
                      <EyeOff className="w-4 h-4 text-white/40" />
                    </motion.div>
                  ) : (
                    <motion.div key="on" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}>
                      <Eye className="w-4 h-4 text-white/40" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={showBalance ? 'show' : 'hide'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <p className="text-white text-[2.25rem] font-bold font-display tracking-tight">
                  {showBalance ? formatCurrency(user?.wallet_balance || 0) : '₦ • • • • • •'}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-end justify-between mt-5">
              <div>
                <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-1.5">Account Number</p>
                <div className="flex items-center gap-2">
                  <span className="text-white text-lg font-semibold font-mono tracking-wider">{accountNumber}</span>
                  <button onClick={copyAccount} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-90 transition-all">
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div key="c" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                          <Check className="w-3.5 h-3.5 text-success-400" />
                        </motion.div>
                      ) : (
                        <motion.div key="cp" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                          <Copy className="w-3.5 h-3.5 text-white/60" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.94 }} onClick={() => navigate('/fund-wallet')}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-primary-700 text-sm font-bold shadow-xl shadow-black/20 hover:bg-primary-50 transition-all">
                <Plus className="w-4 h-4 strokeWidth={2.5}" /> Fund Wallet
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Cashback Card */}
      <div className="px-5 mt-4">
        <CashbackCard balance={cashbackBalance} />
      </div>

      {/* Analytics */}
      <div className="px-5 mt-5">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display mb-3">Analytics</h2>
        <div className="grid grid-cols-3 gap-3">
          <AnimatedCard delay={0.05}>
            <div className="card-premium p-3.5 text-center">
              <div className="w-9 h-9 rounded-xl bg-success-100 dark:bg-success-500/20 flex items-center justify-center mx-auto mb-2">
                <ArrowDownLeft className="w-4.5 h-4.5 text-success-600 dark:text-success-400" />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Funded</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white font-display mt-0.5">{formatCurrency(totalFunded)}</p>
            </div>
          </AnimatedCard>
          <AnimatedCard delay={0.1}>
            <div className="card-premium p-3.5 text-center">
              <div className="w-9 h-9 rounded-xl bg-error-100 dark:bg-error-500/20 flex items-center justify-center mx-auto mb-2">
                <ArrowUpRight className="w-4.5 h-4.5 text-error-500" />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Spent</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white font-display mt-0.5">{formatCurrency(totalSpent)}</p>
            </div>
          </AnimatedCard>
          <AnimatedCard delay={0.15}>
            <div className="card-premium p-3.5 text-center">
              <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Tx Count</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white font-display mt-0.5">{txCount}</p>
            </div>
          </AnimatedCard>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">Recent Transactions</h2>
          <button onClick={() => navigate('/transactions')} className="text-sm text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1 hover:gap-1.5 transition-all">
            See all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="card-premium p-8 text-center">
            <WalletIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-400 dark:text-slate-500">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transactions.slice(0, 8).map((tx, i) => {
              const Icon = SERVICE_ICONS[tx.service] || Smartphone;
              const isFunding = tx.type === 'funding';
              const cashback = tx.metadata?.cashback_amount;
              return (
                <AnimatedCard key={tx.id} delay={i * 0.03}>
                  <button onClick={() => navigate(`/transactions/${tx.id}`)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isFunding ? 'bg-success-100 dark:bg-success-500/20' : 'bg-primary-100 dark:bg-primary-500/20'}`}>
                      {isFunding ? <ArrowDownLeft className="w-4.5 h-4.5 text-success-600 dark:text-success-400" /> : <Icon className="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{tx.product || tx.service}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{formatDateTime(tx.created_at)}</p>
                      {cashback && <CashbackEarned amount={cashback} className="mt-1" />}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${isFunding ? 'text-success-600 dark:text-success-400' : 'text-slate-800 dark:text-slate-100'}`}>
                        {isFunding ? '+' : '-'}{formatCurrency(parseFloat(tx.amount))}
                      </p>
                      <p className={`text-xs font-medium capitalize ${tx.status === 'success' ? 'text-success-600 dark:text-success-400' : tx.status === 'failed' ? 'text-error-500' : 'text-warning-500'}`}>{tx.status}</p>
                    </div>
                  </button>
                </AnimatedCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
