import { useState, useEffect } from 'react';
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
  ChevronRight,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, getGreeting } from '../lib/utils';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';
import NetworkLogo from '../components/ui/NetworkLogo';

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

interface DataPlan {
  id: string;
  name: string;
  price: number;
  network: string;
  category?: string;
  description?: string;
  cashback_amount?: number;
  cashback_percent?: number;
  is_active?: boolean;
}

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

  // ================= DATA PLANS =================
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const firstName =
    user?.full_name?.split(' ')[0] || 'User';

  const accountNumber =
    user?.phone?.slice(-10) || '0000000000';

  const copyAccount = () => {
    navigator.clipboard?.writeText(accountNumber);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  // =====================================================
  // LOAD ACTIVE DATA PLANS
  // =====================================================

  useEffect(() => {
    fetchHomePlans();
  }, []);

  const fetchHomePlans = async () => {
    try {
      setLoadingPlans(true);

      const { data, error } = await supabase
        .from('products')
        .select(
          'id, name, price, network, category, description, cashback_amount, cashback_percent, is_active'
        )
        .eq('service', 'data')
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(8);

      if (error) {
        console.error(
          'Failed to load home data plans:',
          error
        );

        setDataPlans([]);
        return;
      }

      setDataPlans((data || []) as DataPlan[]);
    } catch (error) {
      console.error(
        'Unexpected error loading home plans:',
        error
      );

      setDataPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="relative overflow-hidden bg-gradient-to-br from-[#07152f] via-[#0b2147] to-[#10366d] px-5 pt-7 pb-8">

        <div className="absolute -top-24 -right-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.025]"
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

          {/* Top navigation */}

          <div className="flex items-center justify-between">

            <Logo size="sm" showText />

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() => navigate('/notifications')}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.08] ring-1 ring-white/10 backdrop-blur-md transition-all active:scale-90"
              >
                <Bell className="h-[18px] w-[18px] text-white" />

                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-[#0b2147]" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/support')}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.08] ring-1 ring-white/10 backdrop-blur-md transition-all active:scale-90"
              >
                <Headphones className="h-[18px] w-[18px] text-white" />
              </button>

            </div>
          </div>

          {/* Greeting */}

          <div className="mt-6">

            <p className="text-[11px] font-medium text-white/50">
              {getGreeting()},
            </p>

            <div className="mt-0.5 flex items-center gap-2">

              <h1 className="font-display text-xl font-bold text-white">
                {firstName}
              </h1>

              <span className="text-base">👋</span>

            </div>

          </div>

          {/* =====================================================
              BALANCE
          ===================================================== */}

          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.055] p-4 shadow-xl backdrop-blur-md">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">

                  <WalletIcon className="h-4 w-4 text-white/70" />

                </div>

                <div>

                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/45">
                    Wallet Balance
                  </p>

                  <div className="mt-0.5 flex items-center gap-2">

                    <AnimatePresence mode="wait">

                      <motion.span
                        key={
                          showBalance
                            ? 'balance'
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
                        className="font-display text-2xl font-bold tracking-tight text-white"
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
                        setShowBalance(!showBalance)
                      }
                      className="rounded-lg p-1.5 transition-all hover:bg-white/10 active:scale-90"
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

              {/* KYC */}

              <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1">

                <ShieldCheck className="h-3 w-3 text-emerald-400" />

                <span className="text-[9px] font-semibold uppercase tracking-wider text-white/70">

                  {user?.kyc_status === 'verified'
                    ? 'Verified'
                    : 'Tier 1'}

                </span>

              </div>

            </div>

            {/* Account */}

            <div className="mt-4 border-t border-white/10 pt-3">

              <div>

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
                    className="rounded-md bg-white/10 p-1 transition-all active:scale-90"
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

          </div>

        </motion.div>

      </section>

      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="-mt-1 px-5 pt-4"
      >

        <div className="grid grid-cols-3 gap-2.5">

          {quickActions.map((action) => {

            const Icon = action.icon;

            return (
              <motion.button
                key={action.label}
                variants={item}
                type="button"
                onClick={() => navigate(action.path)}
                whileTap={{ scale: 0.96 }}
                className="flex h-[54px] items-center justify-center gap-2 rounded-xl border border-[#173766] bg-[#0b2147] px-2 shadow-sm transition-all hover:bg-[#102d5a]"
              >

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">

                  <Icon className="h-[15px] w-[15px] text-white" />

                </div>

                <span className="text-[10px] font-semibold leading-tight text-white">
                  {action.label}
                </span>

              </motion.button>
            );

          })}

        </div>

      </motion.section>

      {/* =====================================================
          DATA PLANS
      ===================================================== */}

      <section className="px-5 pt-6">

        <div className="mb-3 flex items-center justify-between">

          <div>

            <div className="flex items-center gap-2">

              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Data Plans
              </h2>

              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                Live
              </span>

            </div>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Choose a plan and buy instantly.
            </p>

          </div>

          <button
            type="button"
            onClick={() => navigate('/buy-data')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400"
          >
            See all

            <ArrowUpRight className="h-3.5 w-3.5" />

          </button>

        </div>

        {loadingPlans ? (

          <div className="grid grid-cols-2 gap-3">

            {[1, 2, 3, 4].map((number) => (

              <div
                key={number}
                className="h-[126px] animate-pulse rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
              />

            ))}

          </div>

        ) : dataPlans.length === 0 ? (

          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900">

            <Smartphone className="mx-auto h-7 w-7 text-slate-300" />

            <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              No data plans available
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Please check again later.
            </p>

            <button
              type="button"
              onClick={() => navigate('/buy-data')}
              className="mt-3 rounded-xl bg-[#0b2147] px-4 py-2 text-[10px] font-bold text-white"
            >
              Open Buy Data
            </button>

          </div>

        ) : (

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-3"
          >

            {dataPlans.map((plan) => {

              const cashback =
                Number(plan.cashback_amount || 0);

              return (
                <motion.button
                  key={plan.id}
                  variants={item}
                  type="button"
                  onClick={() => navigate('/buy-data')}
                  whileTap={{ scale: 0.97 }}
                  className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >

                  {/* Cashback badge */}

                  {cashback > 0 && (

                    <div className="absolute right-2 top-2 rounded-full bg-emerald-50 px-1.5 py-0.5 dark:bg-emerald-900/30">

                      <span className="text-[7px] font-bold text-emerald-600 dark:text-emerald-400">
                        +₦{cashback.toLocaleString()}
                      </span>

                    </div>

                  )}

                  <div className="flex items-center gap-2">

                    <NetworkLogo
                      network={plan.network}
                      size="sm"
                    />

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-[10px] font-bold uppercase text-slate-400">
                        {plan.network}
                      </p>

                      <p className="mt-0.5 truncate text-xs font-bold text-slate-800 dark:text-white">
                        {plan.name}
                      </p>

                    </div>

                  </div>

                  <div className="mt-3 flex items-end justify-between">

                    <div>

                      <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
                        Price
                      </p>

                      <p className="mt-0.5 font-display text-base font-bold text-[#0b2147] dark:text-blue-300">
                        {formatCurrency(
                          Number(plan.price || 0)
                        )}
                      </p>

                    </div>

                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">

                      <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-300" />

                    </div>

                  </div>

                </motion.button>
              );

            })}

          </motion.div>

        )}

      </section>

      {/* =====================================================
          QUICK SERVICES
      ===================================================== */}

      <section className="px-5 pt-6">

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
                whileTap={{ scale: 0.94 }}
                className="group rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
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

      {/* =====================================================
          BOTTOM HIGHLIGHT
      ===================================================== */}

      <section className="px-5 pt-5">

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
                Explore all Gy Data services.
              </p>

            </div>

            <ArrowUpRight className="h-4 w-4 text-blue-500" />

          </div>

        </motion.button>

      </section>

    </div>
  );
}
