import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Smartphone,
  Phone,
  Wallet,
  ArrowRight,
  History,
  User,
  Headphones,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

function ServiceCard({
  title,
  description,
  icon,
  onClick,
  disabled = false,
}: ServiceCardProps) {
  return (
    <motion.button
      type="button"
      whileTap={!disabled ? { scale: 0.96 } : undefined}
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left rounded-3xl p-4 border transition-all ${
        disabled
          ? 'opacity-60 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-400 hover:shadow-lg'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center">
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-white">
            {title}
          </h3>

          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {description}
          </p>
        </div>

        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <ArrowRight className="w-4 h-4 text-slate-500" />
        </div>
      </div>
    </motion.button>
  );
}

export default function CustomerHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const walletBalance = Number(user?.wallet_balance || 0);

  const firstName =
    user?.full_name?.split(' ')[0] ||
    user?.name?.split(' ')[0] ||
    'Customer';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28">

      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 px-5 pt-10 pb-28">

        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />

        <div className="absolute -bottom-20 -left-16 w-56 h-56 rounded-full bg-white/5 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* TOP BAR */}
          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-1 ring-white/10"
            >
              <User className="w-5 h-5 text-white" />
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-xs">
                Welcome back
              </p>

              <h1 className="text-lg font-bold text-white truncate">
                {firstName}
              </h1>
            </div>

            <button
              type="button"
              onClick={() => navigate('/transactions')}
              className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-1 ring-white/10"
            >
              <History className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* WALLET */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-7 rounded-3xl bg-white/10 backdrop-blur-md p-5 ring-1 ring-white/10"
          >
            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                  Wallet Balance
                </p>

                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(walletBalance)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/wallet')}
                className="px-3.5 py-2 rounded-xl bg-white text-primary-700 text-xs font-bold"
              >
                Fund Wallet
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* CONTENT */}
      <main className="px-5 -mt-14 relative z-10 space-y-6">

        {/* QUICK ACTIONS */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                Quick Services
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Choose a service to continue
              </p>
            </div>
          </div>

          <div className="space-y-3">

            {/* DATA */}
            <ServiceCard
              title="Buy Data"
              description="Choose network, category and data plan"
              icon={<Smartphone className="w-5 h-5" />}
              onClick={() => navigate('/buy-data')}
            />

            {/* AIRTIME */}
            <ServiceCard
              title="Buy Airtime"
              description="Recharge any Nigerian phone number"
              icon={<Phone className="w-5 h-5" />}
              onClick={() => navigate('/buy-airtime')}
            />

            {/* FUND WALLET */}
            <ServiceCard
              title="Fund Wallet"
              description="Add money to your wallet"
              icon={<Wallet className="w-5 h-5" />}
              onClick={() => navigate('/wallet')}
            />
          </div>
        </motion.section>

        {/* DATA SHORTCUT */}
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/buy-data')}
          className="w-full text-left rounded-3xl overflow-hidden bg-gradient-to-br from-primary-600 to-primary-900 p-5 shadow-lg"
        >
          <div className="flex items-center gap-4">

            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <Smartphone className="w-7 h-7 text-white" />
            </div>

            <div className="flex-1">
              <p className="text-white/60 text-xs">
                Need data?
              </p>

              <h2 className="text-xl font-bold text-white mt-1">
                Choose Your Data Plan
              </h2>

              <p className="text-white/60 text-xs mt-1">
                Select your network and see available plans
              </p>
            </div>

            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </div>
        </motion.button>

        {/* OTHER SERVICES */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="font-bold text-slate-900 dark:text-white mb-3">
            More
          </h2>

          <div className="grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={() => navigate('/transactions')}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-left"
            >
              <History className="w-5 h-5 text-primary-600 mb-3" />

              <p className="font-bold text-sm text-slate-900 dark:text-white">
                Transactions
              </p>

              <p className="text-[11px] text-slate-400 mt-1">
                View your activities
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-left"
            >
              <User className="w-5 h-5 text-primary-600 mb-3" />

              <p className="font-bold text-sm text-slate-900 dark:text-white">
                Profile
              </p>

              <p className="text-[11px] text-slate-400 mt-1">
                Manage your account
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate('/support')}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-left"
            >
              <Headphones className="w-5 h-5 text-primary-600 mb-3" />

              <p className="font-bold text-sm text-slate-900 dark:text-white">
                Support
              </p>

              <p className="text-[11px] text-slate-400 mt-1">
                Get help
              </p>
            </button>

            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
              <ShieldCheck className="w-5 h-5 text-primary-600 mb-3" />

              <p className="font-bold text-sm text-slate-900 dark:text-white">
                Secure
              </p>

              <p className="text-[11px] text-slate-400 mt-1">
                Your account is protected
              </p>
            </div>
          </div>
        </motion.section>

      </main>
    </div>
  );
}
