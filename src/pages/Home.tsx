import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Headphones, Eye, EyeOff, Smartphone, Phone, Wallet as WalletIcon,
  Receipt, Zap, Tv, GraduationCap, BookOpen, Trophy, Smile,
  Wifi, Grid3x3, Plus, Copy, Check, ShieldCheck, ArrowUpRight,
  Sparkles, Nfc,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, getGreeting } from '../lib/utils';
import Logo from '../components/Logo';

const quickActions = [
  { label: 'Buy Data', icon: Smartphone, path: '/buy-data', gradient: 'from-blue-500 to-blue-700', shadow: 'shadow-blue-500/30' },
  { label: 'Airtime', icon: Phone, path: '/buy-airtime', gradient: 'from-cyan-500 to-sky-600', shadow: 'shadow-cyan-500/30' },
  { label: 'Fund Wallet', icon: WalletIcon, path: '/fund-wallet', gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/30' },
  { label: 'History', icon: Receipt, path: '/transactions', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/30' },
];

const services = [
  { id: 'electricity', name: 'Electricity', icon: Zap, gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-500/10', ring: 'ring-amber-200/50 dark:ring-amber-500/20' },
  { id: 'cable', name: 'Cable TV', icon: Tv, gradient: 'from-sky-400 to-blue-600', bg: 'bg-sky-50 dark:bg-sky-500/10', ring: 'ring-sky-200/50 dark:ring-sky-500/20' },
  { id: 'waec', name: 'WAEC PIN', icon: GraduationCap, gradient: 'from-emerald-400 to-green-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', ring: 'ring-emerald-200/50 dark:ring-emerald-500/20' },
  { id: 'jamb', name: 'JAMB PIN', icon: BookOpen, gradient: 'from-rose-400 to-red-600', bg: 'bg-rose-50 dark:bg-rose-500/10', ring: 'ring-rose-200/50 dark:ring-rose-500/20' },
  { id: 'betting', name: 'Betting', icon: Trophy, gradient: 'from-violet-400 to-purple-600', bg: 'bg-violet-50 dark:bg-violet-500/10', ring: 'ring-violet-200/50 dark:ring-violet-500/20' },
  { id: 'smile', name: 'Smile Data', icon: Smile, gradient: 'from-cyan-400 to-teal-600', bg: 'bg-cyan-50 dark:bg-cyan-500/10', ring: 'ring-cyan-200/50 dark:ring-cyan-500/20' },
  { id: 'internet', name: 'Internet', icon: Wifi, gradient: 'from-indigo-400 to-blue-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10', ring: 'ring-indigo-200/50 dark:ring-indigo-500/20' },
  { id: 'more', name: 'More Services', icon: Grid3x3, gradient: 'from-slate-400 to-slate-600', bg: 'bg-slate-50 dark:bg-slate-500/10', ring: 'ring-slate-200/50 dark:ring-slate-500/20' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, damping: 22, stiffness: 300 } },
};

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);

  const firstName = user?.full_name?.split(' ')[0] || 'User';
  const accountNumber = user?.phone?.slice(-10) || '0000000000';

  const copyAccount = () => {
    navigator.clipboard?.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pb-28 bg-slate-50 dark:bg-slate-950">
      {/* ─── Header ─── */}
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-800 dark:via-primary-900 dark:to-slate-950 px-5 pt-10 pb-28 overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-52 h-52 bg-accent-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative flex items-center justify-between"
        >
          {/* Left: Logo + Greeting */}
          <div className="flex flex-col gap-3">
            <Logo size="sm" showText />
            <div>
              <p className="text-white/60 text-xs font-medium">{getGreeting()},</p>
              <p className="text-white font-bold font-display text-lg leading-tight">{firstName} 👋</p>
            </div>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/notifications')}
              className="relative w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all ring-1 ring-white/10"
            >
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-warning-400 ring-2 ring-primary-700" />
            </button>
            <button
              onClick={() => navigate('/support')}
              className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all ring-1 ring-white/10"
            >
              <Headphones className="w-5 h-5 text-white" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* ─── Wallet Card ─── */}
      <div className="px-5 -mt-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -3 }}
          className="relative rounded-[28px] overflow-hidden shadow-2xl shadow-primary-900/40"
        >
          {/* Card gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary-900 to-primary-800" />
          {/* Decorative glows */}
          <div className="absolute top-0 right-0 w-56 h-56 bg-primary-500/25 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-44 h-44 bg-accent-500/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
          {/* Shimmer top line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          {/* NFC icon */}
          <div className="absolute top-5 right-5">
            <Nfc className="w-5 h-5 text-white/30" />
          </div>

          <div className="relative p-6">
            {/* Top row: label + account level */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <WalletIcon className="w-4 h-4 text-white/50" />
                <p className="text-white/50 text-xs font-medium tracking-wide">Wallet Balance</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                <ShieldCheck className="w-3 h-3 text-success-400" />
                <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">
                  {user?.kyc_status === 'verified' ? 'Verified' : 'Tier 1'}
                </span>
              </div>
            </div>

            {/* Balance */}
            <div className="flex items-center gap-3 mb-6">
              <AnimatePresence mode="wait">
                <motion.span
                  key={showBalance ? 'show' : 'hide'}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="text-white text-[2.25rem] font-bold font-display tracking-tight"
                >
                  {showBalance ? formatCurrency(user?.wallet_balance || 0) : '₦ • • • • • •'}
                </motion.span>
              </AnimatePresence>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 rounded-xl hover:bg-white/10 active:scale-90 transition-all"
              >
                <AnimatePresence mode="wait">
                  {showBalance ? (
                    <motion.div key="eye-off" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}>
                      <EyeOff className="w-4 h-4 text-white/40" />
                    </motion.div>
                  ) : (
                    <motion.div key="eye" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}>
                      <Eye className="w-4 h-4 text-white/40" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>

            {/* Account number + Fund button */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-1.5">Account Number</p>
                <div className="flex items-center gap-2">
                  <span className="text-white text-lg font-semibold font-mono tracking-wider">{accountNumber}</span>
                  <button
                    onClick={copyAccount}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-90 transition-all"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div key="copied" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                          <Check className="w-3.5 h-3.5 text-success-400" />
                        </motion.div>
                      ) : (
                        <motion.div key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                          <Copy className="w-3.5 h-3.5 text-white/60" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => navigate('/fund-wallet')}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-primary-700 text-sm font-bold shadow-xl shadow-black/20 hover:bg-primary-50 transition-all"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} /> Fund Wallet
              </motion.button>
            </div>

            {/* Card footer */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-white/25" />
                <span className="text-white/25 text-[10px] font-medium tracking-wider">GY DATA · VIRTUAL WALLET</span>
              </div>
              <div className="flex gap-1">
                <div className="w-6 h-4 rounded-sm bg-white/10" />
                <div className="w-6 h-4 rounded-sm bg-white/15" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── Quick Actions ─── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="px-5 mt-6"
      >
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                variants={item}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg ${action.shadow}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight">{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* ─── Quick Services ─── */}
      <div className="px-5 mt-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">Quick Services</h2>
          <button
            onClick={() => navigate('/services')}
            className="text-sm text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1 hover:gap-1.5 transition-all"
          >
            See all <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3"
        >
          {services.map((service) => {
            const Icon = service.icon;
            const isMore = service.id === 'more';
            return (
              <motion.button
                key={service.id}
                variants={item}
                whileTap={{ scale: 0.95 }}
                onClick={() => (isMore ? navigate('/services') : navigate(`/services/${service.id}`))}
                className={`relative flex items-center gap-3.5 p-4 rounded-2xl ${service.bg} border border-slate-100 dark:border-slate-800 ring-1 ${service.ring} hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden`}
              >
                {/* Decorative corner gradient */}
                <div className={`absolute -top-5 -right-5 w-20 h-20 rounded-full bg-gradient-to-br ${service.gradient} opacity-10 blur-xl`} />
                <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="relative text-sm font-semibold text-slate-700 dark:text-slate-200">{service.name}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
