import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Headphones,
  EyeOff,
  Eye,
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
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, getGreeting } from '../lib/utils';
import Logo from '../components/Logo';

const quickActions = [
  {
    label: 'Buy Airtime',
    icon: Phone,
    path: '/buy-airtime',
  },
  {
    label: 'Data Bundles',
    icon: Smartphone,
    path: '/buy-data',
  },
  {
    label: 'Fund Wallet',
    icon: WalletIcon,
    path: '/fund-wallet',
  },
  {
    label: 'Transaction History',
    icon: Receipt,
    path: '/transactions',
  },
];

const services = [
  {
    id: 'electricity',
    name: 'Electricity',
    icon: Zap,
    bg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    id: 'cable',
    name: 'Cable TV',
    icon: Tv,
    bg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'waec',
    name: 'WAEC PIN',
    icon: GraduationCap,
    bg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'jamb',
    name: 'JAMB PIN',
    icon: BookOpen,
    bg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    id: 'betting',
    name: 'Betting',
    icon: Trophy,
    bg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: 'smile',
    name: 'Smile Data',
    icon: Smile,
    bg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
  {
    id: 'internet',
    name: 'Internet',
    icon: Wifi,
    bg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  {
    id: 'more',
    name: 'More',
    icon: Grid3x3,
    bg: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

const item = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  show: {
    opacity: 1,
    y: 0,
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
    } catch {
      // Clipboard may be unavailable on some devices.
    }

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#F4FBFF] pb-24">

      {/* =========================================================
          TOP HEADER
      ========================================================== */}

      <section className="relative overflow-hidden rounded-b-[32px] bg-gradient-to-br from-[#16B8D4] via-[#20C0D6] to-[#3AC4D8] px-5 pb-14 pt-7">

        {/* Decorative shapes */}

        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />

        <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-white/10" />

        <div className="absolute right-5 top-24 h-20 w-20 rounded-full bg-white/5" />

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative z-10"
        >

          {/* TOP BAR */}

          <div className="flex items-center justify-between">

            <Logo
              size="sm"
              showText
            />

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() =>
                  navigate('/notifications')
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 shadow-sm backdrop-blur-md transition-transform active:scale-90"
                aria-label="Notifications"
              >
                <Bell className="h-[19px] w-[19px] text-white" />

                <span className="absolute ml-5 mt-[-18px] h-2 w-2 rounded-full bg-[#FFB43B] ring-2 ring-[#20C0D6]" />
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate('/support')
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 shadow-sm backdrop-blur-md transition-transform active:scale-90"
                aria-label="Support"
              >
                <Headphones className="h-[19px] w-[19px] text-white" />
              </button>

            </div>

          </div>

          {/* GREETING */}

          <div className="mt-7">

            <p className="text-[12px] font-medium text-white/80">
              {getGreeting()},
            </p>

            <div className="mt-0.5 flex items-center gap-2">

              <h1 className="text-[23px] font-extrabold tracking-tight text-white">
                {firstName}!
              </h1>

              <span className="text-[22px]">
                👋
              </span>

            </div>

          </div>

          {/* BALANCE CARD */}

          <div className="relative z-20 mt-5 -mb-9 rounded-[18px] border border-white/70 bg-white px-4 py-4 shadow-[0_8px_25px_rgba(18,128,153,0.16)]">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-[12px] font-medium text-slate-500">
                  Balance
                </p>

                <div className="mt-1 flex items-center gap-2">

                  <AnimatePresence mode="wait">

                    <motion.span
                      key={
                        showBalance
                          ? 'visible'
                          : 'hidden'
                      }
                      initial={{
                        opacity: 0,
                        y: 4,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: -4,
                      }}
                      className="text-[22px] font-extrabold tracking-tight text-slate-900"
                    >
                      {showBalance
                        ? formatCurrency(
                            user?.wallet_balance || 0
                          )
                        : '₦ • • • • •'}
                    </motion.span>

                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={() =>
                      setShowBalance(
                        !showBalance
                      )
                    }
                    className="rounded-lg p-1 active:scale-90"
                    aria-label="Toggle balance"
                  >
                    {showBalance ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </button>

                </div>

              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1">

                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />

                <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                  {user?.kyc_status ===
                  'verified'
                    ? 'Verified'
                    : 'Tier 1'}
                </span>

              </div>

            </div>

            {/* ACCOUNT NUMBER */}

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">

              <div>

                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  Account Number
                </p>

                <div className="mt-1 flex items-center gap-2">

                  <span className="font-mono text-[12px] font-bold tracking-wider text-slate-700">
                    {accountNumber}
                  </span>

                  <button
                    type="button"
                    onClick={copyAccount}
                    className="rounded-md bg-slate-100 p-1 active:scale-90"
                    aria-label="Copy account number"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-slate-400" />
                    )}
                  </button>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  navigate('/wallet')
                }
                className="text-[10px] font-bold text-[#18AFC8]"
              >
                Wallet
              </button>

            </div>

          </div>

        </motion.div>

      </section>

      {/* =========================================================
          QUICK ACTIONS
      ========================================================== */}

      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 px-5 pt-14"
      >

        <div className="grid grid-cols-2 gap-3">

          {quickActions.map(
            (action) => {
              const Icon = action.icon;

              return (
                <motion.button
                  key={action.label}
                  variants={item}
                  type="button"
                  onClick={() =>
                    navigate(action.path)
                  }
                  whileTap={{
                    scale: 0.96,
                  }}
                  className="flex min-h-[88px] items-center gap-3 rounded-[18px] border border-slate-100 bg-white px-4 py-3 text-left shadow-[0_4px_15px_rgba(15,23,42,0.07)]"
                >

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#DDF8DF]">

                    <Icon className="h-6 w-6 text-[#4FC45C]" />

                  </div>

                  <span className="text-[12px] font-bold leading-tight text-slate-800">
                    {action.label}
                  </span>

                </motion.button>
              );
            }
          )}

        </div>

      </motion.section>

      {/* =========================================================
          QUICK SERVICES
      ========================================================== */}

      <section className="px-5 pt-7">

        <div className="mb-3 flex items-center justify-between">

          <div>

            <h2 className="text-[16px] font-extrabold text-slate-900">
              Quick Services
            </h2>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Everything you need, faster.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/services')
            }
            className="flex items-center gap-1 text-[11px] font-bold text-[#15AFC8]"
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

          {services.map(
            (service) => {
              const Icon = service.icon;

              const isMore =
                service.id === 'more';

              return (
                <motion.button
                  key={service.id}
                  variants={item}
                  type="button"
                  onClick={() =>
                    isMore
                      ? navigate('/services')
                      : navigate(
                          `/services/${service.id}`
                        )
                  }
                  whileTap={{
                    scale: 0.94,
                  }}
                  className="rounded-[17px] border border-slate-100 bg-white px-2 py-3 shadow-[0_3px_12px_rgba(15,23,42,0.06)]"
                >

                  <div
                    className={`mx-auto flex h-11 w-11 items-center justify-center rounded-[14px] ${service.bg}`}
                  >
                    <Icon
                      className={`h-5 w-5 ${service.iconColor}`}
                    />
                  </div>

                  <span className="mt-2 block truncate text-[9px] font-bold text-slate-600">
                    {service.name}
                  </span>

                </motion.button>
              );
            }
          )}

        </motion.div>

      </section>

      {/* =========================================================
          BOTTOM INFORMATION CARD
      ========================================================== */}

      <section className="px-5 pb-5 pt-6">

        <button
          type="button"
          onClick={() =>
            navigate('/services')
          }
          className="relative w-full overflow-hidden rounded-[20px] border border-[#BCECF2] bg-[#E8FAFC] p-4 text-left"
        >

          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#30C3D7]/10" />

          <div className="relative flex items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white shadow-sm">

              <Grid3x3 className="h-5 w-5 text-[#19B3CA]" />

            </div>

            <div className="min-w-0 flex-1">

              <p className="text-[12px] font-extrabold text-slate-800">
                Ready to get connected?
              </p>

              <p className="mt-0.5 text-[10px] text-slate-500">
                We've got you covered.
              </p>

            </div>

            <ArrowUpRight className="h-4 w-4 text-[#19B3CA]" />

          </div>

        </button>

      </section>

    </div>
  );
}
