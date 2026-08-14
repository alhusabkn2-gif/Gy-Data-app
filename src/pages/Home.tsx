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
  Copy,
  Check,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, getGreeting } from '../lib/utils';
import Logo from '../components/Logo';

const quickActions = [
  {
    label: 'Buy Data',
    icon: Smartphone,
    path: '/buy-data',
  },
  {
    label: 'Airtime',
    icon: Phone,
    path: '/buy-airtime',
  },
  {
    label: 'Fund Wallet',
    icon: WalletIcon,
    path: '/fund-wallet',
  },
  {
    label: 'History',
    icon: Receipt,
    path: '/transactions',
  },
];

const services = [
  {
    id: 'electricity',
    name: 'Electricity',
    icon: Zap,
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    id: 'cable',
    name: 'Cable TV',
    icon: Tv,
    gradient: 'from-sky-400 to-blue-600',
  },
  {
    id: 'waec',
    name: 'WAEC PIN',
    icon: GraduationCap,
    gradient: 'from-emerald-400 to-green-600',
  },
  {
    id: 'jamb',
    name: 'JAMB PIN',
    icon: BookOpen,
    gradient: 'from-rose-400 to-red-600',
  },
  {
    id: 'betting',
    name: 'Betting',
    icon: Trophy,
    gradient: 'from-violet-400 to-purple-600',
  },
  {
    id: 'smile',
    name: 'Smile Data',
    icon: Smile,
    gradient: 'from-cyan-400 to-teal-600',
  },
  {
    id: 'internet',
    name: 'Internet',
    icon: Wifi,
    gradient: 'from-indigo-400 to-blue-600',
  },
  {
    id: 'more',
    name: 'More',
    icon: Grid3x3,
    gradient: 'from-slate-400 to-slate-600',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
};

const item = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.98,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      damping: 24,
      stiffness: 320,
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

  const accountNumber =
    user?.phone?.slice(-10) || '0000000000';

  const copyAccount = async () => {
    try {
      await navigator.clipboard?.writeText(accountNumber);
    } catch (error) {
      console.error('Unable to copy account number:', error);
    }

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 dark:bg-slate-950">

      {/* =========================================================
          HEADER
      ========================================================= */}

      <section className="relative overflow-hidden bg-gradient-to-br from-[#07152f] via-[#0b2147] to-[#10366d] px-5 pb-8 pt-7">

        {/* Decorative circles */}

        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#ff9736]/10 blur-3xl" />

        <div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="absolute right-10 top-28 h-12 w-12 rounded-full bg-[#ff9736]/10" />

        <div className="absolute left-5 top-40 h-7 w-7 rounded-full bg-white/5" />

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative"
        >

          {/* TOP NAVIGATION */}

          <div className="flex items-center justify-between">

            <Logo size="sm" showText />

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() => navigate('/notifications')}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.08] ring-1 ring-white/10 backdrop-blur-md transition active:scale-90"
                aria-label="Notifications"
              >
                <Bell className="h-[18px] w-[18px] text-white" />

                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-[#0b2147]" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/support')}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.08] ring-1 ring-white/10 backdrop-blur-md transition active:scale-90"
                aria-label="Support"
              >
                <Headphones className="h-[18px] w-[18px] text-white" />
              </button>

            </div>

          </div>

          {/* GREETING */}

          <div className="mt-6">

            <p className="text-[11px] font-medium text-white/50">
              {getGreeting()},
            </p>

            <div className="mt-0.5 flex items-center gap-2">

              <h1 className="font-display text-xl font-bold text-white">
                {firstName}
              </h1>

              <span className="text-base">
                👋
              </span>

            </div>

            <p className="mt-1 text-[10px] font-medium text-white/40">
              Welcome to GY DATA
            </p>

          </div>

          {/* =====================================================
              WALLET BALANCE CARD
          ===================================================== */}

          <div className="mt-6 rounded-[26px] border border-white/10 bg-white/[0.055] p-4 shadow-xl backdrop-blur-md">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <WalletIcon className="h-4 w-4 text-white/70" />
                </div>

                <div>

                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/45">
                    Wallet Balance
                  </p>

                  <div className="mt-0.5 flex items-center gap-2">

                    <AnimatePresence mode="wait">

                      <motion.span
                        key={showBalance ? 'balance' : 'hidden'}
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
                        className="font-display text-2xl font-bold tracking-tight text-white"
                      >
                        {showBalance
                          ? formatCurrency(
                              user?.wallet_balance || 0,
                            )
                          : '₦ • • • • •'}
                      </motion.span>

                    </AnimatePresence>

                    <button
                      type="button"
                      onClick={() =>
                        setShowBalance((value) => !value)
                      }
                      className="rounded-lg p-1.5 transition active:scale-90"
                      aria-label={
                        showBalance
                          ? 'Hide balance'
                          : 'Show balance'
                      }
                    >
                      {showBalance ? (
                        <EyeOff className="h-4 w-4 text-white/40" />
                      ) : (
                        <Eye className="h-4 w-4 text-white/40" />
                      )}
                    </button>

                  </div>

                </div>

              </div>

              {/* KYC STATUS */}

              <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1">

                <ShieldCheck className="h-3 w-3 text-emerald-400" />

                <span className="text-[9px] font-semibold uppercase tracking-wider text-white/70">
                  {user?.kyc_status === 'verified'
                    ? 'Verified'
                    : 'Tier 1'}
                </span>

              </div>

            </div>

            {/* ACCOUNT */}

            <div className="mt-4 border-t border-white/10 pt-3">

              <p className="text-[9px] font-medium uppercase tracking-wider text-white/35">
                Account
              </p>

              <div className="mt-1 flex items-center gap-1.5">

                <span className="font-mono text-sm font-semibold tracking-wider text-white/85">
                  {accountNumber}
                </span>

                <button
                  type="button"
                  onClick={copyAccount}
                  className="rounded-md bg-white/10 p-1 transition active:scale-90"
                  aria-label="Copy account number"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-white/50" />
                  )}
                </button>

              </div>

            </div>

          </div>

        </motion.div>
      </section>

      {/* =========================================================
          QUICK ACTIONS
      ========================================================= */}

      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="px-5 pt-4"
      >

        <div className="mb-3 flex items-center justify-between">

          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Quick Actions
            </h2>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Manage your account quickly.
            </p>
          </div>

        </div>

        <div className="grid grid-cols-2 gap-2.5">

          {quickActions.map((action) => {

            const Icon = action.icon;

            return (
              <motion.button
                key={action.label}
                variants={item}
                type="button"
                onClick={() => navigate(action.path)}
                whileTap={{ scale: 0.96 }}
                className="flex h-[62px] items-center gap-3 rounded-2xl border border-[#173766] bg-[#0b2147] px-3 shadow-sm transition hover:bg-[#102d5a]"
              >

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="h-[17px] w-[17px] text-white" />
                </div>

                <div className="text-left">

                  <span className="block text-[11px] font-bold text-white">
                    {action.label}
                  </span>

                  <span className="mt-0.5 block text-[9px] text-white/45">
                    Tap to continue
                  </span>

                </div>

                <ArrowUpRight className="ml-auto h-4 w-4 text-white/40" />

              </motion.button>
            );

          })}

        </div>

      </motion.section>

      {/* =========================================================
          SERVICES
      ========================================================= */}

      <section className="px-5 pt-7">

        <div className="mb-3 flex items-center justify-between">

          <div>

            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Quick Services
            </h2>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Everything you need, faster.
            </p>

          </div>

          <button
            type="button"
            onClick={() => navigate('/services')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400"
          >
            See all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>

        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-4 gap-2.5"
        >

          {services.map((service) => {

            const Icon = service.icon;
            const isMore = service.id === 'more';

            return (
              <motion.button
                key={service.id}
                variants={item}
                type="button"
                onClick={() =>
                  isMore
                    ? navigate('/services')
                    : navigate(`/services/${service.id}`)
                }
                whileTap={{ scale: 0.94 }}
                className="group rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >

                <div
                  className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${service.gradient} shadow-md transition-transform duration-200 group-hover:scale-105`}
                >
                  <Icon className="h-[18px] w-[18px] text-white" />
                </div>

                <span className="mt-1.5 block truncate text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                  {service.name}
                </span>

              </motion.button>
            );

          })}

        </motion.div>

      </section>

      {/* =========================================================
          DATA BUNDLES FEATURE
      ========================================================= */}

      <section className="px-5 pt-5">

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/buy-data')}
          className="relative w-full overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 p-4 text-left dark:border-orange-900/40 dark:from-orange-950/40 dark:to-amber-950/30"
        >

          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-400/10 blur-2xl" />

          <div className="relative flex items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ff9736] shadow-lg shadow-orange-500/20">
              <Smartphone className="h-5 w-5 text-white" />
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-xs font-bold text-slate-800 dark:text-white">
                Need Data?
              </p>

              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                Choose your network and browse available data plans.
              </p>

            </div>

            <ArrowUpRight className="h-4 w-4 text-orange-500" />

          </div>

        </motion.button>

      </section>

      {/* =========================================================
          MORE SERVICES
      ========================================================= */}

      <section className="px-5 pb-5 pt-3">

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/services')}
          className="relative w-full overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-3.5 text-left dark:border-blue-900/40 dark:from-blue-950/40 dark:to-cyan-950/30"
        >

          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-400/10 blur-2xl" />

          <div className="relative flex items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-xs font-bold text-slate-800 dark:text-white">
                More services available
              </p>

              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                Explore all GY DATA services.
              </p>

            </div>

            <ArrowUpRight className="h-4 w-4 text-blue-500" />

          </div>

        </motion.button>

      </section>

    </div>
  );
}
