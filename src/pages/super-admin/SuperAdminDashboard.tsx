import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  Database,
  LogOut,
  Menu,
  RefreshCw,
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

type FundingRequest = {
  id: string;
  phone: string;
  amount: number | string;
  status: string;
  payment_method?: string | null;
  payment_reference?: string | null;
  notes?: string | null;
  admin_notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  approved_at?: string | null;
};

type FundingResponse = {
  success?: boolean;
  data?: FundingRequest[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
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

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function ActionButton({
  children,
  onClick,
  className = '',
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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

  const [fundingRequests, setFundingRequests] = useState<
    FundingRequest[]
  >([]);

  const [fundingLoading, setFundingLoading] = useState(false);

  const [fundingActionId, setFundingActionId] = useState<
    string | null
  >(null);

  const [fundingError, setFundingError] = useState('');

  const [fundingLoaded, setFundingLoaded] = useState(false);

  const goTo = (next: Section) => {
    setSection(next);
    setMobileMenu(false);
    setSearch('');
  };

  const showNotice = (text: string) => {
    setNotice(text);

    window.setTimeout(() => {
      setNotice('');
    }, 3000);
  };

  const logout = () => {
    localStorage.removeItem('gydata_super_admin');
    localStorage.removeItem('gydata_super_admin_session');
    navigate('/super-admin-login', { replace: true });
  };

  const loadFundingRequests = useCallback(async () => {
    setFundingLoading(true);
    setFundingError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/funding/requests?status=pending&limit=100`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      const result: FundingResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Failed to load funding requests.'
        );
      }

      setFundingRequests(
        Array.isArray(result.data) ? result.data : []
      );

      setFundingLoaded(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load funding requests.';

      setFundingError(message);
      setFundingRequests([]);
    } finally {
      setFundingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (section === 'funding' || section === 'wallet') {
      void loadFundingRequests();
    }
  }, [section, loadFundingRequests]);

  const processFundingRequest = async (
    requestId: string,
    action: 'approve' | 'reject'
  ) => {
    if (fundingActionId) {
      return;
    }

    const request = fundingRequests.find(
      (item) => item.id === requestId
    );

    if (!request) {
      showNotice('Funding request is no longer available.');
      return;
    }

    const actionLabel =
      action === 'approve' ? 'approve' : 'reject';

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} this funding request?\n\n` +
        `Phone: ${request.phone}\n` +
        `Amount: ${formatCurrency(request.amount)}`
    );

    if (!confirmed) {
      return;
    }

    setFundingActionId(requestId);
    setFundingError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/funding/${action}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            requestId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `Failed to ${actionLabel} funding request.`
        );
      }

      showNotice(
        action === 'approve'
          ? 'Funding approved and wallet credited successfully.'
          : 'Funding request rejected successfully.'
      );

      await loadFundingRequests();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Failed to ${actionLabel} funding request.`;

      setFundingError(message);
      showNotice(message);
    } finally {
      setFundingActionId(null);
    }
  };

  const pendingAmount = fundingRequests.reduce(
    (total, request) => total + Number(request.amount || 0),
    0
  );

  const filteredFundingRequests = fundingRequests.filter(
    (request) => {
      const query = search.trim().toLowerCase();

      if (!query) {
        return true;
      }

      return [
        request.phone,
        request.payment_reference,
        request.payment_method,
        request.notes,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        );
    }
  );

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

            <div className="flex justify-between py-2 text-xs">
              <span className="text-slate-500">
                Pending Funding
              </span>
              <span className="font-bold text-amber-600">
                {fundingRequests.length}
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
          onClick={() => showNotice('User management is next.')}
        />

        <SmallCard
          title="Active"
          value="0"
          subtitle="Active accounts"
          icon={UserCheck}
          onClick={() => showNotice('User management is next.')}
        />

        <SmallCard
          title="Suspended"
          value="0"
          subtitle="Suspended accounts"
          icon={UserX}
          onClick={() => showNotice('User management is next.')}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              User Directory
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              User management will be connected in the next
              isolated fix.
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
            title="User management is next"
            text="This section has intentionally not been changed while we connect manual funding safely."
            onClick={() =>
              showNotice(
                'User management will be connected next.'
              )
            }
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
          onClick={() =>
            showNotice(
              'Customer wallet data will be connected next.'
            )
          }
        />

        <SmallCard
          title="Pending"
          value={String(fundingRequests.length)}
          subtitle="Funding reviews"
          icon={ArrowDownToLine}
          onClick={() => goTo('funding')}
        />

        <SmallCard
          title="Pending Value"
          value={formatCurrency(pendingAmount)}
          subtitle="Awaiting approval"
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
              <span className="text-slate-500">
                Account Number
              </span>
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
              Funding Requests
            </ActionButton>

            <ActionButton
              onClick={() => void loadFundingRequests()}
              disabled={fundingLoading}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  fundingLoading ? 'animate-spin' : ''
                }`}
              />
              Refresh
            </ActionButton>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-black text-slate-900">
            Pending Manual Funding
          </h2>

          <p className="mt-1 text-[10px] text-slate-500">
            Requests waiting for Super Admin review.
          </p>

          <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50 p-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                Requests
              </p>

              <p className="mt-1 text-2xl font-black text-slate-900">
                {fundingRequests.length}
              </p>
            </div>

            <ArrowDownToLine className="h-6 w-6 text-blue-600" />
          </div>

          <ActionButton
            onClick={() => goTo('funding')}
            className="mt-4 w-full bg-[#061337] text-white hover:bg-[#0b1d4d]"
          >
            Review Funding Requests
            <ChevronRight className="h-3.5 w-3.5" />
          </ActionButton>
        </div>
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
              Transaction management will be connected next.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <EmptyPanel
            icon={CreditCard}
            title="Transaction management is next"
            text="This section has intentionally not been changed while manual funding is being connected."
            onClick={() =>
              showNotice(
                'Transaction management will be connected next.'
              )
            }
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
          onClick={() =>
            showNotice('Revenue analytics will be connected next.')
          }
        />

        <SmallCard
          title="Today"
          value="₦0"
          subtitle="Today revenue"
          icon={BarChart3}
          onClick={() =>
            showNotice('Revenue analytics will be connected next.')
          }
        />

        <SmallCard
          title="Monthly"
          value="₦0"
          subtitle="Monthly revenue"
          icon={BarChart3}
          onClick={() =>
            showNotice('Revenue analytics will be connected next.')
          }
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
        title="Revenue analytics is next"
        text="Revenue statistics will be connected after the funding workflow is verified."
        onClick={() =>
          showNotice('Revenue analytics will be connected next.')
        }
      />
    </div>
  );

  const renderFunding = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SmallCard
          title="Pending Requests"
          value={String(fundingRequests.length)}
          subtitle="Awaiting review"
          icon={ArrowDownToLine}
          onClick={() => void loadFundingRequests()}
        />

        <SmallCard
          title="Pending Amount"
          value={formatCurrency(pendingAmount)}
          subtitle="Total awaiting approval"
          icon={Wallet}
          onClick={() => void loadFundingRequests()}
        />

        <SmallCard
          title="Status"
          value={fundingLoading ? 'Loading' : 'Live'}
          subtitle="Funding API"
          icon={Activity}
          onClick={() => void loadFundingRequests()}
        />

        <SmallCard
          title="Manual"
          value="ON"
          subtitle="Manual funding"
          icon={Database}
          onClick={() =>
            showNotice('Manual funding is enabled.')
          }
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Pending Funding Requests
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Review customer payment references before approving
              wallet credit.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search phone/reference..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-blue-400 sm:w-[230px]"
              />
            </div>

            <ActionButton
              onClick={() => void loadFundingRequests()}
              disabled={fundingLoading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  fundingLoading ? 'animate-spin' : ''
                }`}
              />
              Refresh
            </ActionButton>
          </div>
        </div>

        {fundingError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {fundingError}
          </div>
        )}

        {!fundingLoading &&
          fundingLoaded &&
          filteredFundingRequests.length === 0 && (
            <div className="mt-4">
              <EmptyPanel
                icon={Check}
                title={
                  search
                    ? 'No matching funding requests'
                    : 'No pending funding requests'
                }
                text={
                  search
                    ? `Nothing matches "${search}".`
                    : 'There are currently no pending manual funding requests.'
                }
                onClick={() => void loadFundingRequests()}
                buttonText="Refresh"
              />
            </div>
          )}

        {fundingLoading && (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-8 text-center">
            <RefreshCw className="mx-auto h-5 w-5 animate-spin text-blue-600" />

            <p className="mt-3 text-xs font-semibold text-slate-500">
              Loading pending funding requests...
            </p>
          </div>
        )}

        {!fundingLoading &&
          filteredFundingRequests.length > 0 && (
            <div className="mt-4 space-y-3">
              {filteredFundingRequests.map((request) => {
                const busy =
                  fundingActionId === request.id;

                return (
                  <div
                    key={request.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                            PENDING
                          </span>

                          <span className="text-[10px] text-slate-400">
                            {formatDate(request.created_at)}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                              Customer
                            </p>

                            <p className="mt-1 text-xs font-black text-slate-900">
                              {request.phone}
                            </p>
                          </div>

                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                              Amount
                            </p>

                            <p className="mt-1 text-sm font-black text-blue-700">
                              {formatCurrency(request.amount)}
                            </p>
                          </div>

                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                              Payment Method
                            </p>

                            <p className="mt-1 text-xs font-bold text-slate-800">
                              {request.payment_method ||
                                'Manual'}
                            </p>
                          </div>

                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                              Payment Reference
                            </p>

                            <p className="mt-1 break-all text-xs font-bold text-slate-800">
                              {request.payment_reference ||
                                '—'}
                            </p>
                          </div>
                        </div>

                        {request.notes && (
                          <div className="mt-3 rounded-lg bg-slate-50 p-3">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                              Customer Note
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-600">
                              {request.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
                        <ActionButton
                          onClick={() =>
                            void processFundingRequest(
                              request.id,
                              'approve'
                            )
                          }
                          disabled={busy}
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          {busy ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Approve
                        </ActionButton>

                        <ActionButton
                          onClick={() =>
                            void processFundingRequest(
                              request.id,
                              'reject'
                            )
                          }
                          disabled={busy}
                          className="bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </ActionButton>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

          <div>
            <h3 className="text-xs font-black text-slate-900">
              Funding safety
            </h3>

            <p className="mt-1 text-[10px] leading-5 text-slate-600">
              Approval is processed by the backend RPC. The
              database checks that the request is still pending
              before crediting the wallet, creating the
              transaction and marking the request approved.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-black text-slate-900">
          Funding Account
        </h2>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-xs">
            <span className="text-slate-500">Bank</span>
            <span className="font-bold">PalmPay</span>
          </div>

          <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-xs">
            <span className="text-slate-500">
              Account Number
            </span>
            <span className="font-bold">9550627002</span>
          </div>

          <div className="flex justify-between gap-4 py-2 text-xs">
            <span className="text-slate-500">Account Name</span>
            <span className="text-right font-bold">
              Abdurrahman Yahaya Ibrahim
            </span>
          </div>
        </div>
      </div>
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
              Admin management will be connected in the next
              isolated fix.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <EmptyPanel
            icon={ShieldCheck}
            title="Admin management is next"
            text="This section has intentionally not been changed while manual funding is being verified."
            onClick={() =>
              showNotice(
                'Admin management will be connected next.'
              )
            }
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
        title="Security logs are next"
        text="Security and audit records will be connected after the core funding workflow is verified."
        onClick={() =>
          showNotice('Security logs will be connected next.')
        }
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
            Notification management will be connected later.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <EmptyPanel
          icon={Bell}
          title="Notifications are next"
          text="This section has intentionally not been changed while manual funding is being verified."
          onClick={() =>
            showNotice(
              'Notifications will be connected next.'
            )
          }
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
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <h2 className="text-sm font-black text-slate-900">
          Executive Controls
        </h2>

        <p className="mt-1 text-[10px] leading-5 text-slate-600">
          System-wide controls will be connected after the
          funding workflow is verified.
        </p>
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
          mobileMenu
            ? 'translate-x-0'
            : '-translate-x-full'
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
