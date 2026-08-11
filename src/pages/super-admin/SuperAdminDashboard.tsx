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

type NavItem = {
  id: Section;
  label: string;
  icon: typeof Users;
};

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users Management', icon: Users },
  { id: 'wallet', label: 'Wallet / Funding', icon: Wallet },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
  { id: 'revenue', label: 'Revenue / Statistics', icon: ArrowUpRight },
  { id: 'funding', label: 'Funding Accounts', icon: Database },
  { id: 'admins', label: 'Admin Management', icon: ShieldCheck },
  { id: 'security', label: 'Security / Logs', icon: Activity },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'System Settings', icon: Settings },
];

const sectionInfo: Record<
  Section,
  { title: string; description: string }
> = {
  overview: {
    title: 'Executive Overview',
    description: 'High-level control center for GY Data.',
  },
  users: {
    title: 'Users Management',
    description: 'Manage, search and control user accounts.',
  },
  wallet: {
    title: 'Wallet & Funding',
    description: 'Monitor wallet balances and manual funding.',
  },
  transactions: {
    title: 'Transactions',
    description: 'Review platform transaction activity.',
  },
  revenue: {
    title: 'Revenue & Statistics',
    description: 'Monitor platform performance and revenue.',
  },
  funding: {
    title: 'Funding Accounts',
    description: 'Manage manual funding accounts.',
  },
  admins: {
    title: 'Admin Management',
    description: 'Manage administrative access.',
  },
  security: {
    title: 'Security & Activity Logs',
    description: 'Review security and administrative activity.',
  },
  notifications: {
    title: 'Notifications',
    description: 'Monitor important platform alerts.',
  },
  settings: {
    title: 'System Settings',
    description: 'Manage high-level system configuration.',
  },
};

