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
  },
  {
    label: 'Airtime',
    icon: Phone,
    path: '/buy-airtime',
    gradient: 'from-cyan-500 to-sky-600',
  },
  {
    label: 'Fund',
    icon: WalletIcon,
    path: '/fund-wallet',
    gradient: 'from-emerald-500 to-green-600',
  },
  {
    label: 'History',
    icon: Receipt,
    path: '/transactions',
    gradient: 'from-violet-500 to-purple-600',
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

const quickContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const quickItem = {
  hidden: {
    opacity: 0,
    y: 12,
    scale: 0.95,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 280,
      damping: 20,
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
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28 overflow-x-hidden">

      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#07152f] via-[#0b2454] to-[#0e3b78] px-5 pt-9 pb-24">

        {/* Background glow */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

        {/* Small decorative circles */}
        <div className="absolute top-16 right-16 h-2 w-2 rounded-full bg-white/20" />
        <div className="absolute top-28 right-28 h-1.5 w-1.5 rounded-full bg-cyan-300/30" />
        <div className="absolute bottom-12 right-10 h-1.5 w-1.5 rounded-full bg-blue-300/30" />

        {/* Header content */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative z-10 flex items-start justify-between"
        >
          {/* Logo + greeting */}
          <div>
            <Logo size="sm" showText />

            <div className="mt-4">
              <p className="text-[11px] font-medium text-white/50">
                {getGreeting()},
              </p>

              <h1 className="mt-0.5 text-xl font-bold text-white font-display">
                {firstName} 👋
              </h1>
            </div>
          </div>

          {/* Header buttons */}
          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 backdrop-blur-md transition active:scale-90"
            >
              <Bell className="h-[18px] w-[18px] text-white" />

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-[#0b2454]" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/support')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 backdrop-blur-md transition active:scale-90"
            >
              <Headphones className="h-[18px] w-[18px] text-white" />
            </button>

          </div>
        </motion.div>
      </header>

      {/* =====================================================
          WALLET CARD
      ====================================================== */}
      <section className="relative z-20 -mt-16 px-5">

        <motion.div
          initial={{
            opacity: 0,
            y: 24,
            scale: 0.97,
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
          className="relative overflow-hidden rounded-[24px] shadow-xl shadow-slate-900/20"
        >

          {/* Card background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#071426] via-[#0b2854] to-[#0d478b]" />

          {/* Card glow */}
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-400/15 blur-3xl" />

          <div className="absolute -bottom-20 -left-10 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl" />

          {/* Top shine */}
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="relative p-5">

            {/* Wallet heading */}
            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                  <WalletIcon className="h-4 w-4 text-white/70" />
                </div>

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/45">
                    Wallet Balance
                  </p>

                  <div className="mt-
