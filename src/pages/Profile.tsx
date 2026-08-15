import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Lock,
  LogOut,
  ChevronRight,
  Copy,
  Check,
  Wallet,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [copied, setCopied] = useState(false);
  const [transactionsCount, setTransactionsCount] =
    useState(0);

  useEffect(() => {
    loadTransactionCount();
  }, [user?.phone]);

  const loadTransactionCount = async () => {
    if (!user?.phone) return;

    const { count } = await supabase
      .from('transactions')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('phone', user.phone);

    setTransactionsCount(count || 0);
  };

  const copyPhone = async () => {
    if (!user?.phone) return;

    try {
      await navigator.clipboard.writeText(
        user.phone,
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName =
    (user as any)?.full_name ||
    (user as any)?.name ||
    'User';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-28 dark:bg-slate-950">

      {/* HEADER */}

      <div className="bg-[#0D1B3D] px-5 pb-20 pt-10">

        <div className="flex items-center gap-3">

          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 active:scale-95"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>

          <div className="flex-1">

            <h1 className="text-xl font-bold text-white">
              Profile
            </h1>

            <p className="text-xs text-white/60">
              Account settings
            </p>

          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <User className="h-5 w-5 text-white" />
          </div>

        </div>

      </div>

      <main className="-mt-12 px-5">

        {/* PROFILE CARD */}

        <motion.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="rounded-[18px] border border-[#E5E9F0] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >

          <div className="flex items-center gap-4">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0D1B3D] text-lg font-bold text-white">
              {initials || 'U'}
            </div>

            <div className="min-w-0 flex-1">

              <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">
                {displayName}
              </h2>

              <p className="mt-0.5 truncate text-xs text-slate-400">
                {user?.email ||
                  user?.phone ||
                  'Account'}
              </p>

              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-semibold text-emerald-600">
                  Active Account
                </span>
              </div>

            </div>

          </div>

          {/* ACCOUNT INFO */}

          <div className="mt-5 grid grid-cols-2 gap-2.5">

            <div className="rounded-xl bg-[#F6F8FB] p-3 dark:bg-slate-800">

              <div className="flex items-center gap-2">
                <Wallet className="h-3.5 w-3.5 text-[#F28C28]" />

                <p className="text-[9px] text-slate-400">
                  Wallet Balance
                </p>
              </div>

              <p className="mt-1 text-sm font-bold text-[#0D1B3D] dark:text-white">
                {formatCurrency(
                  Number(
                    user?.wallet_balance || 0,
                  ),
                )}
              </p>

            </div>

            <div className="rounded-xl bg-[#F6F8FB] p-3 dark:bg-slate-800">

              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#F28C28]" />

                <p className="text-[9px] text-slate-400">
                  Transactions
                </p>
              </div>

              <p className="mt-1 text-sm font-bold text-[#0D1B3D] dark:text-white">
                {transactionsCount}
              </p>

            </div>

          </div>

        </motion.div>

        {/* CONTACT INFORMATION */}

        <section className="mt-6">

          <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
            Personal Information
          </h2>

          <div className="overflow-hidden rounded-[16px] border border-[#E5E9F0] bg-white dark:border-slate-800 dark:bg-slate-900">

            <InfoRow
              icon={
                <User className="h-4 w-4" />
              }
              label="Full Name"
              value={displayName}
            />

            <InfoRow
              icon={
                <Phone className="h-4 w-4" />
              }
              label="Phone Number"
              value={user?.phone || 'Not set'}
              action={
                user?.phone ? (
                  <button
                    onClick={copyPhone}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F6F8FB] text-[#0D1B3D] dark:bg-slate-800 dark:text-white"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-[#F28C28]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                ) : null
              }
            />

            <InfoRow
              icon={
                <Mail className="h-4 w-4" />
              }
              label="Email Address"
              value={
                user?.email || 'Not set'
              }
              last
            />

          </div>

        </section>

        {/* ACCOUNT SETTINGS */}

        <section className="mt-6">

          <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
            Account Settings
          </h2>

          <div className="overflow-hidden rounded-[16px] border border-[#E5E9F0] bg-white dark:border-slate-800 dark:bg-slate-900">

            <SettingRow
              icon={
                <Lock className="h-4 w-4" />
              }
              title="Change PIN"
              subtitle="Update your transaction PIN"
              onClick={() =>
                navigate('/change-pin')
              }
            />

            <SettingRow
              icon={
                <ShieldCheck className="h-4 w-4" />
              }
              title="Security"
              subtitle="Manage account security"
              onClick={() =>
                navigate('/security')
              }
            />

            <SettingRow
              icon={
                <Wallet className="h-4 w-4" />
              }
              title="Wallet"
              subtitle="Manage your wallet"
              onClick={() =>
                navigate('/wallet')
              }
              last
            />

          </div>

        </section>

        {/* LOGOUT */}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-[14px] border border-red-100 bg-white py-3.5 text-sm font-bold text-red-500 dark:border-red-950 dark:bg-slate-900"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </motion.button>

        <p className="mt-5 text-center text-[9px] text-slate-400">
          Gy-Data • Secure digital services
        </p>

      </main>

      {/* COPIED MESSAGE */}

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
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#0D1B3D] px-4 py-2 text-xs font-semibold text-white shadow-xl"
        >
          Phone number copied
        </motion.div>
      )}

    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  action,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  action?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 ${
        !last
          ? 'border-b border-slate-100 dark:border-slate-800'
          : ''
      }`}
    >

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF2F8] text-[#0D1B3D] dark:bg-slate-800 dark:text-white">
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <p className="text-[9px] text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 truncate text-xs font-semibold text-slate-800 dark:text-white">
          {value}
        </p>

      </div>

      {action}

    </div>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  onClick,
  last = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${
        !last
          ? 'border-b border-slate-100 dark:border-slate-800'
          : ''
      }`}
    >

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF1E6] text-[#F28C28]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <p className="text-xs font-bold text-slate-800 dark:text-white">
          {title}
        </p>

        <p className="mt-0.5 text-[9px] text-slate-400">
          {subtitle}
        </p>

      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />

    </button>
  );
}
