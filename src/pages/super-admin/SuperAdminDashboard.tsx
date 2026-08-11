import { useState, type ReactNode } from 'react';
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
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';

const SESSION_KEY = 'gydata_super_admin_session';

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

const sections: Array<{ id: Section; label: string; icon: typeof Users }> = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users Management', icon: Users },
  { id: 'wallet', label: 'Wallet / Manual Funding', icon: Wallet },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
  { id: 'revenue', label: 'Revenue / Statistics', icon: ArrowUpRight },
  { id: 'funding', label: 'Funding Accounts', icon: ArrowDownToLine },
  { id: 'admins', label: 'Admin Management', icon: ShieldCheck },
  { id: 'security', label: 'Security / Activity Logs', icon: Activity },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'System Settings', icon: Settings },
];

const titles: Record<Section, string> = {
  overview: 'Executive Overview',
  users: 'Users Management',
  wallet: 'Wallet & Manual Funding',
  transactions: 'Transactions',
  revenue: 'Revenue & Statistics',
  funding: 'Funding Accounts',
  admins: 'Admin Management',
  security: 'Security & Activity Logs',
  notifications: 'Notifications',
  settings: 'System Settings',
};

const descriptions: Record<Section, string> = {
  overview: 'Direct access to high-level operations',
  users: 'Manage customer accounts and account status',
  wallet: 'Monitor wallets and manual funding activity',
  transactions: 'Review and monitor platform transactions',
  revenue: 'Monitor platform performance and revenue',
  funding: 'Manage platform funding accounts',
  admins: 'Control administrative access and permissions',
  security: 'Review security events and activity',
  notifications: 'Review platform notifications and alerts',
  settings: 'Manage system-level configuration',
};

type ButtonProps = {
  children: ReactNode;
  onClick: () => void;
  className?: string;
};

