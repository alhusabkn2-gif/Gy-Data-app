import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Headphones,
  Eye,
  EyeOff,
  Smartphone,
  Phone,
  Wallet as WalletIcon,
  Receipt,
  Zap,
  Tv,
  GraduationCap,
  BookOpen,
  Trophy,
  Smile,
  Wifi,
  Grid3x3,
  Plus,
  Copy,
  Check,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  Nfc,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, getGreeting } from '../lib/utils';
import Logo from '../components/Logo';

const quickActions = [
  {
    label: 'Buy Data',
    icon: Smartphone,
    path: '/buy-data',
    gradient: 'from-blue-500 to-blue-700',
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
  },
  {
    label: 'Airtime',
    icon: Phone,
    path: '/buy-airtime',
    gradient: 'from-cyan-400 to-sky-600',
    iconBg: 'bg-cyan-50 dark:bg-cyan-500/10',
  },
  {
    label: 'Fund Wallet',
    icon: WalletIcon,
    path: '/fund-wallet',
    gradient: 'from-emerald-400 to-green-600',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  {
    label: 'History',
    icon: Receipt,
    path: '/transactions',
    gradient: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-50 dark:bg-violet-500/10',
  },
];

const services = [
  {
    id: 'electricity',
    name: 'Electricity',
    icon: Zap,
    gradient: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
  },
  {
    id: 'cable',
    name: 'Cable TV',
    icon: Tv,
    gradient: 'from-sky-400 to-blue-600',
    bg: 'bg-sky-50 dark:bg-sky-500/10',
  },
  {
    id: 'waec',
    name: 'WAEC PIN',
    icon: GraduationCap,
    gradient: 'from-emerald-400 to-green-600',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  {
    id: 'jamb',
    name: 'JAMB PIN',
    icon: BookOpen,
    gradient: 'from-rose-400 to-red-600',
    bg: 'bg-rose-50 dark:bg-rose-500/10',
  },
  {
    id: 'betting',
    name: 'Betting',
    icon: Trophy,
    gradient: 'from-violet-400 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-500/10',
  },
  {
    id: 'smile',
    name: 'Smile Data',
    icon: Smile,
    gradient: 'from-cyan-400 to-teal-600',
    bg: 'bg-cyan-50 dark:bg-cyan-500/10',
  },
  {
    id: 'internet',
    name: 'Internet',
    icon: Wifi,
    gradient: 'from-indigo-400 to-blue-600',
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
  },
  {
    id: 'more',
    name: 'More',
    icon: Grid3x3,
    gradient: 'from-slate-400 to-slate-600',
    bg: 'bg-slate-100 dark:bg-slate-800',
  },
];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const item = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 260,
    },
  },
};

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);

  const firstName =
    user?.full_name?.split(' ')[0] || 'User';

  /*
   * Using the last 10 digits of the user's phone.
   */
  const accountNumber =
    user?.phone?.slice(-10) || '0000000000';

  const copyAccount = async () => {
    try {
      await navigator.clipboard?.writeText(
        accountNumber
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      // Clipboard may be unavailable in some browsers.
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#061638] via-[#09255c] to-[#063b8f] px-5 pt-9 pb-24">
        {/* Background glow */}
        <div className="absolute -top-28 -right-24 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="absolute -bottom-32 -left-24 w-72 h-72 rounded-full bg-cyan-400/10 blur-3xl" />

        {/* Decorative circle */}
        <div className="absolute top-16 right-[-100px] w-64 h-64 rounded-full border border-white/5" />

        {/* Small dot pattern */}
        <div
          className="absolute right-5 bottom-7 w-28 h-20 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '10px 10px',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative z-10"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <Logo
              size="sm"
              showText
            />

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button
                type="button"
                onClick={() =>
                  navigate('/notifications')
                }
                className="relative w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 transition-transform"
              >
                <Bell className="w-[18px] h-[18px] text-white" />

                <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-[#09255c]">
                  3
                </span>
              </button>

              {/* Support */}
              <button
                type="button"
                onClick={() =>
                  navigate('/support')
                }
                className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 transition-transform"
              >
                <Headphones className="w-[18px] h-[18px] text-white" />
              </button>
            </div>
          </div>

          {/* Greeting */}
          <div className="mt-7">
            <p className="text-white/50 text-xs font-medium">
              {getGreeting()},
            </p>

            <h1 className="mt-1 text-[27px] leading-tight font-bold text-white font-display">
              {firstName} 👋
            </h1>

            <p className="mt-1 text-white/45 text-xs">
              Manage your wallet & payments easily
            </p>
          </div>
        </motion.div>
      </header>

      {/* =====================================================
          WALLET CARD
      ====================================================== */}
      <section className="relative z-20 px-5 -mt-[58px]">
        <motion.div
          initial={{
            opacity: 0,
            y: 24,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.5,
            delay: 0.08,
          }}
          className="relative overflow-hidden rounded-[26px] shadow-xl shadow-blue-950/25"
        >
          {/* Card background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c2b68] via-[#103b86] to-[#0b4da7]" />

          {/* Card glow */}
          <div className="absolute -top-20 -right-16 w-48 h-48 rounded-full bg-blue-400/20 blur-3xl" />

          <div className="absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-cyan-300/10 blur-3xl" />

          {/* NFC */}
          <Nfc className="absolute top-5 right-5 w-5 h-5 text-white/20" />

          <div className="relative p-5">
            {/* Wallet title */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WalletIcon className="w-4 h-4 text-white/60" />

                <span className="text-xs font-medium text-white/60">
                  Wallet Balance
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setShowBalance(
                      !showBalance
                    )
                  }
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
                >
                  {showBalance ? (
                    <EyeOff className="w-3.5 h-3.5 text-white/70" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-white/70" />
                  )}
                </button>
              </div>

              {/* Verification */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-300/10">
                <ShieldCheck className="w-3 h-3 text-emerald-300" />

                <span className="text-[9px] font-bold text-emerald-100 uppercase tracking-wide">
                  {user?.kyc_status ===
                  'verified'
                    ? 'Verified'
                    : 'Tier 1'}
                </span>
              </div>
            </div>

            {/* Balance */}
            <div className="mt-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={
                    showBalance
                      ? 'visible'
                      : 'hidden'
                  }
                  initial={{
                    opacity: 0,
                    y: 5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -5,
                  }}
                  transition={{
                    duration: 0.18,
                  }}
                  className="text-white text-[31px] leading-none font-bold font-display tracking-tight"
                >
                  {showBalance
                    ? formatCurrency(
                        user?.wallet_balance ||
                          0
                      )
                    : '₦ • • • • •'}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10 my-4" />

            {/* Account + Fund */}
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-widest text-white/35 mb-1">
                  Account Number
                </p>

                <div className="flex items-center gap-1.5">
                  <span className="text-white text-sm font-semibold font-mono tracking-wider">
                    {accountNumber}
                  </span>

                  <button
                    type="button"
                    onClick={copyAccount}
                    className="w-7 h-7 shrink-0 rounded-lg bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-white/60" />
                    )}
                  </button>
                </div>
              </div>

              <motion.button
                type="button"
                whileTap={{
                  scale: 0.94,
                }}
                onClick={() =>
                  navigate('/fund-wallet')
                }
                className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[#0b3475] text-xs font-bold shadow-lg"
              >
                <Plus
                  className="w-4 h-4"
                  strokeWidth={2.5}
                />

                Fund Wallet
              </motion.button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-white/25" />

                <span className="text-[8px] text-white/25 font-medium tracking-widest">
                  GY DATA · VIRTUAL WALLET
                </span>
              </div>

              <div className="flex gap-1">
                <div className="w-5 h-3 rounded-sm bg-white/10" />
                <div className="w-5 h-3 rounded-sm bg-white/15" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* =====================================================
          QUICK ACTIONS
      ====================================================== */}
      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-bold text-slate-900 dark:text-white font-display">
            Quick Actions
          </h2>

          <button
            type="button"
            onClick={() =>
              navigate('/services')
            }
            className="text-xs font-semibold text-primary-600 dark:text-primary-400 flex items-center gap-1"
          >
            See all
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-4 gap-2.5"
        >
          {quickActions.map(
            (action) => {
              const Icon = action.icon;

              return (
                <motion.button
                  key={action.label}
                  variants={item}
                  type="button"
                  whileTap={{
                    scale: 0.94,
                  }}
                  onClick={() =>
                    navigate(
                      action.path
                    )
                  }
                  className="min-w-0 rounded-[18px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2.5 shadow-sm"
                >
                  <div
                    className={`mx-auto w-10 h-10 rounded-[14px] ${action.iconBg} flex items-center justify-center`}
                  >
                    <div
                      className={`w-9 h-9 rounded-[12px] bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md`}
                    >
                      <Icon className="w-[18px] h-[18px] text-white" />
                    </div>
                  </div>

                  <p className="mt-2 text-[10px] font-semibold leading-tight text-slate-700 dark:text-slate-300">
                    {action.label}
                  </p>
                </motion.button>
              );
            }
          )}
        </motion.div>
      </section>

      {/* =====================================================
          QUICK SERVICES
      ====================================================== */}
      <section className="px-5 mt-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-bold text-slate-900 dark:text-white font-display">
            Quick Services
          </h2>

          <button
            type="button"
            onClick={() =>
              navigate('/services')
            }
            className="text-xs font-semibold text-primary-600 dark:text-primary-400 flex items-center gap-1"
          >
            See all
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-4 gap-2.5"
        >
          {services.map(
            (service) => {
              const Icon =
                service.icon;

              const isMore =
                service.id ===
                'more';

              return (
                <motion.button
                  key={service.id}
                  variants={item}
                  type="button"
                  whileTap={{
                    scale: 0.94,
                  }}
                  onClick={() =>
                    isMore
                      ? navigate(
                          '/services'
                        )
                      : navigate(
                          `/services/${service.id}`
                        )
                  }
                  className={`relative min-w-0 overflow-hidden rounded-[18px] ${service.bg} border border-slate-100 dark:border-slate-800 p-3`}
                >
                  {/* Small decorative glow */}
                  <div
                    className={`absolute -top-5 -right-5 w-14 h-14 rounded-full bg-gradient-to-br ${service.gradient} opacity-10 blur-xl`}
                  />

                  <div
                    className={`relative mx-auto w-10 h-10 rounded-[13px] bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-sm`}
                  >
                    <Icon className="w-[18px] h-[18px] text-white" />
                  </div>

                  <p className="relative mt-2 text-[10px] font-semibold leading-tight text-slate-700 dark:text-slate-300">
                    {service.name}
                  </p>
                </motion.button>
              );
            }
          )}
        </motion.div>
      </section>

      {/* =====================================================
          SECURITY BANNER
      ====================================================== */}
      <section className="px-5 mt-6">
        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.35,
          }}
          className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 border border-blue-100 dark:border-blue-500/10 p-3.5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-[13px] bg-blue-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Secure payments
              </p>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Fast, secure and reliable
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate('/support')
              }
              className="shrink-0 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 text-[10px] font-bold text-primary-600 dark:text-primary-400 shadow-sm"
            >
              Learn more
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
