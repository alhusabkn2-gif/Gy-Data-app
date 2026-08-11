import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Database,
  Download,
  Eye,
  FileText,
  Filter,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  UserX,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDateTime } from '../lib/utils';

type Section =
  | 'overview'
  | 'users'
  | 'wallet'
  | 'transactions'
  | 'revenue'
  | 'funding'
  | 'admins'
  | 'security'
  | 'notifications'
  | 'settings';

type UserRow = {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  wallet_balance?: number;
  is_admin?: boolean;
  created_at: string;
};

type TransactionRow = {
  id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
  description?: string | null;
  user_id?: string | null;
};

const NAV_ITEMS: {
  id: Section;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users Management', icon: Users },
  { id: 'wallet', label: 'Wallet / Funding', icon: Wallet },
  { id: 'transactions', label: 'Transactions', icon: ClipboardList },
  { id: 'revenue', label: 'Revenue / Statistics', icon: TrendingUp },
  { id: 'funding', label: 'Funding Accounts', icon: Building2 },
  { id: 'admins', label: 'Admin Management', icon: UserCog },
  { id: 'security', label: 'Security / Activity', icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'System Settings', icon: Settings },
];

const MANUAL_FUNDING = {
  bank: 'PalmPay',
  accountNumber: '9550627002',
  accountName: 'Abdurrahman Yahaya Ibrahim',
};

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const [active, setActive] = useState<Section>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showAction, setShowAction] = useState<
    'fund' | 'user' | 'admin' | 'notification' | null
  >(null);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [userFilter, setUserFilter] = useState<
    'all' | 'active' | 'suspended' | 'admins'
  >('all');

  const [transactionFilter, setTransactionFilter] = useState<
    'all' | 'success' | 'pending' | 'failed'
  >('all');

  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [{ data: userData }, { data: transactionData }] =
        await Promise.all([
          supabase
            .from('profiles')
            .select(
              'id, full_name, phone, email, wallet_balance, is_admin, created_at'
            )
            .order('created_at', { ascending: false }),

          supabase
            .from('transactions')
            .select(
              'id, amount, type, status, created_at, description, user_id'
            )
            .order('created_at', { ascending: false })
            .limit(100),
        ]);

      setUsers((userData || []) as UserRow[]);
      setTransactions((transactionData || []) as TransactionRow[]);
    } catch (error) {
      console.error('Super Admin dashboard error:', error);
      setToast('Unable to load some dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
    setToast('Dashboard refreshed.');
  };

  const totalWalletBalance = useMemo(
    () =>
      users.reduce(
        (sum, user) => sum + Number(user.wallet_balance || 0),
        0
      ),
    [users]
  );

  const successfulRevenue = useMemo(
    () =>
      transactions
        .filter(
          (tx) =>
            tx.status === 'success' &&
            ['purchase', 'airtime', 'data', 'bill'].includes(
              String(tx.type).toLowerCase()
            )
        )
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
    [transactions]
  );

  const successfulTransactions = transactions.filter(
    (tx) => tx.status === 'success'
  ).length;

  const pendingTransactions = transactions.filter(
    (tx) => tx.status === 'pending'
  ).length;

  const failedTransactions = transactions.filter(
    (tx) => tx.status === 'failed'
  ).length;

  const adminCount = users.filter((user) => user.is_admin).length;

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.full_name?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query);

      const matchesFilter =
        userFilter === 'all' ||
        (userFilter === 'admins' && user.is_admin) ||
        (userFilter === 'active' && !user.is_admin) ||
        (userFilter === 'suspended' && false);

      return matchesSearch && matchesFilter;
    });
  }, [users, search, userFilter]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((tx) => {
      const matchesSearch =
        !query ||
        tx.id?.toLowerCase().includes(query) ||
        tx.type?.toLowerCase().includes(query) ||
        tx.description?.toLowerCase().includes(query);

      const matchesFilter =
        transactionFilter === 'all' ||
        tx.status === transactionFilter;

      return matchesSearch && matchesFilter;
    });
  }, [transactions, search, transactionFilter]);

  const goTo = (section: Section) => {
    setActive(section);
    setSidebarOpen(false);
    setSearch('');
  };

  const showMessage = (message: string) => {
    setToast(message);
  };

  const handleLogout = () => {
    localStorage.removeItem('gydata_super_admin');
    localStorage.removeItem('gydata_session');
    navigate('/login');
  };

  const activateUser = async (user: UserRow) => {
    showMessage(
      `${user.full_name || 'User'} activation is ready for backend enforcement.`
    );
    setSelectedUser(null);
  };

  const suspendUser = async (user: UserRow) => {
    showMessage(
      `${user.full_name || 'User'} suspension is ready for backend enforcement.`
    );
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-navy-950/70 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[285px] flex-col bg-navy-950 text-white shadow-2xl transition-transform duration-300 ${
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="border-b border-white/10 px-6 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => goTo('overview')}
              className="flex items-center gap-3 text-left"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-700 shadow-lg shadow-blue-600/30">
                <span className="font-display text-xl font-extrabold">
                  GY
                </span>
              </div>

              <div>
                <p className="font-display text-base font-extrabold tracking-tight">
                  GY DATA
                </p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.22em] text-blue-300">
                  Super Admin Office
                </p>
              </div>
            </button>

            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-xl p-2 text-white/50 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="border-b border-white/10 px-5 py-4">
          <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
                <Shield className="h-5 w-5 text-blue-300" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Highest Privilege
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  Executive Control
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
            Control Center
          </p>

          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const activeItem = active === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => goTo(item.id)}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all ${
                    activeItem
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'text-white/55 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] ${
                      activeItem
                        ? 'text-white'
                        : 'text-white/40 group-hover:text-blue-300'
                    }`}
                  />

                  <span>{item.label}</span>

                  {activeItem && (
                    <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            onClick={() => goTo('security')}
            className="mb-2 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white"
          >
            <Activity className="h-[18px] w-[18px]" />
            System Activity
          </button>

          <button
            onClick={() => setShowLogout(true)}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="min-h-screen lg:pl-[285px]">
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl bg-slate-100 p-2.5 text-navy-900 hover:bg-slate-200 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <h1 className="truncate font-display text-lg font-extrabold text-navy-950 sm:text-xl">
                  {NAV_ITEMS.find((item) => item.id === active)?.label}
                </h1>
                <p className="hidden text-xs text-slate-400 sm:block">
                  GY Data Executive Control Center
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:flex">
                <Search className="h-4 w-4 text-slate-400" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search users, transactions..."
                  className="w-40 bg-transparent text-sm outline-none placeholder:text-slate-400 lg:w-60"
                />
              </div>

              <button
                onClick={() => setShowNotifications((value) => !value)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-navy-900 hover:bg-slate-50"
              >
                <Bell className="h-5 w-5" />

                {pendingTransactions > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {pendingTransactions > 9
                      ? '9+'
                      : pendingTransactions}
                  </span>
                )}
              </button>

              <button
                onClick={() => goTo('security')}
                className="hidden h-10 items-center gap-2 rounded-xl bg-navy-950 px-3 text-white hover:bg-navy-800 sm:flex"
              >
                <ShieldCheck className="h-4 w-4 text-blue-300" />
                <span className="text-xs font-bold">SUPER ADMIN</span>
              </button>
            </div>
          </div>

          {/* MOBILE SEARCH */}
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:hidden">
            <Search className="h-4 w-4 text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </header>

        {/* CONTENT */}
        <main className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {active === 'overview' && (
                <OverviewSection
                  loading={loading}
                  users={users}
                  transactions={transactions}
                  totalWalletBalance={totalWalletBalance}
                  successfulRevenue={successfulRevenue}
                  successfulTransactions={successfulTransactions}
                  pendingTransactions={pendingTransactions}
                  failedTransactions={failedTransactions}
                  adminCount={adminCount}
                  onNavigate={goTo}
                  onRefresh={refreshDashboard}
                  refreshing={refreshing}
                  onAction={setShowAction}
                />
              )}

              {active === 'users' && (
                <UsersSection
                  users={filteredUsers}
                  filter={userFilter}
                  setFilter={setUserFilter}
                  search={search}
                  onAdd={() => setShowAction('user')}
                  onSelect={setSelectedUser}
                />
              )}

              {active === 'wallet' && (
                <WalletSection
                  users={users}
                  totalBalance={totalWalletBalance}
                  onFund={() => setShowAction('fund')}
                  onNavigate={goTo}
                />
              )}

              {active === 'transactions' && (
                <TransactionsSection
                  transactions={filteredTransactions}
                  filter={transactionFilter}
                  setFilter={setTransactionFilter}
                />
              )}

              {active === 'revenue' && (
                <RevenueSection
                  transactions={transactions}
                  revenue={successfulRevenue}
                />
              )}

              {active === 'funding' && (
                <FundingSection
                  onAction={() => setShowAction('fund')}
                  onNavigate={goTo}
                />
              )}

              {active === 'admins' && (
                <AdminManagementSection
                  users={users.filter((user) => user.is_admin)}
                  onAdd={() => setShowAction('admin')}
                  onSecurity={() => goTo('security')}
                />
              )}

              {active === 'security' && (
                <SecuritySection
                  users={users}
                  transactions={transactions}
                  onRefresh={refreshDashboard}
                />
              )}

              {active === 'notifications' && (
                <NotificationsSection
                  pending={pendingTransactions}
                  failed={failedTransactions}
                  onCompose={() => setShowAction('notification')}
                />
              )}

              {active === 'settings' && (
                <SettingsSection
                  onSecurity={() => goTo('security')}
                  onFunding={() => goTo('funding')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* NOTIFICATIONS PANEL */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed right-4 top-20 z-[70] w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-navy-950">
                  Alerts
                </h3>
                <p className="text-xs text-slate-400">
                  System attention items
                </p>
              </div>

              <button
                onClick={() => setShowNotifications(false)}
                className="rounded-xl p-2 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <AlertItem
                icon={ClockIcon}
                title={`${pendingTransactions} pending transactions`}
                description="Review pending activity."
                onClick={() => {
                  setShowNotifications(false);
                  goTo('transactions');
                }}
              />

              <AlertItem
                icon={AlertTriangle}
                title={`${failedTransactions} failed transactions`}
                description="Check recent failed operations."
                onClick={() => {
                  setShowNotifications(false);
                  goTo('transactions');
                }}
              />

              <AlertItem
                icon={ShieldCheck}
                title="Security center"
                description="Review administrative activity."
                onClick={() => {
                  setShowNotifications(false);
                  goTo('security');
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* USER DETAIL MODAL */}
      <AnimatePresence>
        {selectedUser && (
          <UserDetailModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onActivate={activateUser}
            onSuspend={suspendUser}
          />
        )}
      </AnimatePresence>

      {/* ACTION MODAL */}
      <AnimatePresence>
        {showAction && (
          <ActionModal
            type={showAction}
            onClose={() => setShowAction(null)}
            onDone={(message) => {
              setShowAction(null);
              showMessage(message);
            }}
          />
        )}
      </AnimatePresence>

      {/* LOGOUT MODAL */}
      <AnimatePresence>
        {showLogout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <LogOut className="h-6 w-6" />
              </div>

              <h3 className="font-display text-lg font-extrabold text-navy-950">
                Logout Super Admin?
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                You will leave the GY Data executive control center.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowLogout(false)}
                  className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  onClick={handleLogout}
                  className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-5 left-1/2 z-[120] -translate-x-1/2 rounded-2xl bg-navy-950 px-5 py-3 text-sm font-semibold text-white shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   OVERVIEW
========================================================= */

function OverviewSection({
  loading,
  users,
  transactions,
  totalWalletBalance,
  successfulRevenue,
  successfulTransactions,
  pendingTransactions,
  failedTransactions,
  adminCount,
  onNavigate,
  onRefresh,
  refreshing,
  onAction,
}: {
  loading: boolean;
  users: UserRow[];
  transactions: TransactionRow[];
  totalWalletBalance: number;
  successfulRevenue: number;
  successfulTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  adminCount: number;
  onNavigate: (section: Section) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onAction: (
    action: 'fund' | 'user' | 'admin' | 'notification' | null
  ) => void;
}) {
  const stats = [
    {
      title: 'Total Users',
      value: users.length.toLocaleString(),
      icon: Users,
      note: 'Registered accounts',
      section: 'users' as Section,
      iconClass: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Wallet Value',
      value: formatCurrency(totalWalletBalance),
      icon: Wallet,
      note: 'Current user balances',
      section: 'wallet' as Section,
      iconClass: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Revenue',
      value: formatCurrency(successfulRevenue),
      icon: TrendingUp,
      note: 'Successful service revenue',
      section: 'revenue' as Section,
      iconClass: 'bg-violet-50 text-violet-600',
    },
    {
      title: 'Transactions',
      value: transactions.length.toLocaleString(),
      icon: ClipboardList,
      note: `${successfulTransactions} successful`,
      section: 'transactions' as Section,
      iconClass: 'bg-cyan-50 text-cyan-600',
    },
  ];

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'Search, inspect and manage users',
      icon: Users,
      action: () => onNavigate('users'),
    },
    {
      title: 'Manual Funding',
      description: 'Review wallet funding operations',
      icon: Wallet,
      action: () => onAction('fund'),
    },
    {
      title: 'Transactions',
      description: 'Inspect all recent activity',
      icon: ClipboardList,
      action: () => onNavigate('transactions'),
    },
    {
      title: 'Security Center',
      description: 'Review system activity',
      icon: ShieldCheck,
      action: () => onNavigate('security'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] bg-gradient-to-br from-navy-950 via-navy-900 to-blue-900 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Executive Control Center
            </div>

            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Super Admin Overview
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
              The highest-level control center for GY Data operations,
              users, wallet activity, funding, security and platform
              performance.
            </p>
          </div>

          <button
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-navy-950 shadow-lg hover:bg-blue-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <button
              key={stat.title}
              onClick={() => onNavigate(stat.section)}
              className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.iconClass}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                {stat.title}
              </p>

              <p className="mt-1 truncate font-display text-xl font-extrabold text-navy-950 sm:text-2xl">
                {loading ? '—' : stat.value}
              </p>

              <p className="mt-1 text-xs text-slate-400">{stat.note}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-display font-extrabold text-navy-950">
                Operational Snapshot
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Live activity indicators
              </p>
            </div>

            <button
              onClick={() => onNavigate('security')}
              className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
            >
              <Activity className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniMetric
              label="Successful"
              value={successfulTransactions}
              icon={CheckCircle2}
              className="text-emerald-600 bg-emerald-50"
              onClick={() => onNavigate('transactions')}
            />

            <MiniMetric
              label="Pending"
              value={pendingTransactions}
              icon={AlertTriangle}
              className="text-amber-600 bg-amber-50"
              onClick={() => onNavigate('transactions')}
            />

            <MiniMetric
              label="Failed"
              value={failedTransactions}
              icon={AlertTriangle}
              className="text-red-600 bg-red-50"
              onClick={() => onNavigate('transactions')}
            />

            <MiniMetric
              label="Admins"
              value={adminCount}
              icon={UserCog}
              className="text-violet-600 bg-violet-50"
              onClick={() => onNavigate('admins')}
            />
          </div>

          <div className="mt-5 space-y-3">
            {transactions.slice(0, 5).map((tx) => (
              <button
                key={tx.id}
                onClick={() => onNavigate('transactions')}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 p-3 text-left hover:border-blue-100 hover:bg-blue-50/30"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  {tx.status === 'success' ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Activity className="h-4 w-4 text-slate-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy-950">
                    {tx.description || tx.type || 'Transaction'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {formatDateTime(tx.created_at)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-extrabold text-navy-950">
                    {formatCurrency(Number(tx.amount || 0))}
                  </p>
                  <StatusBadge status={tx.status} />
                </div>
              </button>
            ))}

            {transactions.length === 0 && (
              <EmptyState
                icon={ClipboardList}
                title="No transactions yet"
                description="Transaction activity will appear here."
              />
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h3 className="font-display font-extrabold text-navy-950">
              Executive Actions
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Direct access to high-level operations
