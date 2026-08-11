import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  Bell,
  ChevronRight,
  CreditCard,
  Database,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { motion } from 'framer-motion';

const SUPER_ADMIN_SESSION = 'gydata_super_admin_session';

const cards = [
  {
    title: 'Total Users',
    value: '0',
    icon: Users,
    description: 'Registered customers',
  },
  {
    title: 'Wallet Balance',
    value: '₦0.00',
    icon: Wallet,
    description: 'Total customer balance',
  },
  {
    title: 'Transactions',
    value: '0',
    icon: Activity,
    description: 'All-time transactions',
  },
  {
    title: 'Today Revenue',
    value: '₦0.00',
    icon: BarChart3,
    description: 'Revenue generated today',
  },
];

const quickActions = [
  {
    title: 'Users',
    description: 'Manage customer accounts',
    icon: Users,
  },
  {
    title: 'Wallet',
    description: 'Review wallet activity',
    icon: Wallet,
  },
  {
    title: 'Transactions',
    description: 'Monitor all transactions',
    icon: CreditCard,
  },
  {
    title: 'Funding',
    description: 'Review funding requests',
    icon: ArrowDownToLine,
  },
  {
    title: 'Services',
    description: 'Control available services',
    icon: Database,
  },
  {
    title: 'Reports',
    description: 'View business reports',
    icon: BarChart3,
  },
];

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem(SUPER_ADMIN_SESSION);
    navigate('/super-admin-login', {
      replace: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] pb-10">

      {/* Header */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-5 py-4 sm:px-8">

          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#071b55] shadow-lg shadow-blue-900/20">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                  GY Data
                </p>

                <h1 className="font-display text-lg font-bold text-[#07143d]">
                  Super Admin
                </h1>
              </div>

            </div>

            <div className="flex items-center gap-2">

              <button
                type="button"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 sm:flex"
              >
                <Bell className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex h-10 items-center gap-2 rounded-xl bg-red-50 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">
                  Logout
                </span>
              </button>

            </div>

          </div>

        </div>
      </header>

      {/* Main */}

      <main className="mx-auto max-w-7xl px-5 pt-6 sm:px-8">

        {/* Welcome */}

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#071b55] via-[#082b82] to-[#0755b8] p-6 text-white shadow-xl shadow-blue-900/15 sm:p-8"
        >

          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">

            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                  Control Center
                </span>
              </div>

              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                Super Admin Dashboard
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
                Central management area for the GY Data platform,
                users, wallets, transactions and services.
              </p>
            </div>

            <div className="hidden h-20 w-20 items-center justify-center rounded-3xl bg-white/10 sm:flex">
              <ShieldCheck className="h-10 w-10 text-white/80" />
            </div>

          </div>

        </motion.section>

        {/* Statistics */}

        <section className="mb-8">

          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                Platform Overview
              </h3>

              <p className="text-xs text-slate-400">
                Current system statistics
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              System Online
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

            {cards.map((card, index) => {
              const Icon = card.icon;

              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.06,
                  }}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >

                  <div className="mb-4 flex items-center justify-between">

                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>

                    <ArrowUpRight className="h-4 w-4 text-slate-300" />

                  </div>

                  <p className="text-xs font-medium text-slate-400">
                    {card.title}
                  </p>

                  <p className="mt-1 font-display text-xl font-bold text-slate-900 sm:text-2xl">
                    {card.value}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    {card.description}
                  </p>

                </motion.div>
              );
            })}

          </div>

        </section>

        {/* Quick Actions */}

        <section className="mb-8">

          <div className="mb-4">
            <h3 className="font-display text-lg font-bold text-slate-900">
              Management
            </h3>

            <p className="text-xs text-slate-400">
              Super Admin platform controls
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

            {quickActions.map((action, index) => {
              const Icon = action.icon;

              return (
                <motion.button
                  key={action.title}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 transition group-hover:bg-blue-50">
                    <Icon className="h-5 w-5 text-slate-600 transition group-hover:text-blue-600" />
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="font-semibold text-slate-800">
                      {action.title}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {action.description}
                    </p>

                  </div>

                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />

                </motion.button>
              );
            })}

          </div>

        </section>

        {/* Bottom panels */}

        <section className="grid gap-4 lg:grid-cols-2">

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-5 flex items-center justify-between">

              <div>
                <h3 className="font-display font-bold text-slate-900">
                  Recent Activity
                </h3>

                <p className="text-xs text-slate-400">
                  Latest platform events
                </p>
              </div>

              <Activity className="h-5 w-5 text-blue-500" />

            </div>

            <div className="flex min-h-[150px] items-center justify-center rounded-2xl bg-slate-50">

              <p className="text-xs text-slate-400">
                No recent activity
              </p>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-5 flex items-center justify-between">

              <div>
                <h3 className="font-display font-bold text-slate-900">
                  System Controls
                </h3>

                <p className="text-xs text-slate-400">
                  Platform configuration
                </p>
              </div>

              <Settings className="h-5 w-5 text-blue-500" />

            </div>

            <div className="space-y-3">

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left transition hover:bg-blue-50"
              >
                <Settings className="h-4 w-4 text-slate-500" />

                <span className="flex-1 text-sm font-medium text-slate-700">
                  Platform Settings
                </span>

                <ChevronRight className="h-4 w-4 text-slate-300" />
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left transition hover:bg-blue-50"
              >
                <ShieldCheck className="h-4 w-4 text-slate-500" />

                <span className="flex-1 text-sm font-medium text-slate-700">
                  Security
                </span>

                <ChevronRight className="h-4 w-4 text-slate-300" />
              </button>

            </div>

          </div>

        </section>

      </main>
    </div>
  );
}
