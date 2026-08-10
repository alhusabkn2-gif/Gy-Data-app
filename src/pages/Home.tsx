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
          <div className="absolute -top-20 -right-16 w-48 h-48 rounded-full bg-blue