function ActionButton({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}

function SmallCard({
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
      className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {title}
          </p>

          <p className="mt-1 text-xl font-black text-slate-900">
            {value}
          </p>

          <p className="mt-0.5 truncate text-[10px] text-slate-500">
            {subtitle}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </button>
  );
}

function MiniAction({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof Users;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-0.5 truncate text-[10px] text-slate-500">
          {description}
        </p>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
    </button>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  text,
  onClick,
  buttonText = 'Refresh',
}: {
  icon: typeof Database;
  title: string;
  text: string;
  onClick: () => void;
  buttonText?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-3 text-sm font-bold text-slate-900">
        {title}
      </h3>

      <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-slate-500">
        {text}
      </p>

      <ActionButton
        onClick={onClick}
        className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
      >
        {buttonText}
      </ActionButton>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const [section, setSection] = useState<Section>('overview');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');

  const goTo = (next: Section) => {
    setSection(next);
    setMobileMenu(false);
    setSearch('');
  };

  const showNotice = (text: string) => {
    setNotice(text);

    window.setTimeout(() => {
      setNotice('');
    }, 2500);
  };

  const logout = () => {
    localStorage.removeItem('gydata_super_admin');
    localStorage.removeItem('gydata_super_admin_session');
    navigate('/super-admin-login', { replace: true });
  };

  const renderOverview = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SmallCard
          title="Users"
          value="0"
          subtitle="Registered users"
          icon={Users}
          onClick={() => goTo('users')}
        />

        <SmallCard
          title="Wallet"
          value="₦0"
          subtitle="Platform balance"
          icon={Wallet}
          onClick={() => goTo('wallet')}
        />

        <SmallCard
          title="Transactions"
          value="0"
          subtitle="Recorded transactions"
          icon={CreditCard}
          onClick={() => goTo('transactions')}
        />

        <SmallCard
          title="Revenue"
          value="₦0"
          subtitle="Recorded revenue"
          icon={BarChart3}
          onClick={() => goTo('revenue')}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Quick Control Center
              </h2>

              <p className="mt-1 text-[10px] text-slate-500">
                Direct access to executive operations.
              </p>
            </div>

            <ShieldCheck className="h-5 w-5 text-blue-600" />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <MiniAction
              icon={Users}
              title="Users Management"
              description="Search and manage users"
              onClick={() => goTo('users')}
            />

            <MiniAction
              icon={Wallet}
              title="Wallet & Funding"
              description="Manual wallet operations"
              onClick={() => goTo('wallet')}
            />

            <MiniAction
              icon={CreditCard}
              title="Transactions"
              description="Review transactions"
              onClick={() => goTo('transactions')}
            />

            <MiniAction
              icon={BarChart3}
              title="Revenue Statistics"
              description="View performance"
              onClick={() => goTo('revenue')}
            />

            <MiniAction
              icon={Database}
              title="Funding Accounts"
              description="Manage funding accounts"
              onClick={() => goTo('funding')}
            />

            <MiniAction
              icon={ShieldCheck}
              title="Admin Management"
              description="Control admin access"
              onClick={() => goTo('admins')}
            />

            <MiniAction
              icon={Activity}
              title="Security Logs"
              description="Review activity"
              onClick={() => goTo('security')}
            />

            <MiniAction
              icon={Bell}
              title="Notifications"
              description="View system alerts"
              onClick={() => goTo('notifications')}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Executive Office
              </p>

              <h2 className="text-sm font-black text-slate-900">
                System Status
              </h2>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between border-b border-slate-100 py-2 text-xs">
              <span className="text-slate-500">Access</span>
              <span className="font-bold text-slate-800">
                Super Admin
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 py-2 text-xs">
              <span className="text-slate-500">System</span>
              <span className="font-bold text-emerald-600">
                Online
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 py-2 text-xs">
              <span className="text-slate-500">Security</span>
              <span className="font-bold text-blue-600">
                Protected
              </span>
            </div>
          </div>

          <ActionButton
            onClick={() => goTo('security')}
            className="mt-4 w-full bg-slate-900 text-white hover:bg-slate-800"
          >
            <Activity className="h-3.5 w-3.5" />
            Security Center
          </ActionButton>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Recent Activity
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Latest system activity will appear here.
            </p>
          </div>

          <ActionButton
            onClick={() => goTo('security')}
            className="bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            View Logs
            <ChevronRight className="h-3.5 w-3.5" />
          </ActionButton>
        </div>

        <div className="mt-4 rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-500">
          No activity records loaded yet.
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <SmallCard
          title="All Users"
          value="0"
          subtitle="Registered"
          icon={Users}
          onClick={() => showNotice('All users selected')}
        />

        <SmallCard
          title="Active"
          value="0"
          subtitle="Active accounts"
          icon={UserCheck}
          onClick={() => showNotice('Active users selected')}
        />

        <SmallCard
          title="Suspended"
          value="0"
          subtitle="Suspended accounts"
          icon={UserX}
          onClick={() => showNotice('Suspended users selected')}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              User Directory
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Search, suspend or activate customer accounts.
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <div className="mt-4">
          <EmptyPanel
            icon={Users}
            title="No user records loaded"
            text={
              search
                ? `No connected records match "${search}".`
                : 'Connect the user data source to display customer accounts here.'
            }
            onClick={() => showNotice('User data refresh requested')}
          />
        </div>
      </div>
    </div>
  );

  const renderWallet = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <SmallCard
          title="Balance"
          value="₦0"
          subtitle="Platform wallet"
          icon={Wallet}
          onClick={() => showNotice('Wallet balance selected')}
        />

        <SmallCard
          title="Pending"
          value="0"
          subtitle="Funding reviews"
          icon={ArrowDownToLine}
          onClick={() => goTo('funding')}
        />

        <SmallCard
          title="Funding"
          value="₦0"
          subtitle="Manual funding"
          icon={Database}
          onClick={() => goTo('funding')}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-black text-slate-900">
            Manual Funding Account
          </h2>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-xs">
              <span className="text-slate-500">Bank</span>
              <span className="font-bold">PalmPay</span>
            </div>

            <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-xs">
              <span className="text-slate-500">Account Number</span>
              <span className="font-bold">9550627002</span>
            </div>

            <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-xs">
              <span className="text-slate-500">Account Name</span>
              <span className="text-right font-bold">
                Abdurrahman Yahaya Ibrahim
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton
              onClick={() => goTo('funding')}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Funding Accounts
            </ActionButton>

            <ActionButton
              onClick={() => goTo('transactions')}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Transactions
            </ActionButton>
          </div>
        </div>

        <EmptyPanel
          icon={Wallet}
          title="Wallet records not connected"
          text="Wallet operations are ready for connection to live wallet data."
          onClick={() => showNotice('Wallet refresh requested')}
        />
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Transaction Control
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Search and filter platform transactions.
            </p>
          </div>

          <div className="flex gap-2">
            <ActionButton
              onClick={() => showNotice('Transaction filters opened')}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Filters
            </ActionButton>

            <ActionButton
              onClick={() => showNotice('Transaction export requested')}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Export
            </ActionButton>
          </div>
        </div>

        <div className="mt-4">
          <EmptyPanel
            icon={CreditCard}
            title="No transactions loaded"
            text="Transaction records will appear here when connected to the transaction source."
            onClick={() => showNotice('Transaction refresh requested')}
          />
        </div>
      </div>
    </div>
  );

  const renderRevenue = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SmallCard
          title="Revenue"
          value="₦0"
          subtitle="Total recorded"
          icon={ArrowUpRight}
          onClick={() => showNotice('Revenue selected')}
        />

        <SmallCard
          title="Today"
          value="₦0"
          subtitle="Today revenue"
          icon={BarChart3}
          onClick={() => showNotice('Today selected')}
        />

        <SmallCard
          title="Monthly"
          value="₦0"
          subtitle="Monthly revenue"
          icon={BarChart3}
          onClick={() => showNotice('Monthly selected')}
        />

        <SmallCard
          title="Transactions"
          value="0"
          subtitle="Revenue records"
          icon={CreditCard}
          onClick={() => goTo('transactions')}
        />
      </div>

      <EmptyPanel
        icon={BarChart3}
        title="Statistics ready"
        text="Revenue analytics will populate when connected to transaction data."
        onClick={() => showNotice('Statistics refresh requested')}
      />
    </div>
  );

  const renderFunding = () => (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Funding Accounts
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Accounts used for manual wallet funding.
            </p>
          </div>

          <ActionButton
            onClick={() => showNotice('Add funding account opened')}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Add Account
          </ActionButton>
        </div>

        <button
          type="button"
          onClick={() => showNotice('PalmPay account details opened')}
          className="mt-4 flex w-full items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-left transition hover:bg-blue-100"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Database className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
              Primary Account
            </p>

            <p className="mt-1 text-sm font-black text-slate-900">
              PalmPay
            </p>

            <p className="mt-1 text-[10px] text-slate-600">
              9550627002 · Abdurrahman Yahaya Ibrahim
            </p>
          </div>

          <ChevronRight className="h-4 w-4 text-blue-500" />
        </button>
      </div>

      <EmptyPanel
        icon={ArrowDownToLine}
        title="Funding activity"
        text="Funding activity and approval records will appear here."
        onClick={() => goTo('wallet')}
        buttonText="Open Wallet"
      />
    </div>
  );

  const renderAdmins = () => (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Admin Management
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Manage lower-level administrative access.
            </p>
          </div>

          <ActionButton
            onClick={() => showNotice('Add admin workflow opened')}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Add Admin
          </ActionButton>
        </div>

        <div className="mt-4">
          <EmptyPanel
            icon={ShieldCheck}
            title="No admin records loaded"
            text="Admin accounts and permissions will appear when connected to the admin data source."
            onClick={() => showNotice('Admin refresh requested')}
          />
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <SmallCard
          title="Security"
          value="OK"
          subtitle="Protected"
          icon={ShieldCheck}
          onClick={() => showNotice('Security status selected')}
        />

        <SmallCard
          title="Logs"
          value="0"
          subtitle="Activity events"
          icon={Activity}
          onClick={() => showNotice('Activity logs selected')}
        />

        <SmallCard
          title="Alerts"
          value="0"
          subtitle="Security alerts"
          icon={Bell}
          onClick={() => goTo('notifications')}
        />
      </div>

      <EmptyPanel
        icon={Activity}
        title="Security logs ready"
        text="Login events, admin actions and security records will appear here."
        onClick={() => showNotice('Audit log refresh requested')}
        buttonText="Refresh Logs"
      />
    </div>
  );

  const renderNotifications = () => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-slate-900">
            Notifications & Alerts
          </h2>

          <p className="mt-1 text-[10px] text-slate-500">
            Important system alerts will appear here.
          </p>
        </div>

        <ActionButton
          onClick={() => showNotice('Notifications marked as reviewed')}
          className="bg-slate-100 text-slate-700 hover:bg-slate-200"
        >
          Mark Reviewed
        </ActionButton>
      </div>

      <div className="mt-4">
        <EmptyPanel
          icon={Bell}
          title="No notifications"
          text="There are currently no loaded system notifications."
          onClick={() => showNotice('Notifications refreshed')}
        />
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Settings className="h-4 w-4" />
          </div>

          <div>
            <h2 className="text-sm font-black text-slate-900">
              System Settings
            </h2>

            <p className="text-[10px] text-slate-500">
              High-level configuration.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-xs">
          <div className="flex justify-between border-b border-slate-100 py-2">
            <span className="text-slate-500">Platform</span>
            <b>GY Data</b>
          </div>

          <div className="flex justify-between border-b border-slate-100 py-2">
            <span className="text-slate-500">Environment</span>
            <b>Production</b>
          </div>

          <div className="flex justify-between border-b border-slate-100 py-2">
            <span className="text-slate-500">Access</span>
            <b>Super Admin</b>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <ActionButton
            onClick={() => showNotice('General settings opened')}
            className="bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            General
          </ActionButton>

          <ActionButton
            onClick={() => goTo('security')}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Security
          </ActionButton>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-black text-slate-900">
          Executive Controls
        </h2>

        <p className="mt-1 text-[10px] text-slate-500">
          High-level system actions.
        </p>

        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={() => showNotice('Maintenance controls opened')}
            className="flex w-full items-center justify-between rounded-lg border border-slate-100 p-3 text-left hover:bg-slate-50"
          >
            <span className="text-xs font-bold">
              Maintenance Controls
            </span>

            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => showNotice('Backup controls opened')}
            className="flex w-full items-center justify-between rounded-lg border border-slate-100 p-3 text-left hover:bg-slate-50"
          >
            <span className="text-xs font-bold">
              Backup Controls
            </span>

            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
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
    <div className="min-h-screen bg-[#f5f7fb] text-slate-800">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[250px] bg-[#061337] text-white shadow-2xl transition-transform ${
          mobileMenu ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-300">
                  GY DATA
                </p>

                <h1 className="text-sm font-black">
                  Executive Office
                </h1>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenu(false)}
                className="ml-auto rounded-lg bg-white/10 p-2 lg:hidden"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5">
            <p className="px-2.5 pb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
              Control Center
            </p>

            <div className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(item.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-xs font-semibold transition ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />

                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>

                    {active && (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-white/10 p-2.5">
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-xs font-bold text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[250px]">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-[68px] items-center gap-3 px-4 sm:px-5">
            <button
              type="button"
              onClick={() => setMobileMenu(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-600">
                Super Admin
              </p>

              <h2 className="truncate text-base font-black text-slate-900">
                {sectionInfo[section].title}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => goTo('notifications')}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => goTo('settings')}
              className="hidden h-9 items-center gap-2 rounded-lg bg-slate-100 px-3 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 sm:flex"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1450px] p-4 sm:p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold text-slate-400">
                GY Data Executive Control Center
              </p>

              <h1 className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                {sectionInfo[section].title}
              </h1>

              <p className="mt-1 text-[10px] text-slate-400">
                {sectionInfo[section].description}
              </p>
            </div>

            {section !== 'overview' && (
              <ActionButton
                onClick={() => goTo('overview')}
                className="bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Overview
              </ActionButton>
            )}
          </div>

          {renderContent()}
        </main>
      </div>

      {notice && (
        <div className="fixed bottom-5 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2">
          <div className="rounded-xl bg-[#061337] px-4 py-3 text-xs font-semibold text-white shadow-2xl">
            {notice}
          </div>
        </div>
      )}
    </div>
  );
}
