import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  ShieldCheck,
  Bell,
  Moon,
  HelpCircle,
  FileText,
  LogOut,
  User,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [notifications, setNotifications] =
    useState(true);
  const [darkMode, setDarkMode] =
    useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
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
              Settings
            </h1>

            <p className="mt-0.5 text-xs text-white/60">
              Manage your account
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <User className="h-5 w-5 text-white" />
          </div>

        </div>

      </div>

      <main className="px-5 pt-5">

        {/* SECURITY */}

        <SectionTitle title="Security" />

        <div className="overflow-hidden rounded-[16px] border border-[#E5E9F0] bg-white dark:border-slate-800 dark:bg-slate-900">

          <SettingItem
            icon={<Lock className="h-4 w-4" />}
            title="Change PIN"
            subtitle="Update your transaction PIN"
            onClick={() =>
              navigate('/change-pin')
            }
          />

          <SettingItem
            icon={
              <ShieldCheck className="h-4 w-4" />
            }
            title="Security"
            subtitle="Manage your account security"
            onClick={() =>
              navigate('/security')
            }
            last
          />

        </div>

        {/* PREFERENCES */}

        <div className="mt-6">

          <SectionTitle title="Preferences" />

          <div className="overflow-hidden rounded-[16px] border border-[#E5E9F0] bg-white dark:border-slate-800 dark:bg-slate-900">

            <ToggleItem
              icon={
                <Bell className="h-4 w-4" />
              }
              title="Notifications"
              subtitle="Receive transaction notifications"
              enabled={notifications}
              onChange={() =>
                setNotifications(!notifications)
              }
            />

            <ToggleItem
              icon={
                <Moon className="h-4 w-4" />
              }
              title="Dark Mode"
              subtitle="Use dark appearance"
              enabled={darkMode}
              onChange={() =>
                setDarkMode(!darkMode)
              }
              last
            />

          </div>

        </div>

        {/* SUPPORT */}

        <div className="mt-6">

          <SectionTitle title="Support" />

          <div className="overflow-hidden rounded-[16px] border border-[#E5E9F0] bg-white dark:border-slate-800 dark:bg-slate-900">

            <SettingItem
              icon={
                <HelpCircle className="h-4 w-4" />
              }
              title="Help & Support"
              subtitle="Get help with your account"
              onClick={() =>
                navigate('/support')
              }
            />

            <SettingItem
              icon={
                <FileText className="h-4 w-4" />
              }
              title="Terms & Privacy"
              subtitle="Read our terms and privacy policy"
              onClick={() =>
                navigate('/terms')
              }
              last
            />

          </div>

        </div>

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

    </div>
  );
}

function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
      {title}
    </h2>
  );
}

function SettingItem({
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

function ToggleItem({
  icon,
  title,
  subtitle,
  enabled,
  onChange,
  last = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  enabled: boolean;
  onChange: () => void;
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
        <p className="text-xs font-bold text-slate-800 dark:text-white">
          {title}
        </p>

        <p className="mt-0.5 text-[9px] text-slate-400">
          {subtitle}
        </p>
      </div>

      <button
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          enabled
            ? 'bg-[#F28C28]'
            : 'bg-slate-200 dark:bg-slate-700'
        }`}
        aria-label={title}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            enabled
              ? 'translate-x-6'
              : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