function ActionButton({
  children,
  onClick,
  className = '',
}: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  onClick,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof Wallet;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </button>
  );
}

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Database;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Icon className="h-7 w-7" />
      </div>

      <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const [section, setSection] = useState<Section>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');

  const open = (next: Section) => {
    setSection(next);
    setMenuOpen(false);
    setSearch('');
  };

  const message = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 2600);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('gydata_super_admin');
    navigate('/super-admin-login', { replace: true });
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Users"
          value="0"
          subtitle="Registered customer accounts"
          icon={Users}
          onClick={() => open('users')}
        />

        <MetricCard
          title="Wallet Balance"
          value="₦0"
          subtitle="Current platform wallet"
          icon={Wallet}
          onClick={() => open('wallet')}
        />

        <MetricCard
          title="Transactions"
          value="0"
          subtitle="Total recorded transactions"
          icon={CreditCard}
          onClick={() => open('transactions')}
        />

        <MetricCard
          title="Revenue"
          value="₦0"
          subtitle="Current recorded revenue"
          icon={ArrowUpRight}
          onClick={() => open('revenue')}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-900">
                Quick Control Center
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Access high-level Super Admin operations.
              </p>
            </div>

            <ShieldCheck className="h-5 w-5 text-blue-600" />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {sections.slice(1, 9).map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => open(item.id)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800">
                      {item.label}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {descriptions[item.id]}
                    </p>
                  </div>

                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">Executive Status</h2>
              <p className="text-xs text-slate-500">
                System control summary
              </p>
            </div>
          </div>

          <div className="mt-5">
            <StatusRow label="Office level" value="Super Admin" />
            <StatusRow label="Access level" value="Highest" />
            <StatusRow label="System status" value="Online" />
            <StatusRow label="Security status" value="Protected" />
          </div>

          <ActionButton
            onClick={() => open('security')}
            className="mt-5 w-full bg-slate-900 text-white hover:bg-slate-800"
          >
            <Activity className="h-4 w-4" />
            Open Security Center
          </ActionButton>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="All Users"
          value="0"
          subtitle="Registered users"
          icon={Users}
          onClick={() => message('All users selected.')}
        />

        <MetricCard
          title="Active"
          value="0"
          subtitle="Currently active"
          icon={UserCheck}
          onClick={() => message('Active users selected.')}
        />

        <MetricCard
          title="Suspended"
          value="0"
          subtitle="Currently suspended"
          icon={UserX}
          onClick={() => message('Suspended users selected.')}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Users Management</h2>

            <p className="mt-1 text-xs text-slate-500">
              Search and manage customer accounts.
            </p>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="mt-5">
          <EmptyState
            icon={Users}
            title="No user records loaded"
            description={
              search
                ? `No connected user records match "${search}".`
                : 'User records will appear here when connected to the application data source.'
            }
            action={
              <ActionButton
                onClick={() => message('User data refresh requested.')}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Refresh Users
              </ActionButton>
            }
          />
        </div>
      </div>
    </div>
  );

  const renderWallet = () => (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Wallet Balance"
          value="₦0"
          subtitle="Platform wallet balance"
          icon={Wallet}
          onClick={() => message('Wallet balance selected.')}
        />

        <MetricCard
          title="Pending Funding"
          value="0"
          subtitle="Awaiting review"
          icon={ArrowDownToLine}
          onClick={() => open('funding')}
        />

        <MetricCard
          title="Manual Funding"
          value="₦0"
          subtitle="Recorded manual funding"
          icon={Database}
          onClick={() => open('funding')}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">
            Manual Funding Control
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            PalmPay account currently configured for manual wallet funding.
          </p>

          <div className="mt-5">
            <StatusRow label="Bank" value="PalmPay" />
            <StatusRow label="Account Number" value="9550627002" />
            <StatusRow
              label="Account Name"
              value="Abdurrahman Yahaya Ibrahim"
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ActionButton
              onClick={() => open('funding')}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Funding Accounts
            </ActionButton>

            <ActionButton
              onClick={() => open('transactions')}
              className="bg-slate-100 text-slate-800 hover:bg-slate-200"
            >
              <CreditCard className="h-4 w-4" />
              Transactions
            </ActionButton>
          </div>
        </div>

        <EmptyState
          icon={Wallet}
          title="Wallet records not connected"
          description="Wallet operations are structured here and ready to connect to live wallet and funding data."
          action={
            <ActionButton
              onClick={() => message('Wallet data refresh requested.')}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Refresh Wallet Data
            </ActionButton>
          }
        />
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">
              Transaction Control
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Search, filter and review platform transactions.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ActionButton
              onClick={() => message('Transaction filters opened.')}
              className="bg-slate-100 text-slate-800 hover:bg-slate-200"
            >
              Filters
            </ActionButton>

            <ActionButton
              onClick={() => message('Transaction export requested.')}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Export
            </ActionButton>
          </div>
        </div>

        <div className="mt-5">
          <EmptyState
            icon={CreditCard}
            title="No transaction records loaded"
            description="Transaction records will appear here when connected to the transaction data source."
            action={
              <ActionButton
                onClick={() =>
                  message('Transaction data refresh requested.')
                }
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Refresh Transactions
              </ActionButton>
            }
          />
        </div>
      </div>
    </div>
  );

  const renderRevenue = () => (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value="₦0"
          subtitle="Recorded revenue"
          icon={ArrowUpRight}
          onClick={() => message('Revenue overview selected.')}
        />

        <MetricCard
          title="Today"
          value="₦0"
          subtitle="Today revenue"
          icon={BarChart3}
          onClick={() => message('Today revenue selected.')}
        />

        <MetricCard
          title="This Month"
          value="₦0"
          subtitle="Monthly revenue"
          icon={BarChart3}
          onClick={() => message('Monthly revenue selected.')}
        />

        <MetricCard
          title="Transactions"
          value="0"
          subtitle="Revenue transactions"
          icon={CreditCard}
          onClick={() => open('transactions')}
        />
      </div>

      <EmptyState
        icon={BarChart3}
        title="Revenue analytics ready"
        description="The executive statistics area is ready to receive live transaction and revenue data."
        action={
          <ActionButton
            onClick={() => message('Revenue statistics refresh requested.')}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Refresh Statistics
          </ActionButton>
        }
      />
    </div>
  );

  const renderFunding = () => (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Funding Accounts</h2>

            <p className="mt-1 text-xs text-slate-500">
              Manage the accounts used for manual funding.
            </p>
          </div>

          <ActionButton
            onClick={() =>
              message('Add funding account workflow opened.')
            }
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Add Funding Account
          </ActionButton>
        </div>

        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Database className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                Primary Manual Funding Account
              </p>

              <h3 className="mt-1 font-bold text-slate-900">PalmPay</h3>

              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p>Account Number: 9550627002</p>
                <p>
                  Account Name: Abdurrahman Yahaya Ibrahim
                </p>
              </div>
            </div>

            <ActionButton
              onClick={() =>
                message('Funding account details opened.')
              }
              className="bg-white text-blue-700 shadow-sm hover:bg-blue-100"
            >
              Details
            </ActionButton>
          </div>
        </div>
      </div>

      <EmptyState
        icon={ArrowDownToLine}
        title="Funding activity"
        description="Funding account activity and approval records will appear here when connected."
        action={
          <ActionButton
            onClick={() => open('wallet')}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            Open Wallet Control
          </ActionButton>
        }
      />
    </div>
  );

  const renderAdmins = () => (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">
              Admin Management
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Manage administrative access below the Super Admin level.
            </p>
          </div>

          <ActionButton
            onClick={() => message('Add admin workflow opened.')}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Users className="h-4 w-4" />
            Add Admin
          </ActionButton>
        </div>

        <div className="mt-5">
          <EmptyState
            icon={ShieldCheck}
            title="No admin records loaded"
            description="Administrative accounts and permissions will appear here when connected to the admin data source."
            action={
              <ActionButton
                onClick={() => message('Admin data refresh requested.')}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Refresh Admins
              </ActionButton>
            }
          />
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Security Status"
          value="Protected"
          subtitle="Current system state"
          icon={ShieldCheck}
          onClick={() => message('Security status selected.')}
        />

        <MetricCard
          title="Activity Logs"
          value="0"
          subtitle="Recorded activity events"
          icon={Activity}
          onClick={() => message('Activity logs selected.')}
        />

        <MetricCard
          title="Alerts"
          value="0"
          subtitle="Security alerts"
          icon={Bell}
          onClick={() => open('notifications')}
        />
      </div>

      <EmptyState
        icon={Activity}
        title="Security activity is ready"
        description="Login events, administrative actions and security records will appear here when connected to activity logging."
        action={
          <ActionButton
            onClick={() => message('Full audit log requested.')}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            Open Full Audit Log
          </ActionButton>
        }
      />
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-900">
              Notifications & Alerts
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Monitor important platform notifications.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              message('Notifications marked as reviewed.')
            }
            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            Mark Reviewed
          </button>
        </div>

        <div className="mt-5">
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="Important system alerts and administrative notifications will appear here."
            action={
              <ActionButton
                onClick={() => message('Notifications refreshed.')}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Refresh Notifications
              </ActionButton>
            }
          />
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Settings className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              System Settings
            </h2>

            <p className="text-xs text-slate-500">
              High-level application configuration.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <StatusRow label="Platform" value="GY Data" />
          <StatusRow label="Office" value="Executive Office" />
          <StatusRow label="Environment" value="Production" />
          <StatusRow label="Access" value="Super Admin" />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ActionButton
            onClick={() => message('General settings opened.')}
            className="bg-slate-100 text-slate-800 hover:bg-slate-200"
          >
            General Settings
          </ActionButton>

          <ActionButton
            onClick={() => open('security')}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Security Settings
          </ActionButton>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">Danger Zone</h2>

        <p className="mt-1 text-xs text-slate-500">
          High-level actions requiring Super Admin control.
        </p>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={() =>
              message('System maintenance controls opened.')
            }
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-4 text-left hover:bg-slate-50"
          >
            <span>
              <span className="block text-sm font-bold text-slate-800">
                Maintenance Controls
              </span>

              <span className="mt-1 block text-xs text-slate-500">
                Manage system maintenance settings.
              </span>
            </span>

            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => message('System backup controls opened.')}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-4 text-left hover:bg-slate-50"
          >
            <span>
              <span className="block text-sm font-bold text-slate-800">
                Backup Controls
              </span>

              <span className="mt-1 block text-xs text-slate-500">
                Review system backup operations.
              </span>
            </span>

            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (section) {
      case 'users':
        return renderUsers();
      case 'wallet':
        return renderWallet();
      case 'transactions':
        return renderTransactions();
      case 'revenue':
        return renderRevenue();
      case 'funding':
        return renderFunding();
      case 'admins':
        return renderAdmins();
      case 'security':
        return renderSecurity();
      case 'notifications':
        return renderNotifications();
      case 'settings':
        return renderSettings();
      case 'overview':
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-slate-800">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-[#04102f] text-white shadow-2xl transition-transform duration-300 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
                  GY Data
                </p>

                <h1 className="text-lg font-bold">
                  Executive Office
                </h1>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 lg:hidden"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
              Control Center
            </p>

            <div className="space-y-1">
              {sections.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => open(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                      active
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30'
                        : 'text-white/65 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />

                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>

                    {active && (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-white/10 p-3">
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[280px]">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-[76px] items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                Super Admin
              </p>

              <h2 className="truncate text-lg font-black text-slate-900">
                {titles[section]}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => open('notifications')}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => open('settings')}
              className="hidden h-10 items-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 sm:flex"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] p-4 sm:p-6">
          <div className="mb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400">
                  GY Data Executive Control Center
                </p>

                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  {titles[section]}
                </h1>

                <p className="mt-1 text-xs text-slate-400">
                  {descriptions[section]}
                </p>
              </div>

              {section !== 'overview' && (
                <ActionButton
                  onClick={() => open('overview')}
                  className="bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Back to Overview
                </ActionButton>
              )}
            </div>
          </div>

          <motion.div
            key={section}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderSection()}
          </motion.div>
        </main>
      </div>

      {notice && (
        <div className="fixed bottom-5 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
          <div className="rounded-2xl bg-[#04102f] px-5 py-4 text-sm font-semibold text-white shadow-2xl">
            {notice}
          </div>
        </div>
      )}
    </div>
  );
}
