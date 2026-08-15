import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Wallet as WalletIcon,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  History,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';

export default function Wallet() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [copied, setCopied] = useState(false);

  const balance = Number(user?.wallet_balance || 0);

  const copyAccount = async () => {
    const accountNumber =
      (user as any)?.account_number ||
      (user as any)?.phone ||
      '';

    if (!accountNumber) return;

    try {
      await navigator.clipboard.writeText(
        String(accountNumber),
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-28 dark:bg-slate-950">

      {/* HEADER */}

      <div className="bg-[#0D1B3D] px-5 pb-7 pt-10">

        <div className="flex items-center gap-3">

          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 active:scale-95"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>

          <div className="flex-1">

            <h1 className="text-xl font-bold text-white">
              Wallet
            </h1>

            <p className="text-xs text-white/60">
              Manage your wallet
            </p>

          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <WalletIcon className="h-5 w-5 text-white" />
          </div>

        </div>

      </div>

      <main className="-mt-2 px-5 pt-5">

        {/* BALANCE CARD */}

        <motion.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="overflow-hidden rounded-[18px] bg-[#0D1B3D] p-5 shadow-[0_10px_30px_rgba(13,27,61,0.18)]"
        >

          <div className="flex items-start justify-between">

            <div>

              <p className="text-[11px] font-medium text-white/60">
                Available Balance
              </p>

              <p className="mt-1 text-[27px] font-bold tracking-tight text-white">
                {formatCurrency(balance)}
              </p>

            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
              <WalletIcon className="h-5 w-5 text-white" />
            </div>

          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">

            <button
              onClick={() =>
                navigate('/wallet/fund')
              }
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F28C28] text-xs font-bold text-white active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Fund Wallet
            </button>

            <button
              onClick={() =>
                navigate('/transactions')
              }
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white/10 text-xs font-semibold text-white ring-1 ring-white/10 active:scale-[0.98]"
            >
              <History className="h-4 w-4" />
              Transactions
            </button>

          </div>

        </motion.div>

        {/* QUICK ACTIONS */}

        <section className="mt-6">

          <h2 className="mb-3 text-sm font-bold text-[#0F172A] dark:text-white">
            Quick Actions
          </h2>

          <div className="grid grid-cols-2 gap-3">

            <ActionCard
              icon={
                <ArrowDownLeft className="h-5 w-5" />
              }
              title="Fund Wallet"
              subtitle="Add money to wallet"
              orange
              onClick={() =>
                navigate('/wallet/fund')
              }
            />

            <ActionCard
              icon={
                <ArrowUpRight className="h-5 w-5" />
              }
              title="Send Money"
              subtitle="Transfer funds"
              onClick={() =>
                navigate('/transfer')
              }
            />

          </div>

        </section>

        {/* ACCOUNT DETAILS */}

        <section className="mt-6">

          <div className="mb-3 flex items-center justify-between">

            <h2 className="text-sm font-bold text-[#0F172A] dark:text-white">
              Wallet Details
            </h2>

            <ShieldCheck className="h-4 w-4 text-[#F28C28]" />

          </div>

          <div className="rounded-[16px] border border-[#E5E9F0] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-[10px] text-slate-400">
                  Account Name
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">
                  {(user as any)?.full_name ||
                    'User'}
                </p>

              </div>

            </div>

            <div className="my-4 h-px bg-slate-100 dark:bg-slate-800" />

            <div className="flex items-center justify-between">

              <div>

                <p className="text-[10px] text-slate-400">
                  Account / Phone
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">
                  {(user as any)?.account_number ||
                    user?.phone ||
                    '—'}
                </p>

              </div>

              <button
                onClick={copyAccount}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F6F8FB] text-[#0D1B3D] dark:bg-slate-800 dark:text-white"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-[#F28C28]" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>

            </div>

          </div>

        </section>

        {/* SECURITY */}

        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            delay: 0.2,
          }}
          className="mt-5 flex items-center gap-3 rounded-[14px] border border-[#E5E9F0] bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
        >

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF1E6]">
            <ShieldCheck className="h-4 w-4 text-[#F28C28]" />
          </div>

          <div>

            <p className="text-xs font-semibold text-slate-800 dark:text-white">
              Secure Wallet
            </p>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Your wallet transactions are protected.
            </p>

          </div>

        </motion.div>

      </main>

      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 15,
            }}
            className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#0D1B3D] px-4 py-2 text-xs font-semibold text-white shadow-xl"
          >
            Account copied
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  onClick,
  orange = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  orange?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex items-center gap-3 rounded-[15px] border border-[#E5E9F0] bg-white p-3.5 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          orange
            ? 'bg-[#FFF1E6] text-[#F28C28]'
            : 'bg-[#EEF2F8] text-[#0D1B3D]'
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0">

        <p className="truncate text-xs font-bold text-slate-800 dark:text-white">
          {title}
        </p>

        <p className="mt-0.5 truncate text-[9px] text-slate-400">
          {subtitle}
        </p>

      </div>

    </motion.button>
  );
}
