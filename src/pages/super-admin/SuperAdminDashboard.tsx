import {
  useCallback,
  useEffect,
  useMemo,
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
import { supabase } from '../../lib/supabase';

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

type Profile = {
  id: string;
  phone: string;
  full_name: string;
  email?: string | null;
  wallet_balance?: number | string | null;
  kyc_status?: string | null;
  is_admin?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type Transaction = {
  id: string;
  phone: string;
  type: string;
  service: string;
  product?: string | null;
  amount: number | string;
  status: string;
  recipient?: string | null;
  network?: string | null;
  reference?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
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

type Notification = {
  id: string;
  phone: string;
  title: string;
  message: string;
  type?: string | null;
  is_read?: boolean | null;
  created_at?: string | null;
};

type Product = {
  id: string;
  service: string;
  name: string;
  price: number | string;
  network?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

type NoticeType = 'success' | 'error' | 'info';

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

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function statusClass(status?: string | null) {
  const value = String(status || '').toLowerCase();

  if (
    value === 'success' ||
    value === 'successful' ||
    value === 'completed' ||
    value === 'approved' ||
    value === 'active'
  ) {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (
    value === 'pending' ||
    value === 'processing' ||
    value === 'unverified'
  ) {
    return 'bg-amber-50 text-amber-700';
  }

  if (
    value === 'failed' ||
    value === 'rejected' ||
    value === 'cancelled'
  ) {
    return 'bg-red-50 text-red-700';
  }

  return 'bg-slate-100 text-slate-600';
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
  const [noticeType, setNoticeType] = useState<NoticeType>('info');

  const [users, setUsers] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fundingRequests, setFundingRequests] = useState<
    FundingRequest[]
  >([]);
  const [notifications, setNotifications] = useState<Notification[]>(
    []
  );
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(false);
  const [fundingLoading, setFundingLoading] = useState(false);
  const [fundingActionId, setFundingActionId] = useState<string | null>(
    null
  );

  const [dataError, setDataError] = useState('');
  const [fundingError, setFundingError] = useState('');

  const [selectedUser, setSelectedUser] = useState<Profile | null>(
    null
  );

  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationTarget, setNotificationTarget] = useState('ALL');

  const [notificationSending, setNotificationSending] = useState(false);

  const [adminActionId, setAdminActionId] = useState<string | null>(
    null
  );

  const [systemEnabled, setSystemEnabled] = useState(() => {
    return localStorage.getItem('gydata_system_enabled') !== 'false';
  });

  const [maintenanceMode, setMaintenanceMode] = useState(() => {
    return localStorage.getItem('gydata_maintenance_mode') === 'true';
  });

  const [autoRefresh, setAutoRefresh] = useState(() => {
    return localStorage.getItem('gydata_admin_auto_refresh') !== 'false';
  });

  const showNotice = useCallback(
    (text: string, type: NoticeType = 'info') => {
      setNotice(text);
      setNoticeType(type);

      window.setTimeout(() => {
        setNotice('');
      }, 3500);
    },
    []
  );

  const goTo = (next: Section) => {
    setSection(next);
    setMobileMenu(false);
    setSearch('');
  };

  const logout = () => {
    localStorage.removeItem('gydata_super_admin');
    localStorage.removeItem('gydata_super_admin_session');
    navigate('/super-admin-login', { replace: true });
  };

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setDataError('');

    try {
      const [
        profilesResult,
        transactionsResult,
        notificationsResult,
        productsResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'id,phone,full_name,email,wallet_balance,kyc_status,is_admin,created_at,updated_at'
          )
          .order('created_at', { ascending: false })
          .limit(1000),

        supabase
          .from('transactions')
          .select(
            'id,phone,type,service,product,amount,status,recipient,network,reference,metadata,created_at'
          )
          .order('created_at', { ascending: false })
          .limit(1000),

        supabase
          .from('notifications')
          .select(
            'id,phone,title,message,type,is_read,created_at'
          )
          .order('created_at', { ascending: false })
          .limit(300),

        supabase
          .from('products')
          .select(
            'id,service,name,price,network,is_active,created_at'
          )
          .order('created_at', { ascending: false })
          .limit(1000),
      ]);

      if (profilesResult.error) {
        throw new Error(profilesResult.error.message);
      }

      if (transactionsResult.error) {
        throw new Error(transactionsResult.error.message);
      }

      if (notificationsResult.error) {
        throw new Error(notificationsResult.error.message);
      }

      if (productsResult.error) {
        throw new Error(productsResult.error.message);
      }

      setUsers((profilesResult.data || []) as Profile[]);
      setTransactions(
        (transactionsResult.data || []) as Transaction[]
      );
      setNotifications(
        (notificationsResult.data || []) as Notification[]
      );
      setProducts((productsResult.data || []) as Product[]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load dashboard data.';

      setDataError(message);
      showNotice(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotice]);

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

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Failed to load funding requests.'
        );
      }

      setFundingRequests(
        Array.isArray(result.data) ? result.data : []
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load funding requests.';

      setFundingError(message);
    } finally {
      setFundingLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadDashboardData(),
      loadFundingRequests(),
    ]);
  }, [loadDashboardData, loadFundingRequests]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!autoRefresh) return;

    const timer = window.setInterval(() => {
      void refreshAll();
    }, 30000);

    return () => window.clearInterval(timer);
  }, [autoRefresh, refreshAll]);

  const pendingAmount = useMemo(
    () =>
      fundingRequests.reduce(
        (total, request) => total + Number(request.amount || 0),
        0
      ),
    [fundingRequests]
  );

  const totalWallet = useMemo(
    () =>
      users.reduce(
        (total, user) => total + Number(user.wallet_balance || 0),
        0
      ),
    [users]
  );

  const successfulTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        const status = String(transaction.status).toLowerCase();

        return [
          'success',
          'successful',
          'completed',
          'approved',
        ].includes(status);
      }),
    [transactions]
  );

  const totalSuccessfulAmount = useMemo(
    () =>
      successfulTransactions.reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0
      ),
    [successfulTransactions]
  );

  const todayRevenue = useMemo(() => {
    const now = new Date();

    return successfulTransactions
      .filter((transaction) => {
        if (!transaction.created_at) return false;

        const date = new Date(transaction.created_at);

        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth() &&
          date.getDate() === now.getDate()
        );
      })
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0
      );
  }, [successfulTransactions]);

  const monthlyRevenue = useMemo(() => {
    const now = new Date();

    return successfulTransactions
      .filter((transaction) => {
        if (!transaction.created_at) return false;

        const date = new Date(transaction.created_at);

        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth()
        );
      })
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0
      );
  }, [successfulTransactions]);

  const activeUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          String(user.kyc_status || '').toLowerCase() !== 'suspended'
      ).length,
    [users]
  );

  const suspendedUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          String(user.kyc_status || '').toLowerCase() === 'suspended'
      ).length,
    [users]
  );

  const adminUsers = useMemo(
    () => users.filter((user) => Boolean(user.is_admin)),
    [users]
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications]
  );

  const activeProducts = useMemo(
    () => products.filter((product) => product.is_active !== false).length,
    [products]
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) =>
      [
        user.full_name,
        user.phone,
        user.email,
        user.kyc_status,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        )
    );
  }, [users, search]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return transactions;

    return transactions.filter((transaction) =>
      [
        transaction.phone,
        transaction.reference,
        transaction.service,
        transaction.product,
        transaction.status,
        transaction.network,
        transaction.recipient,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        )
    );
  }, [transactions, search]);

  const filteredFundingRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return fundingRequests;

    return fundingRequests.filter((request) =>
      [
        request.phone,
        request.payment_reference,
        request.payment_method,
        request.notes,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        )
    );
  }, [fundingRequests, search]);

  const processFundingRequest = async (
    requestId: string,
    action: 'approve' | 'reject'
  ) => {
    if (fundingActionId) return;

    const request = fundingRequests.find(
      (item) => item.id === requestId
    );

    if (!request) {
      showNotice(
        'Funding request is no longer available.',
        'error'
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this funding request?\n\n` +
        `Phone: ${request.phone}\n` +
        `Amount: ${formatCurrency(request.amount)}`
    );

    if (!confirmed) return;

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
            `Failed to ${action} funding request.`
        );
      }

      showNotice(
        action === 'approve'
          ? 'Funding approved and wallet credited successfully.'
          : 'Funding request rejected successfully.',
        'success'
      );

      await refreshAll();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Failed to ${action} funding request.`;

      setFundingError(message);
      showNotice(message, 'error');
    } finally {
      setFundingActionId(null);
    }
  };

  const toggleAdmin = async (user: Profile) => {
    if (adminActionId) return;

    const nextValue = !Boolean(user.is_admin);

    if (
      !window.confirm(
        nextValue
          ? `Make ${user.full_name} a Super Admin?`
          : `Remove admin access from ${user.full_name}?`
      )
    ) {
      return;
    }

    setAdminActionId(user.id);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_admin: nextValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      showNotice(
        nextValue
          ? 'Admin access granted.'
          : 'Admin access removed.',
        'success'
      );

      await loadDashboardData();
    } catch (error) {
      showNotice(
        error instanceof Error
          ? error.message
          : 'Failed to update admin access.',
        'error'
      );
    } finally {
      setAdminActionId(null);
    }
  };

  const sendNotification = async () => {
    const title = notificationTitle.trim();
    const message = notificationMessage.trim();

    if (!title || !message) {
      showNotice(
        'Enter both notification title and message.',
        'error'
      );
      return;
    }

    setNotificationSending(true);

    try {
      const recipients =
        notificationTarget === 'ALL'
          ? users.map((user) => user.phone)
          : [notificationTarget];

      const rows = recipients
        .filter(Boolean)
        .map((phone) => ({
          phone,
          title,
          message,
          type: 'admin',
          is_read: false,
        }));

      if (!rows.length) {
        throw new Error('No customer was selected.');
      }

      const { error } = await supabase
        .from('notifications')
        .insert(rows);

      if (error) {
        throw new Error(error.message);
      }

      setNotificationTitle('');
      setNotificationMessage('');
      setNotificationTarget('ALL');

      showNotice(
        `Notification sent to ${rows.length} customer${
          rows.length === 1 ? '' : 's'
        }.`,
        'success'
      );

      await loadDashboardData();
    } catch (error) {
      showNotice(
        error instanceof Error
          ? error.message
          : 'Failed to send notification.',
        'error'
      );
    } finally {
      setNotificationSending(false);
    }
  };

  const markNotificationRead = async (
    notification: Notification
  ) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);

      if (error) {
        throw new Error(error.message);
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: true }
            : item
        )
      );
    } catch (error) {
      showNotice(
        error instanceof Error
          ? error.message
          : 'Failed to update notification.',
        'error'
      );
    }
  };

  const updateSetting = (
    key:
      | 'system_enabled'
      | 'maintenance_mode'
      | 'admin_auto_refresh',
    value: boolean
  ) => {
    if (key === 'system_enabled') {
      setSystemEnabled(value);
      localStorage.setItem(
        'gydata_system_enabled',
        String(value)
      );
    }

    if (key === 'maintenance_mode') {
      setMaintenanceMode(value);
      localStorage.setItem(
        'gydata_maintenance_mode',
        String(value)
      );
    }

    if (key === 'admin_auto_refresh') {
      setAutoRefresh(value);
      localStorage.setItem(
        'gydata_admin_auto_refresh',
        String(value)
      );
    }

    showNotice('Setting saved on this device.', 'success');
  };

  const renderOverview = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SmallCard
          title="Users"
          value={String(users.length)}
          subtitle={`${activeUsers} active accounts`}
          icon={Users}
          onClick={() => goTo('users')}
        />

        <SmallCard
          title="Wallet"
          value={formatCurrency(totalWallet)}
          subtitle="Customer wallet balances"
          icon={Wallet}
          onClick={() => goTo('wallet')}
        />

        <SmallCard
          title="Transactions"
          value={String(transactions.length)}
          subtitle={`${successfulTransactions.length} successful`}
          icon={CreditCard}
          onClick={() => goTo('transactions')}
        />

        <SmallCard
          title="Revenue"
          value={formatCurrency(totalSuccessfulAmount)}
          subtitle="Successful transaction value"
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
              description="Monitor balances and funding"
              onClick={() => goTo('wallet')}
            />

            <MiniAction
              icon={CreditCard}
              title="Transactions"
              description="Review transaction records"
              onClick={() => goTo('transactions')}
            />

            <MiniAction
              icon={BarChart3}
              title="Revenue Statistics"
              description="View real performance"
              onClick={() => goTo('revenue')}
            />

            <MiniAction
              icon={Database}
              title="Funding Accounts"
              description="Manage manual funding"
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
              description="Review recent activity"
              onClick={() => goTo('security')}
            />

            <MiniAction
              icon={Bell}
              title="Notifications"
              description="Send and review alerts"
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
              <span
                className={`font-bold ${
                  systemEnabled
                    ? 'text-emerald-600'
                    : 'text-red-600'
                }`}
              >
                {systemEnabled ? 'Online' : 'Disabled'}
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 py-2 text-xs">
              <span className="text-slate-500">Security</span>
              <span className="font-bold text-blue-600">
                Protected
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 py-2 text-xs">
              <span className="text-slate-500">
                Pending Funding
              </span>

              <span className="font-bold text-amber-600">
                {fundingRequests.length}
              </span>
            </div>

            <div className="flex justify-between py-2 text-xs">
              <span className="text-slate-500">Products</span>
              <span className="font-bold text-slate-800">
                {activeProducts} active
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <ActionButton
              onClick={() => void refreshAll()}
              disabled={loading || fundingLoading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  loading || fundingLoading ? 'animate-spin' : ''
                }`}
              />
              Refresh
            </ActionButton>

            <ActionButton
              onClick={() => goTo('security')}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              <Activity className="h-3.5 w-3.5" />
              Security
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <SmallCard
          title="All Users"
          value={String(users.length)}
          subtitle="Registered profiles"
          icon={Users}
          onClick={() => setSearch('')}
        />

        <SmallCard
          title="Active"
          value={String(activeUsers)}
          subtitle="Not suspended"
          icon={UserCheck}
          onClick={() => setSearch('')}
        />

        <SmallCard
          title="Suspended"
          value={String(suspendedUsers)}
          subtitle="Suspended profiles"
          icon={UserX}
          onClick={() => setSearch('suspended')}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              User Directory
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Real profiles from Supabase.
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {dataError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {dataError}
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[9px] uppercase tracking-wide text-slate-400">
                <th className="px-3 py-3">User</th>
                <th className="px-3 py-3">Phone</th>
                <th className="px-3 py-3">Wallet</th>
                <th className="px-3 py-3">KYC</th>
                <th className="px-3 py-3">Admin</th>
                <th className="px-3 py-3">Joined</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.slice(0, 100).map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-50 text-xs hover:bg-slate-50"
                >
                  <td className="px-3 py-3">
                    <div>
                      <p className="font-bold text-slate-900">
                        {user.full_name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {user.email || 'No email'}
                      </p>
                    </div>
                  </td>

                  <td className="px-3 py-3 font-semibold">
                    {user.phone}
                  </td>

                  <td className="px-3 py-3 font-black text-blue-700">
                    {formatCurrency(user.wallet_balance)}
                  </td>

                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusClass(
                        user.kyc_status
                      )}`}
                    >
                      {user.kyc_status || 'unverified'}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    {user.is_admin ? (
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-700">
                        ADMIN
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        User
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3 text-[10px] text-slate-500">
                    {formatDate(user.created_at)}
                  </td>

                  <td className="px-3 py-3">
                    <ActionButton
                      onClick={() => setSelectedUser(user)}
                      className="bg-slate-100 text-slate-700 hover:bg-blue
