import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  supabase,
} from '../../lib/supabase';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Database,
  Edit3,
  Eye,
  EyeOff,
  Landmark,
  LogOut,
  Menu,
  Package,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserCheck,
  UserCog,
  Users,
  Wallet,
  X,
  XCircle,
  Zap,
} from 'lucide-react';


/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type Section =
  | 'overview'
  | 'users'
  | 'wallet'
  | 'transactions'
  | 'revenue'
  | 'funding'
  | 'services'
  | 'admins'
  | 'security'
  | 'notifications'
  | 'settings';

type NoticeType =
  | 'success'
  | 'pending'
  | 'error';

type NoticeState = {
  message: string;
  type: NoticeType;
};

type User = {
  id: string;
  phone: string;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
  wallet_balance?: number | null;
  is_admin?: boolean | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

type Transaction = {
  id: string;
  phone?: string | null;
  type?: string | null;
  service?: string | null;
  product?: string | null;
  amount?: number | null;
  status?: string | null;
  recipient?: string | null;
  network?: string | null;
  created_at?: string | null;
  reference?: string | null;
};

type FundingRequest = {
  id: string;
  phone?: string | null;
  amount?: number | null;
  status?: string | null;
  reason?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

type Product = {
  id: string;
  service: string;
  name: string;
  price: number;
  network?: string | null;
  description?: string | null;
  category?: string | null;
  cashback_percent?: number | null;
  is_active: boolean;
  created_at?: string | null;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type?: string | null;
  created_at?: string | null;
};

type ServiceKey =
  | 'data'
  | 'airtime'
  | 'electricity'
  | 'cable'
  | 'waec'
  | 'jamb'
  | 'betting'
  | 'smile'
  | 'internet';


/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const SUPER_ADMIN_SESSION =
  'gydata_super_admin_session';

const SUPER_ADMIN_SESSION_EXPIRY =
  'gydata_super_admin_session_expiry';


const SERVICES: {
  key: ServiceKey;
  label: string;
  icon: ReactNode;
}[] = [
  {
    key: 'data',
    label: 'Data',
    icon: <Database size={19} />,
  },
  {
    key: 'airtime',
    label: 'Airtime',
    icon: <Zap size={19} />,
  },
  {
    key: 'electricity',
    label: 'Electricity',
    icon: <Landmark size={19} />,
  },
  {
    key: 'cable',
    label: 'Cable TV',
    icon: <CreditCard size={19} />,
  },
  {
    key: 'waec',
    label: 'WAEC PIN',
    icon: <ShieldCheck size={19} />,
  },
  {
    key: 'jamb',
    label: 'JAMB PIN',
    icon: <Shield size={19} />,
  },
  {
    key: 'betting',
    label: 'Betting',
    icon: <Activity size={19} />,
  },
  {
    key: 'smile',
    label: 'Smile',
    icon: <Server size={19} />,
  },
  {
    key: 'internet',
    label: 'Internet',
    icon: <Database size={19} />,
  },
];


const SERVICE_LABELS: Record<
  ServiceKey,
  string
> = {
  data: 'Data',
  airtime: 'Airtime',
  electricity: 'Electricity',
  cable: 'Cable TV',
  waec: 'WAEC PIN',
  jamb: 'JAMB PIN',
  betting: 'Betting',
  smile: 'Smile',
  internet: 'Internet',
};


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const money = (
  value: unknown,
) =>
  `#${Number(value || 0).toLocaleString(
    'en-NG',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`;


const numberValue = (
  value: unknown,
) => {
  const n = Number(value || 0);

  return Number.isFinite(n)
    ? n
    : 0;
};


const cleanPhone = (
  value: string,
) =>
  value
    .replace(/\D/g, '')
    .slice(0, 11);


const cleanAmount = (
  value: string,
) =>
  value
    .replace(/[^0-9.]/g, '')
    .replace(
      /^(\d*\.\d*).*$/,
      '$1',
    );


const formatDate = (
  value?: string | null,
) => {
  if (!value) {
    return '—';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '—';
  }

  return date.toLocaleString(
    'en-NG',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  );
};


const getUserName = (
  user: User,
) =>
  user.name ||
  user.full_name ||
  user.phone ||
  'Customer';


const getToken = () =>
  localStorage.getItem(
    SUPER_ADMIN_SESSION,
  );


const authHeaders = () => {
  const token =
    getToken();

  return {
    'Content-Type':
      'application/json',
    ...(token
      ? {
          Authorization:
            `Bearer ${token}`,
        }
      : {}),
  };
};


/*
|--------------------------------------------------------------------------
| STATUS HELPERS
|--------------------------------------------------------------------------
*/

function statusKind(
  status?: string | null,
): NoticeType {
  const value =
    String(status || '')
      .trim()
      .toLowerCase();

  if (
    value === 'success' ||
    value === 'successful' ||
    value === 'completed' ||
    value === 'approved' ||
    value === 'active'
  ) {
    return 'success';
  }

  if (
    value === 'pending' ||
    value === 'processing' ||
    value === 'waiting'
  ) {
    return 'pending';
  }

  return 'error';
}


function StatusBadge({
  status,
}: {
  status?: string | null;
}) {
  const kind =
    statusKind(status);

  const label =
    String(
      status || 'failed',
    )
      .replace(
        /_/g,
        ' ',
      )
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase(),
      );

  if (kind === 'success') {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1.5
          rounded-full
          bg-emerald-50
          px-2.5
          py-1
          text-[10px]
          font-bold
          text-emerald-700
        "
      >
        <CheckCircle2
          size={13}
        />
        {label}
      </span>
    );
  }

  if (kind === 'pending') {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1.5
          rounded-full
          bg-orange-50
          px-2.5
          py-1
          text-[10px]
          font-bold
          text-orange-700
        "
      >
        <Clock3
          size={13}
        />
        {label}
      </span>
    );
  }

  return (
    <span
      className="
        inline-flex
        items-center
        gap-1.5
        rounded-full
        bg-red-50
        px-2.5
        py-1
        text-[10px]
        font-bold
        text-red-700
      "
    >
      <XCircle
        size={13}
      />
      {label}
    </span>
  );
}


/*
|--------------------------------------------------------------------------
| UI COMPONENTS
|--------------------------------------------------------------------------
*/

function Card({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role={
        onClick
          ? 'button'
          : undefined
      }
      tabIndex={
        onClick
          ? 0
          : undefined
      }
      onKeyDown={(event) => {
        if (
          onClick &&
          (event.key ===
            'Enter' ||
            event.key ===
              ' ')
        ) {
          event.preventDefault();
          onClick();
        }
      }}
      className={`
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
        ${onClick
          ? `
            cursor-pointer
            transition
            hover:-translate-y-0.5
            hover:border-blue-200
            hover:shadow-lg
          `
          : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}


function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className="
        mb-5
        flex
        flex-col
        gap-3
        sm:flex-row
        sm:items-center
        sm:justify-between
      "
    >
      <div>
        <h2
          className="
            text-xl
            font-black
            text-[#071a41]
          "
        >
          {title}
        </h2>

        {subtitle && (
          <p
            className="
              mt-1
              text-xs
              text-slate-500
            "
          >
            {subtitle}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}


function StatCard({
  title,
  value,
  icon,
  iconClass,
  onClick,
  loading,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  iconClass: string;
  onClick?: () => void;
  loading?: boolean;
}) {
  return (
    <Card
      onClick={onClick}
      className="p-5"
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div>
          <p
            className="
              text-[10px]
              font-black
              uppercase
              tracking-wider
              text-slate-400
            "
          >
            {title}
          </p>

          <p
            className="
              mt-2
              text-2xl
              font-black
              text-slate-900
            "
          >
            {loading
              ? '...'
              : value}
          </p>
        </div>

        <div
          className={`
            rounded-xl
            p-3
            ${iconClass}
          `}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}


function Button({
  children,
  onClick,
  kind = 'blue',
  disabled = false,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?:
    | 'blue'
    | 'dark'
    | 'red'
    | 'green'
    | 'orange'
    | 'light';
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const styles = {
    blue:
      'bg-blue-700 text-white hover:bg-blue-800',
    dark:
      'bg-[#071a41] text-white hover:bg-[#0b255c]',
    red:
      'bg-red-600 text-white hover:bg-red-700',
    green:
      'bg-emerald-600 text-white hover:bg-emerald-700',
    orange:
      'bg-orange-500 text-white hover:bg-orange-600',
    light:
      'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-xl
        px-4
        py-2.5
        text-xs
        font-bold
        shadow-sm
        transition
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${styles[kind]}
      `}
    >
      {children}
    </button>
  );
}


function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  placeholder?: string;
  type?: string;
  inputMode?:
    | 'text'
    | 'numeric'
    | 'decimal'
    | 'tel'
    | 'email';
}) {
  return (
    <label className="block">
      <span
        className="
          mb-2
          block
          text-xs
          font-bold
          text-slate-600
        "
      >
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        inputMode={inputMode}
        className="
          w-full
          rounded-xl
          border
          border-slate-200
          bg-white
          px-4
          py-3
          text-sm
          font-medium
          text-slate-900
          outline-none
          transition
          placeholder:text-slate-400
          focus:border-blue-500
          focus:ring-4
          focus:ring-blue-50
        "
      />
    </label>
  );
}


function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="
          mb-2
          block
          text-xs
          font-bold
          text-slate-600
        "
      >
        {label}
      </span>

      <select
        value={value}
        onChange={onChange}
        className="
          w-full
          rounded-xl
          border
          border-slate-200
          bg-white
          px-4
          py-3
          text-sm
          font-medium
          text-slate-900
          outline-none
          focus:border-blue-500
          focus:ring-4
          focus:ring-blue-50
        "
      >
        {children}
      </select>
    </label>
  );
}


function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-dashed
        border-slate-200
        bg-white
        px-6
        py-12
        text-center
      "
    >
      <div
        className="
          mx-auto
          mb-3
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-full
          bg-slate-100
          text-slate-400
        "
      >
        <Database
          size={20}
        />
      </div>

      <h3
        className="
          text-sm
          font-black
          text-slate-800
        "
      >
        {title}
      </h3>

      <p
        className="
          mt-1
          text-xs
          text-slate-500
        "
      >
        {message}
      </p>
    </div>
  );
}


function Notice({
  notice,
  onClose,
}: {
  notice: NoticeState | null;
  onClose: () => void;
}) {
  if (!notice) {
    return null;
  }

  const success =
    notice.type === 'success';

  const pending =
    notice.type === 'pending';

  return (
    <div
      className={`
        fixed
        right-4
        top-4
        z-[100]
        flex
        max-w-sm
        items-start
        gap-3
        rounded-2xl
        border
        px-4
        py-3
        shadow-xl
        ${
          success
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : pending
              ? 'border-orange-200 bg-orange-50 text-orange-800'
              : 'border-red-200 bg-red-50 text-red-800'
        }
      `}
    >
      {success ? (
        <CheckCircle2
          size={18}
          className="mt-0.5 shrink-0"
        />
      ) : pending ? (
        <Clock3
          size={18}
          className="mt-0.5 shrink-0"
        />
      ) : (
        <AlertCircle
          size={18}
          className="mt-0.5 shrink-0"
        />
      )}

      <p
        className="
          flex-1
          text-xs
          font-bold
          leading-5
        "
      >
        {notice.message}
      </p>

      <button
        type="button"
        onClick={onClose}
        className="
          rounded-lg
          p-1
          opacity-60
          transition
          hover:bg-black/5
          hover:opacity-100
        "
      >
        <X size={15} />
      </button>
    </div>
  );
}


/*
|--------------------------------------------------------------------------
| MAIN DASHBOARD
|--------------------------------------------------------------------------
*/

export default function SuperAdminDashboard() {
  const navigate =
    useNavigate();

  const [
    section,
    setSection,
  ] = useState<Section>(
    'overview',
  );

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    notice,
    setNotice,
  ] = useState<NoticeState | null>(
    null,
  );

  const [
    users,
    setUsers,
  ] = useState<User[]>([]);

  const [
    transactions,
    setTransactions,
  ] = useState<Transaction[]>(
    [],
  );

  const [
    fundingRequests,
    setFundingRequests,
  ] = useState<
    FundingRequest[]
  >([]);

  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    notifications,
    setNotifications,
  ] = useState<
    NotificationItem[]
  >([]);

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    userSearch,
    setUserSearch,
  ] = useState('');

  const [
    transactionSearch,
    setTransactionSearch,
  ] = useState('');

  const [
    fundingSearch,
    setFundingSearch,
  ] = useState('');

  const [
    serviceFilter,
    setServiceFilter,
  ] = useState<
    ServiceKey | 'all'
  >('all');

  const [
    transactionFilter,
    setTransactionFilter,
  ] = useState<
    string
  >('all');

  const [
    fundingFilter,
    setFundingFilter,
  ] = useState<
    string
  >('all');

  const [
    selectedUser,
    setSelectedUser,
  ] = useState<User | null>(
    null,
  );

  const [
    selectedTransaction,
    setSelectedTransaction,
  ] =
    useState<Transaction | null>(
      null,
    );

  const [
    selectedFunding,
    setSelectedFunding,
  ] =
    useState<FundingRequest | null>(
      null,
    );

  const [
    walletPhone,
    setWalletPhone,
  ] = useState('');

  const [
    walletAmount,
    setWalletAmount,
  ] = useState('');

  const [
    walletType,
    setWalletType,
  ] = useState<
    'fund' | 'refund'
  >('fund');

  const [
    walletReason,
    setWalletReason,
  ] = useState('');

  const [
    walletLoading,
    setWalletLoading,
  ] = useState(false);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    productLoading,
    setProductLoading,
  ] = useState(false);

  const [
    productForm,
    setProductForm,
  ] = useState({
    service: 'data',
    name: '',
    price: '',
    network: '',
    description: '',
    category: '',
    cashback_percent: '',
    is_active: true,
  });

  const [
    editingProduct,
    setEditingProduct,
  ] = useState<Product | null>(
    null,
  );

  const [
    notificationForm,
    setNotificationForm,
  ] = useState({
    title: '',
    message: '',
    type: 'info',
  });

  const [
    notificationLoading,
    setNotificationLoading,
  ] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | NOTICE
  |--------------------------------------------------------------------------
  */

  const showNotice =
    useCallback(
      (
        message: string,
        type: NoticeType,
      ) => {
        setNotice({
          message,
          type,
        });
      },
      [],
    );


  /*
  |--------------------------------------------------------------------------
  | SESSION CHECK
  |--------------------------------------------------------------------------
  */

  const verifySession =
    useCallback(
      async () => {
        const token =
          getToken();

        const expiry =
          localStorage.getItem(
            SUPER_ADMIN_SESSION_EXPIRY,
          );

        if (!token) {
          navigate(
            '/super-admin/login',
            {
              replace: true,
            },
          );

          return false;
        }

        if (
          expiry &&
          Number(expiry) <=
            Date.now()
        ) {
          localStorage.removeItem(
            SUPER_ADMIN_SESSION,
          );

          localStorage.removeItem(
            SUPER_ADMIN_SESSION_EXPIRY,
          );

          navigate(
            '/super-admin/login',
            {
              replace: true,
            },
          );

          return false;
        }

        return true;
      },
      [navigate],
    );


  /*
  |--------------------------------------------------------------------------
  | API HELPER
  |--------------------------------------------------------------------------
  */

  const apiRequest =
    useCallback(
      async <T = any>(
        url: string,
        options: RequestInit = {},
      ): Promise<T> => {
        const token =
          getToken();

        if (!token) {
          navigate(
            '/super-admin/login',
            {
              replace: true,
            },
          );

          throw new Error(
            'Super admin session expired',
          );
        }

        const response =
          await fetch(
            url,
            {
              ...options,
              headers: {
                ...authHeaders(),
                ...(options.headers ||
                  {}),
              },
            },
          );

        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          localStorage.removeItem(
            SUPER_ADMIN_SESSION,
          );

          localStorage.removeItem(
            SUPER_ADMIN_SESSION_EXPIRY,
          );

          navigate(
            '/super-admin/login',
            {
              replace: true,
            },
          );

          throw new Error(
            'Unauthorized',
          );
        }

        const contentType =
          response.headers.get(
            'content-type',
          ) || '';

        const data =
          contentType.includes(
            'application/json',
          )
            ? await response.json()
            : await response.text();

        if (
          !response.ok
        ) {
          const message =
            typeof data ===
            'object'
              ? data?.message ||
                data?.error ||
                'Request failed'
              : String(
                  data ||
                    'Request failed',
                );

          throw new Error(
            message,
          );
        }

        return data as T;
      },
      [navigate],
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD USERS
  |--------------------------------------------------------------------------
  */

  const loadUsers =
    useCallback(
      async () => {
        try {
          const data =
            await apiRequest<
              User[]
            >(
              '/api/admin/users',
            );

          setUsers(
            Array.isArray(
              data,
            )
              ? data
              : Array.isArray(
                    data?.users,
                  )
                ? data.users
                : [],
          );
        } catch (error) {
          console.error(
            'loadUsers:',
            error,
          );
        }
      },
      [apiRequest],
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD TRANSACTIONS
  |--------------------------------------------------------------------------
  */

  const loadTransactions =
    useCallback(
      async () => {
        try {
          const data =
            await apiRequest<
              Transaction[]
            >(
              '/api/admin/transactions',
            );

          setTransactions(
            Array.isArray(
              data,
            )
              ? data
              : Array.isArray(
                    data?.transactions,
                  )
                ? data.transactions
                : [],
          );
        } catch (error) {
          console.error(
            'loadTransactions:',
            error,
          );
        }
      },
      [apiRequest],
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD FUNDING REQUESTS
  |--------------------------------------------------------------------------
  */

  const loadFundingRequests =
    useCallback(
      async () => {
        try {
          const data =
            await apiRequest<
              FundingRequest[]
            >(
              '/api/funding/admin',
            );

          setFundingRequests(
            Array.isArray(
              data,
            )
              ? data
              : Array.isArray(
                    data?.requests,
                  )
                ? data.requests
                : [],
          );
        } catch (error) {
          console.error(
            'loadFundingRequests:',
            error,
          );
        }
      },
      [apiRequest],
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD PRODUCTS
  |--------------------------------------------------------------------------
  */

  const loadProducts =
    useCallback(
      async () => {
        try {
          const data =
            await apiRequest<
              Product[]
            >(
              '/api/admin/products',
            );

          setProducts(
            Array.isArray(
              data,
            )
              ? data
              : Array.isArray(
                    data?.products,
                  )
                ? data.products
                : [],
          );
        } catch (error) {
          console.error(
            'loadProducts:',
            error,
          );
        }
      },
      [apiRequest],
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD NOTIFICATIONS
  |--------------------------------------------------------------------------
  */

  const loadNotifications =
    useCallback(
      async () => {
        try {
          const data =
            await apiRequest<
              NotificationItem[]
            >(
              '/api/admin/notifications',
            );

          setNotifications(
            Array.isArray(
              data,
            )
              ? data
              : Array.isArray(
                    data?.notifications,
                  )
                ? data.notifications
                : [],
          );
        } catch (error) {
          console.error(
            'loadNotifications:',
            error,
          );
        }
      },
      [apiRequest],
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD EVERYTHING
  |--------------------------------------------------------------------------
  */

  const loadDashboard =
    useCallback(
      async (
        silent = false,
      ) => {
        const valid =
          await verifySession();

        if (!valid) {
          return;
        }

        if (!silent) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        try {
          await Promise.all([
            loadUsers(),
            loadTransactions(),
            loadFundingRequests(),
            loadProducts(),
            loadNotifications(),
          ]);
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        verifySession,
        loadUsers,
        loadTransactions,
        loadFundingRequests,
        loadProducts,
        loadNotifications,
      ],
    );


  useEffect(() => {
    void loadDashboard();
  }, [
    loadDashboard,
  ]);


  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const handleLogout =
    useCallback(
      () => {
        localStorage.removeItem(
          SUPER_ADMIN_SESSION,
        );

        localStorage.removeItem(
          SUPER_ADMIN_SESSION_EXPIRY,
        );

        navigate(
          '/super-admin/login',
          {
            replace: true,
          },
        );
      },
      [navigate],
    );


  /*
  |--------------------------------------------------------------------------
  | DIRECT WALLET ADJUSTMENT
  |--------------------------------------------------------------------------
  */

  const handleWalletAdjustment =
    useCallback(
      async () => {
        const phone =
          cleanPhone(
            walletPhone,
          );

        const amount =
          Number(
            walletAmount,
          );

        if (
          phone.length <
          10
        ) {
          showNotice(
            'Enter a valid customer phone number.',
            'error',
          );

          return;
        }

        if (
          !Number.isFinite(
            amount,
          ) ||
          amount <= 0
        ) {
          showNotice(
            'Enter a valid amount.',
            'error',
          );

          return;
        }

        setWalletLoading(
          true,
        );

        try {
          const result =
            await apiRequest(
              '/api/funding/admin-adjust',
              {
                method:
                  'POST',
                body: JSON.stringify(
                  {
                    phone,
                    amount,
                    type:
                      walletType,
                    reason:
                      walletReason ||
                      'Super Admin wallet adjustment',
                  },
                ),
              },
            );

          if (
            result?.success ===
            false
          ) {
            throw new Error(
              result?.message ||
                'Wallet adjustment failed',
            );
          }

          showNotice(
            walletType ===
              'fund'
              ? 'Wallet funded successfully.'
              : 'Wallet refund completed successfully.',
            'success',
          );

          setWalletPhone('');
          setWalletAmount('');
          setWalletReason('');

          await Promise.all([
            loadUsers(),
            loadTransactions(),
            loadFundingRequests(),
          ]);
        } catch (error) {
          console.error(
            'handleWalletAdjustment:',
            error,
          );

          showNotice(
            error instanceof
              Error
              ? error.message
              : 'Wallet adjustment failed.',
            'error',
          );
        } finally {
          setWalletLoading(
            false,
          );
        }
      },
      [
        walletPhone,
        walletAmount,
        walletType,
        walletReason,
        showNotice,
        apiRequest,
        loadUsers,
        loadTransactions,
        loadFundingRequests,
      ],
    );


  /*
  |--------------------------------------------------------------------------
  | APPROVE FUNDING
  |--------------------------------------------------------------------------
  */

  const handleApproveFunding =
    useCallback(
      async (
        request: FundingRequest,
      ) => {
        if (
          !request.id
        ) {
          return;
        }

        setActionLoading(
          true,
        );

        try {
          const result =
            await apiRequest(
              `/api/funding/${request.id}/approve`,
              {
                method:
                  'POST',
              },
            );

          if (
            result?.success ===
            false
          ) {
            throw new Error(
              result?.message ||
                'Funding approval failed',
            );
          }

          showNotice(
            'Funding request approved successfully.',
            'success',
          );

          setSelectedFunding(
            null,
          );

          await Promise.all([
            loadFundingRequests(),
            loadUsers(),
            loadTransactions(),
          ]);
        } catch (error) {
          console.error(
            'handleApproveFunding:',
            error,
          );

          showNotice(
            error instanceof
              Error
              ? error.message
              : 'Funding approval failed.',
            'error',
          );
        } finally {
          setActionLoading(
            false,
          );
        }
      },
      [
        apiRequest,
        showNotice,
        loadFundingRequests,
        loadUsers,
        loadTransactions,
      ],
    );


  /*
  |--------------------------------------------------------------------------
  | REJECT FUNDING
  |--------------------------------------------------------------------------
  */

  const handleRejectFunding =
    useCallback(
      async (
        request: FundingRequest,
      ) => {
        if (
          !request.id
        ) {
          return;
        }

        setActionLoading(
          true,
        );

        try {
          const result =
            await apiRequest(
              `/api/funding/${request.id}/reject`,
              {
                method:
                  'POST',
              },
            );

          if (
            result?.success ===
            false
          ) {
            throw new Error(
              result?.message ||
                'Funding rejection failed',
            );
          }

          showNotice(
            'Funding request rejected.',
            'success',
          );

          setSelectedFunding(
            null,
          );

          await loadFundingRequests();
        } catch (error) {
          console.error(
            'handleRejectFunding:',
            error,
          );

          showNotice(
            error instanceof
              Error
              ? error.message
              : 'Funding rejection failed.',
            'error',
          );
        } finally {
          setActionLoading(
            false,
          );
        }
      },
      [
        apiRequest,
        showNotice,
        loadFundingRequests,
      ],
    );


  /*
  |--------------------------------------------------------------------------
  | FILTERED USERS
  |--------------------------------------------------------------------------
  */

  const filteredUsers =
    useMemo(() => {
      const query =
        userSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return users;
      }

      return users.filter(
        (user) =>
          [
            user.phone,
            user.name,
            user.full_name,
            user.email,
          ]
            .filter(Boolean)
            .some(
              (value) =>
                String(value)
                  .toLowerCase()
                  .includes(
                    query,
                  ),
            ),
      );
    }, [
      users,
      userSearch,
    ]);


  /*
  |--------------------------------------------------------------------------
  | FILTERED TRANSACTIONS
  |--------------------------------------------------------------------------
  */

  const filteredTransactions =
    useMemo(() => {
      const query =
        transactionSearch
          .trim()
          .toLowerCase();

      return transactions.filter(
        (transaction) => {
          const matchesSearch =
            !query ||
            [
              transaction.phone,
              transaction.type,
              transaction.service,
              transaction.product,
              transaction.reference,
              transaction.recipient,
            ]
              .filter(Boolean)
              .some(
                (value) =>
                  String(value)
                    .toLowerCase()
                    .includes(
                      query,
                    ),
              );

          const matchesFilter =
            transactionFilter ===
              'all' ||
            String(
              transaction.status ||
                '',
            ).toLowerCase() ===
              transactionFilter;

          return (
            matchesSearch &&
            matchesFilter
          );
        },
      );
    }, [
      transactions,
      transactionSearch,
      transactionFilter,
    ]);


  /*
  |--------------------------------------------------------------------------
  | FILTERED FUNDING
  |--------------------------------------------------------------------------
  */

  const filteredFunding =
    useMemo(() => {
      const query =
        fundingSearch
          .trim()
          .toLowerCase();

      return fundingRequests.filter(
        (request) => {
          const matchesSearch =
            !query ||
            [
              request.phone,
              request.reason,
              request.notes,
              request.status,
            ]
              .filter(Boolean)
              .some(
                (value) =>
                  String(value)
                    .toLowerCase()
                    .includes(
                      query,
                    ),
              );

          const matchesStatus =
            fundingFilter ===
              'all' ||
            String(
              request.status ||
                '',
            ).toLowerCase() ===
              fundingFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      fundingRequests,
      fundingSearch,
      fundingFilter,
    ]);


  /*
  |--------------------------------------------------------------------------
  | FILTERED PRODUCTS
  |--------------------------------------------------------------------------
  */

  const filteredProducts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const matchesSearch =
            !query ||
            [
              product.name,
              product.service,
              product.network,
              product.category,
            ]
              .filter(Boolean)
              .some(
                (value) =>
                  String(value)
                    .toLowerCase()
                    .includes(
                      query,
                    ),
              );

          const matchesService =
            serviceFilter ===
              'all' ||
            product.service ===
              serviceFilter;

          return (
            matchesSearch &&
            matchesService
          );
        },
      );
    }, [
      products,
      search,
      serviceFilter,
    ]);


  /*
  |--------------------------------------------------------------------------
  | STATS
  |--------------------------------------------------------------------------
  */

  const totalUsers =
    users.length;

  const activeUsers =
    users.filter(
      (user) =>
        user.is_active !==
          false,
    ).length;

  const totalWallet =
    users.reduce(
      (sum, user) =>
        sum +
        numberValue(
          user.wallet_balance,
        ),
      0,
    );

  const successfulTransactions =
    transactions.filter(
      (transaction) =>
        statusKind(
          transaction.status,
        ) === 'success',
    );

  const transactionRevenue =
    successfulTransactions.reduce(
      (sum, transaction) =>
        sum +
        numberValue(
          transaction.amount,
        ),
      0,
    );

  const pendingFunding =
    fundingRequests.filter(
      (request) =>
        String(
          request.status ||
            '',
        ).toLowerCase() ===
        'pending',
    );

  const pendingFundingAmount =
    pendingFunding.reduce(
      (sum, request) =>
        sum +
        numberValue(
          request.amount,
        ),
      0,
    );


  /*
  |--------------------------------------------------------------------------
  | PRODUCT SAVE
  |--------------------------------------------------------------------------
  */

  const handleSaveProduct =
    useCallback(
      async () => {
        if (
          !productForm.name.trim()
        ) {
          showNotice(
            'Product name is required.',
            'error',
          );

          return;
        }

        const price =
          Number(
            productForm.price,
          );

        if (
          !Number.isFinite(
            price,
          ) ||
          price < 0
        ) {
          showNotice(
            'Enter a valid product price.',
            'error',
          );

          return;
        }

        setProductLoading(
          true,
        );

        try {
          const payload = {
            service:
              productForm.service,
            name:
              productForm.name.trim(),
            price,
            network:
              productForm.network ||
              null,
            description:
              productForm.description ||
              null,
            category:
              productForm.category ||
              null,
            cashback_percent:
              Number(
                productForm.cashback_percent ||
                  0,
              ),
            is_active:
              productForm.is_active,
          };

          const result =
            editingProduct
              ? await apiRequest(
                  `/api/admin/products/${editingProduct.id}`,
                  {
                    method:
                      'PUT',
                    body:
                      JSON.stringify(
                        payload,
                      ),
                  },
                )
              : await apiRequest(
                  '/api/admin/products',
                  {
                    method:
                      'POST',
                    body:
                      JSON.stringify(
                        payload,
                      ),
                  },
                );

          if (
            result?.success ===
            false
          ) {
            throw new Error(
              result?.message ||
                'Product save failed',
            );
          }

          showNotice(
            editingProduct
              ? 'Product updated successfully.'
              : 'Product created successfully.',
            'success',
          );

          setEditingProduct(
            null,
          );

          setProductForm({
            service: 'data',
            name: '',
            price: '',
            network: '',
            description: '',
            category: '',
            cashback_percent:
              '',
            is_active: true,
          });

          await loadProducts();
        } catch (error) {
          console.error(
            'handleSaveProduct:',
            error,
          );

          showNotice(
            error instanceof
              Error
              ? error.message
              : 'Product save failed.',
            'error',
          );
        } finally {
          setProductLoading(
            false,
          );
        }
      },
      [
        productForm,
        editingProduct,
        showNotice,
        apiRequest,
        loadProducts,
      ],
    );


  /*
  |--------------------------------------------------------------------------
  | DELETE PRODUCT
  |--------------------------------------------------------------------------
  */

  const handleDeleteProduct =
    useCallback(
      async (
        product: Product,
      ) => {
        if (
          !window.confirm(
            `Delete "${product.name}"?`,
          )
        ) {
          return;
        }

        setProductLoading(
          true,
        );

        try {
          const result =
            await apiRequest(
              `/api/admin/products/${product.id}`,
              {
                method:
                  'DELETE',
              },
            );

          if (
            result?.success ===
            false
          ) {
            throw new Error(
              result?.message ||
                'Product deletion failed',
            );
          }

          showNotice(
            'Product deleted successfully.',
            'success',
          );

          await loadProducts();
        } catch (error) {
          console.error(
            'handleDeleteProduct:',
            error,
          );

          showNotice(
            error instanceof
              Error
              ? error.message
              : 'Product deletion failed.',
            'error',
          );
        } finally {
          setProductLoading(
            false,
          );
        }
      },
      [
        apiRequest,
        showNotice,
        loadProducts,
      ],
    );


  /*
  |--------------------------------------------------------------------------
  | TOGGLE PRODUCT
  |--------------------------------------------------------------------------
  */

  const handleToggleProduct =
    useCallback(
      async (
        product: Product,
      ) => {
        setProductLoading(
          true,
        );

        try {
          const result =
            await apiRequest(
              `/api/admin/products/${product.id}`,
              {
                method:
                  'PUT',
                body:
                  JSON.stringify({
                    ...product,
                    is_active:
                      !product.is_active,
                  }),
              },
            );

          if (
            result?.success ===
            false
          ) {
            throw new Error(
              result?.message ||
                'Product update failed',
            );
          }

          showNotice(
            product.is_active
              ? 'Product disabled.'
              : 'Product enabled.',
            'success',
          );

          await loadProducts();
        } catch (error) {
          console.error(
            'handleToggleProduct:',
            error,
          );

          showNotice(
            error instanceof
              Error
              ? error.message
              : 'Product update failed.',
            'error',
          );
        } finally {
          setProductLoading(
            false,
          );
        }
      },
      [
        apiRequest,
        showNotice,
        loadProducts,
      ],
    );


  /*
  |--------------------------------------------------------------------------
  | SEND NOTIFICATION
  |--------------------------------------------------------------------------
  */

  const handleSendNotification =
    useCallback(
      async () => {
        if (
          !notificationForm.title.trim() ||
          !notificationForm.message.trim()
        ) {
          showNotice(
            'Title and message are required.',
            'error',
          );

          return;
        }

        setNotificationLoading(
          true,
        );

        try {
          const result =
            await apiRequest(
              '/api/admin/notifications',
              {
                method:
                  'POST',
                body:
                  JSON.stringify(
                    {
                      title:
                        notificationForm.title.trim(),
                      message:
                        notificationForm.message.trim(),
                      type:
                        notificationForm.type,
                    },
                  ),
              },
            );

          if (
            result?.success ===
            false
          ) {
            throw new Error(
              result?.message ||
                'Notification failed',
            );
          }

          showNotice(
            'Notification sent successfully.',
            'success',
          );

          setNotificationForm({
            title: '',
            message: '',
            type: 'info',
          });

          await loadNotifications();
        } catch (error) {
          console.error(
            'handleSendNotification:',
            error,
          );

          showNotice(
            error instanceof
              Error
              ? error.message
              : 'Notification failed.',
            'error',
          );
        } finally {
          setNotificationLoading(
            false,
          );
        }
      },
      [
        notificationForm,
        showNotice,
        apiRequest,
        loadNotifications,
      ],
    );


  /*
  |--------------------------------------------------------------------------
  | SIDEBAR
  |--------------------------------------------------------------------------
  */

  const navigationItems: {
    key: Section;
    label: string;
    icon: ReactNode;
  }[] = [
    {
      key: 'overview',
      label: 'Overview',
      icon:
        <BarChart3
          size={18}
        />,
    },
    {
      key: 'users',
      label: 'Users',
      icon:
        <Users
          size={18}
        />,
    },
    {
      key: 'wallet',
      label: 'Wallet',
      icon:
        <Wallet
          size={18}
        />,
    },
    {
      key: 'transactions',
      label: 'Transactions',
      icon:
        <CreditCard
          size={18}
        />,
    },
    {
      key: 'revenue',
      label: 'Revenue',
      icon:
        <TrendingUp
          size={18}
        />,
    },
    {
      key: 'funding',
      label: 'Funding',
      icon:
        <Landmark
          size={18}
        />,
    },
    {
      key: 'services',
      label: 'Services',
      icon:
        <Package
          size={18}
        />,
    },
    {
      key: 'admins',
      label: 'Admins',
      icon:
        <UserCog
          size={18}
        />,
    },
    {
      key: 'security',
      label: 'Security',
      icon:
        <ShieldCheck
          size={18}
        />,
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon:
        <Bell
          size={18}
        />,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon:
        <Settings
          size={18}
        />,
    },
  ];


  /*
  |--------------------------------------------------------------------------
  | OVERVIEW
  |--------------------------------------------------------------------------
  */

  const OverviewSection =
    () => (
      <div>
        <SectionTitle
          title="Overview"
          subtitle="Monitor your platform activity and wallet operations."
          action={
            <Button
              kind="light"
              onClick={() =>
                void loadDashboard(
                  true,
                )
              }
              disabled={
                refreshing
              }
            >
              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? 'animate-spin'
                    : ''
                }
              />
              Refresh
            </Button>
          }
        />

        <div
          className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          <StatCard
            title="Total Users"
            value={String(
              totalUsers,
            )}
            icon={
              <Users
                size={21}
              />
            }
            iconClass="
              bg-blue-50
              text-blue-700
            "
            onClick={() =>
              setSection(
                'users',
              )
            }
            loading={loading}
          />

          <StatCard
            title="Active Users"
            value={String(
              activeUsers,
            )}
            icon={
              <UserCheck
                size={21}
              />
            }
            iconClass="
              bg-emerald-50
              text-emerald-700
            "
            onClick={() =>
              setSection(
                'users',
              )
            }
            loading={loading}
          />

          <StatCard
            title="Wallet Balance"
            value={money(
              totalWallet,
            )}
            icon={
              <Wallet
                size={21}
              />
            }
            iconClass="
              bg-orange-50
              text-orange-600
            "
            onClick={() =>
              setSection(
                'wallet',
              )
            }
            loading={loading}
          />

          <StatCard
            title="Revenue"
            value={money(
              transactionRevenue,
            )}
            icon={
              <TrendingUp
                size={21}
              />
            }
            iconClass="
              bg-purple-50
              text-purple-700
            "
            onClick={() =>
              setSection(
                'revenue',
              )
            }
            loading={loading}
          />
        </div>

        <div
          className="
            mt-6
            grid
            grid-cols-1
            gap-5
            xl:grid-cols-3
          "
        >
          <Card
            className="
              p-5
              xl:col-span-2
            "
          >
            <div
              className="
                mb-5
                flex
                items-center
                justify-between
              "
            >
              <div>
                <h3
                  className="
                    text-sm
                    font-black
                    text-[#071a41]
                  "
                >
                  Recent Transactions
                </h3>

                <p
                  className="
                    mt-1
                    text-[11px]
                    text-slate-500
                  "
                >
                  Latest wallet and service activity
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSection(
                    'transactions',
                  )
                }
                className="
                  inline-flex
                  items-center
                  gap-1
                  text-[11px]
                  font-black
                  text-blue-700
                  hover:text-blue-900
                "
              >
                View all
                <ChevronRight
                  size={14}
                />
              </button>
            </div>

            {transactions.length ===
            0 ? (
              <EmptyState
                title="No transactions"
                message="Transaction activity will appear here."
              />
            ) : (
              <div
                className="
                  overflow-x-auto
                "
              >
                <table
                  className="
                    w-full
                    min-w-[650px]
                    text-left
                  "
                >
                  <thead>
                    <tr
                      className="
                        border-b
                        border-slate-100
                        text-[10px]
                        font-black
                        uppercase
                        tracking-wider
                        text-slate-400
                      "
                    >
                      <th className="pb-3">
                        Customer
                      </th>
                      <th className="pb-3">
                        Service
                      </th>
                      <th className="pb-3">
                        Amount
                      </th>
                      <th className="pb-3">
                        Status
                      </th>
                      <th className="pb-3">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions
                      .slice(
                        0,
                        8,
                      )
                      .map(
                        (
                          transaction,
                        ) => (
                          <tr
                            key={
                              transaction.id
                            }
                            className="
                              border-b
                              border-slate-50
                              last:border-0
                            "
                          >
                            <td className="py-3">
                              <p
                                className="
                                  text-xs
                                  font-bold
                                  text-slate-800
                                "
                              >
                                {transaction.phone ||
                                  '—'}
                              </p>

                              {transaction.reference && (
                                <p
                                  className="
                                    mt-0.5
                                    text-[9px]
                                    text-slate-400
                                  "
                                >
                                  {
                                    transaction.reference
                                  }
                                </p>
                              )}
                            </td>

                            <td className="py-3">
                              <p
                                className="
                                  text-xs
                                  font-semibold
                                  text-slate-700
                                "
                              >
                                {transaction.service ||
                                  transaction.type ||
                                  '—'}
                              </p>

                              <p
                                className="
                                  mt-0.5
                                  text-[9px]
                                  text-slate-400
                                "
                              >
                                {transaction.product ||
                                  '—'}
                              </p>
                            </td>

                            <td className="py-3">
                              <span
                                className="
                                  text-xs
                                  font-black
                                  text-slate-900
                                "
                              >
                                {money(
                                  transaction.amount,
                                )}
                              </span>
                            </td>

                            <td className="py-3">
                              <StatusBadge
                                status={
                                  transaction.status
                                }
                              />
                            </td>

                            <td className="py-3">
                              <span
                                className="
                                  text-[10px]
                                  font-medium
                                  text-slate-500
                                "
                              >
                                {formatDate(
                                  transaction.created_at,
                                )}
                              </span>
                            </td>
                          </tr>
                        ),
                      )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card
            className="p-5"
          >
            <div
              className="
                mb-5
                flex
                items-center
                justify-between
              "
            >
              <div>
                <h3
                  className="
                    text-sm
                    font-black
                    text-[#071a41]
                  "
                >
                  Funding
                </h3>

                <p
                  className="
                    mt-1
                    text-[11px]
                    text-slate-500
                  "
                >
                  Pending wallet funding
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSection(
                    'funding',
                  )
                }
                className="
                  text-[11px]
                  font-black
                  text-blue-700
                "
              >
                View
              </button>
            </div>

            <div
              className="
                rounded-2xl
                bg-orange-50
                p-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >
                <div>
                  <p
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-wider
                      text-orange-600
                    "
                  >
                    Pending Requests
                  </p>

                  <p
                    className="
                      mt-1
                      text-2xl
                      font-black
                      text-orange-800
                    "
                  >
                    {pendingFunding.length}
                  </p>
                </div>

                <Clock3
                  size={25}
                  className="
                    text-orange-500
                  "
                />
              </div>

              <div
                className="
                  mt-4
                  border-t
                  border-orange-100
                  pt-3
                "
              >
                <p
                  className="
                    text-[10px]
                    font-bold
                    text-orange-700
                  "
                >
                  Pending amount
                </p>

                <p
                  className="
                    mt-1
                    text-lg
                    font-black
                    text-orange-900
                  "
                >
                  {money(
                    pendingFundingAmount,
                  )}
                </p>
              </div>
            </div>

            <div
              className="
                mt-4
                grid
                grid-cols-2
                gap-3
              "
            >
              <button
                type="button"
                onClick={() =>
                  setSection(
                    'wallet',
                  )
                }
                className="
                  rounded-xl
                  bg-[#071a41]
                  px-3
                  py-3
                  text-[10px]
                  font-black
                  text-white
                  transition
                  hover:bg-[#0b255c]
                "
              >
                Wallet Adjustment
              </button>

              <button
                type="button"
                onClick={() =>
                  setSection(
                    'funding',
                  )
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-3
                  py-3
                  text-[10px]
                  font-black
                  text-slate-700
                  transition
                  hover:bg-slate-50
                "
              >
                Funding Requests
              </button>
            </div>
          </Card>
        </div>

        <div
          className="
            mt-6
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >
          {SERVICES.map(
            (service) => (
              <Card
                key={
                  service.key
                }
                onClick={() => {
                  setSection(
                    'services',
                  );
                  setServiceFilter(
                    service.key,
                  );
                }}
                className="
                  p-4
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-[#071a41]
                      text-white
                    "
                  >
                    {
                      service.icon
                    }
                  </div>

                  <div>
                    <p
                      className="
                        text-xs
                        font-black
                        text-slate-800
                      "
                    >
                      {
                        service.label
                      }
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-[9px]
                        text-slate-400
                      "
                    >
                      {
                        products.filter(
                          (
                            product,
                          ) =>
                            product.service ===
                            service.key,
                        ).length
                      }{' '}
                      products
                    </p>
                  </div>

                  <ChevronRight
                    size={15}
                    className="
                      ml-auto
                      text-slate-300
                    "
                  />
                </div>
              </Card>
            ),
          )}
        </div>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | USERS SECTION
  |--------------------------------------------------------------------------
  */

  const UsersSection =
    () => (
      <div>
        <SectionTitle
          title="Users"
          subtitle="Manage customer accounts and wallet balances."
          action={
            <Button
              kind="light"
              onClick={() =>
                void loadUsers()
              }
            >
              <RefreshCw
                size={15}
              />
              Refresh
            </Button>
          }
        />

        <Card
          className="p-4"
        >
          <div
            className="
              flex
              flex-col
              gap-3
              md:flex-row
            "
          >
            <div
              className="
                relative
                flex-1
              "
            >
              <Search
                size={16}
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                value={
                  userSearch
                }
                onChange={(
                  event,
                ) =>
                  setUserSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="
                  Search phone, name or email
                "
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  py-3
                  pl-10
                  pr-4
                  text-xs
                  font-medium
                  outline-none
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-50
                "
              />
            </div>

            <Button
              kind="dark"
              onClick={() =>
                setSection(
                  'wallet',
                )
              }
            >
              <Wallet
                size={15}
              />
              Adjust Wallet
            </Button>
          </div>
        </Card>

        <Card
          className="
            mt-5
            overflow-hidden
          "
        >
          {filteredUsers.length ===
          0 ? (
            <div className="p-5">
              <EmptyState
                title="No users found"
                message="Try another search."
              />
            </div>
          ) : (
            <div
              className="
                overflow-x-auto
              "
            >
              <table
                className="
                  w-full
                  min-w-[850px]
                  text-left
                "
              >
                <thead>
                  <tr
                    className="
                      border-b
                      border-slate-100
                      bg-slate-50
                      text-[10px]
                      font-black
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    <th className="px-5 py-4">
                      Customer
                    </th>

                    <th className="px-5 py-4">
                      Phone
                    </th>

                    <th className="px-5 py-4">
                      Wallet
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Joined
                    </th>

                    <th className="px-5 py-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map(
                    (user) => (
                      <tr
                        key={
                          user.id
                        }
                        className="
                          border-b
                          border-slate-50
                          last:border-0
                          hover:bg-slate-50/70
                        "
                      >
                        <td className="px-5 py-4">
                          <div
                            className="
                              flex
                              items-center
                              gap-3
                            "
                          >
                            <div
                              className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-[#071a41]
                                text-xs
                                font-black
                                text-white
                              "
                            >
                              {getUserName(
                                user,
                              )
                                .slice(
                                  0,
                                  1,
                                )
                                .toUpperCase()}
                            </div>

                            <div>
                              <p
                                className="
                                  text-xs
                                  font-black
                                  text-slate-800
                                "
                              >
                                {getUserName(
                                  user,
                                )}
                              </p>

                              {user.email && (
                                <p
                                  className="
                                    mt-0.5
                                    text-[9px]
                                    text-slate-400
                                  "
                                >
                                  {
                                    user.email
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className="
                              text-xs
                              font-bold
                              text-slate-700
                            "
                          >
                            {
                              user.phone
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className="
                              text-xs
                              font-black
                              text-slate-900
                            "
                          >
                            {money(
                              user.wallet_balance,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {user.is_active ===
                          false ? (
                            <StatusBadge
                              status="inactive"
                            />
                          ) : (
                            <StatusBadge
                              status="active"
                            />
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className="
                              text-[10px]
                              font-medium
                              text-slate-500
                            "
                          >
                            {formatDate(
                              user.created_at,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div
                            className="
                              flex
                              justify-end
                              gap-2
                            "
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedUser(
                                  user,
                                )
                              }
                              className="
                                rounded-lg
                                border
                                border-slate-200
                                bg-white
                                p-2
                                text-slate-500
                                transition
                                hover:bg-slate-50
                                hover:text-[#071a41]
                              "
                              title="View user"
                            >
                              <Eye
                                size={15}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setWalletPhone(
                                  user.phone,
                                );
                                setSection(
                                  'wallet',
                                );
                              }}
                              className="
                                rounded-lg
                                bg-[#071a41]
                                p-2
                                text-white
                                transition
                                hover:bg-[#0b255c]
                              "
                              title="Adjust wallet"
                            >
                              <Wallet
                                size={15}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | WALLET SECTION
  |--------------------------------------------------------------------------
  */

  const WalletSection =
    () => (
      <div>
        <SectionTitle
          title="Wallet"
          subtitle="Directly fund or refund a customer wallet."
        />

        <div
          className="
            grid
            grid-cols-1
            gap-5
            lg:grid-cols-3
          "
        >
          <Card
            className="
              p-6
              lg:col-span-2
            "
          >
            <div
              className="
                mb-6
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#071a41]
                  text-white
                "
              >
                <Wallet
                  size={21}
                />
              </div>

              <div>
                <h3
                  className="
                    text-base
                    font-black
                    text-[#071a41]
                  "
                >
                  Wallet Adjustment
                </h3>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    text-slate-500
                  "
                >
                  This operation updates the customer wallet directly.
                </p>
              </div>
            </div>

            <div
              className="
                grid
                grid-cols-1
                gap-4
                md:grid-cols-2
              "
            >
              <Input
                label="Customer Phone"
                value={
                  walletPhone
                }
                onChange={(
                  event,
                ) =>
                  setWalletPhone(
                    cleanPhone(
                      event.target
                        .value,
                    ),
                  )
                }
                placeholder="08012345678"
                inputMode="tel"
              />

              <Input
                label="Amount"
                value={
                  walletAmount
                }
                onChange={(
                  event,
                ) =>
                  setWalletAmount(
                    cleanAmount(
                      event.target
                        .value,
                    ),
                  )
                }
                placeholder="5000"
                inputMode="decimal"
              />

              <Select
                label="Adjustment Type"
                value={
                  walletType
                }
                onChange={(
                  event,
                ) =>
                  setWalletType(
                    event.target
                      .value as
                      | 'fund'
                      | 'refund',
                  )
                }
              >
                <option value="fund">
                  Fund Wallet
                </option>

                <option value="refund">
                  Refund / Deduct
                </option>
              </Select>

              <Input
                label="Reason"
                value={
                  walletReason
                }
                onChange={(
                  event,
                ) =>
                  setWalletReason(
                    event.target
                      .value,
                  )
                }
                placeholder="Manual funding"
              />
            </div>

            <div
              className="
                mt-5
                flex
                flex-col
                gap-3
                rounded-2xl
                border
                border-orange-100
                bg-orange-50
                p-4
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div>
                <p
                  className="
                    text-[10px]
                    font-black
                    uppercase
                    tracking-wider
                    text-orange-600
                  "
                >
                  Adjustment
                </p>

                <p
                  className="
                    mt-1
                    text-lg
                    font-black
                    text-orange-900
                  "
                >
                  {money(
                    walletAmount,
                  )}
                </p>
              </div>

              <Button
                kind={
                  walletType ===
                  'fund'
                    ? 'green'
                    : 'red'
                }
                onClick={() =>
                  void handleWalletAdjustment()
                }
                disabled={
                  walletLoading
                }
              >
                {walletLoading ? (
                  <>
                    <RefreshCw
                      size={15}
                      className="animate-spin"
                    />
                    Processing...
                  </>
                ) : walletType ===
                  'fund' ? (
                  <>
                    <Plus
                      size={15}
                    />
                    Fund Wallet
                  </>
                ) : (
                  <>
                    <TrendingUp
                      size={15}
                    />
                    Refund Wallet
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card
            className="p-6"
          >
            <p
              className="
                text-[10px]
                font-black
                uppercase
                tracking-wider
                text-slate-400
              "
            >
              Total Wallet Balance
            </p>

            <p
              className="
                mt-2
                text-3xl
                font-black
                text-[#071a41]
              "
            >
              {money(
                totalWallet,
              )}
            </p>

            <div
              className="
                mt-5
                border-t
                border-slate-100
                pt-5
              "
            >
              <p
                className="
                  text-[10px]
                  font-bold
                  text-slate-400
                "
              >
                Customers
              </p>

              <p
                className="
                  mt-1
                  text-xl
                  font-black
                  text-slate-800
                "
              >
                {totalUsers}
              </p>
            </div>

            <div
              className="
                mt-5
                border-t
                border-slate-100
                pt-5
              "
            >
              <p
                className="
                  text-[10px]
                  font-bold
                  text-slate-400
                "
              >
                Pending Funding
              </p>

              <p
                className="
                  mt-1
                  text-xl
                  font-black
                  text-orange-600
                "
              >
                {money(
                  pendingFundingAmount,
                )}
              </p>
            </div>
          </Card>
        </div>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | TRANSACTIONS SECTION
  |--------------------------------------------------------------------------
  */

  const TransactionsSection =
    () => (
      <div>
        <SectionTitle
          title="Transactions"
          subtitle="Review customer transactions and wallet activity."
        />

        <Card
          className="p-4"
        >
          <div
            className="
              grid
              grid-cols-1
              gap-3
              md:grid-cols-[1fr_200px]
            "
          >
            <div
              className="
                relative
              "
            >
              <Search
                size={16}
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                value={
                  transactionSearch
                }
                onChange={(
                  event,
                ) =>
                  setTransactionSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search transactions..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  py-3
                  pl-10
                  pr-4
                  text-xs
                  outline-none
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-50
                "
              />
            </div>

            <Select
              label="Status"
              value={
                transactionFilter
              }
              onChange={(
                event,
              ) =>
                setTransactionFilter(
                  event.target
                    .value,
                )
              }
            >
              <option value="all">
                All statuses
              </option>
              <option value="success">
                Success
              </option>
              <option value="pending">
                Pending
              </option>
              <option value="failed">
                Failed
              </option>
            </Select>
          </div>
        </Card>

        <Card
          className="
            mt-5
            overflow-hidden
          "
        >
          {filteredTransactions.length ===
          0 ? (
            <div className="p-5">
              <EmptyState
                title="No transactions found"
                message="There are no transactions matching your filters."
              />
            </div>
          ) : (
            <div
              className="
                overflow-x-auto
              "
            >
              <table
                className="
                  w-full
                  min-w-[900px]
                  text-left
                "
              >
                <thead>
                  <tr
                    className="
                      border-b
                      border-slate-100
                      bg-slate-50
                      text-[10px]
                      font-black
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    <th className="px-5 py-4">
                      Customer
                    </th>

                    <th className="px-5 py-4">
                      Service
                    </th>

                    <th className="px-5 py-4">
                      Amount
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Reference
                    </th>

                    <th className="px-5 py-4">
                      Date
                    </th>

                    <th className="px-5 py-4 text-right">
                      View
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map(
                    (
                      transaction,
                    ) => (
                      <tr
                        key={
                          transaction.id
                        }
                        className="
                          border-b
                          border-slate-50
                          last:border-0
                          hover:bg-slate-50/70
                        "
                      >
                        <td className="px-5 py-4">
                          <span
                            className="
                              text-xs
                              font-bold
                              text-slate-800
                            "
                          >
                            {
                              transaction.phone ||
                              '—'
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p
                            className="
                              text-xs
                              font-bold
                              text-slate-700
                            "
                          >
                            {
                              transaction.service ||
                              transaction.type ||
                              '—'
                            }
                          </p>

                          <p
                            className="
                              mt-0.5
                              text-[9px]
                              text-slate-400
                            "
                          >
                            {
                              transaction.product ||
                              '—'
                            }
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className="
                              text-xs
                              font-black
                              text-slate-900
                            "
                          >
                            {money(
                              transaction.amount,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            status={
                              transaction.status
                            }
                          />
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className="
                              text-[10px]
                              font-medium
                              text-slate-500
                            "
                          >
                            {
                              transaction.reference ||
                              '—'
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className="
                              text-[10px]
                              text-slate-500
                            "
                          >
                            {formatDate(
                              transaction.created_at,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedTransaction(
                                  transaction,
                                )
                              }
                              className="
                                rounded-lg
                                border
                                border-slate-200
                                bg-white
                                p-2
                                text-slate-500
                                hover:bg-slate-50
                                hover:text-[#071a41]
                              "
                            >
                              <Eye
                                size={15}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | REVENUE SECTION
  |--------------------------------------------------------------------------
  */

  const RevenueSection =
    () => (
      <div>
        <SectionTitle
          title="Revenue"
          subtitle="Overview of successful transaction volume."
          action={
            <Button
              kind="light"
              onClick={() =>
                void loadTransactions()
              }
            >
              <RefreshCw
                size={15}
              />
              Refresh
            </Button>
          }
        />

        <div
          className="
            grid
            grid-cols-1
            gap-4
            md:grid-cols-3
          "
        >
          <StatCard
            title="Successful Volume"
            value={money(
              transactionRevenue,
            )}
            icon={
              <TrendingUp
                size={21}
              />
            }
            iconClass="
              bg-emerald-50
              text-emerald-700
            "
            loading={loading}
          />

          <StatCard
            title="Successful Transactions"
            value={String(
              successfulTransactions.length,
            )}
            icon={
              <CheckCircle2
                size={21}
              />
            }
            iconClass="
              bg-blue-50
              text-blue-700
            "
            loading={loading}
          />

          <StatCard
            title="Pending Funding"
            value={money(
              pendingFundingAmount,
            )}
            icon={
              <Clock3
                size={21}
              />
            }
            iconClass="
              bg-orange-50
              text-orange-700
            "
            loading={loading}
          />
        </div>

        <Card
          className="
            mt-5
            p-6
          "
        >
          <h3
            className="
              text-sm
              font-black
              text-[#071a41]
            "
          >
            Service Revenue
          </h3>

          <div
            className="
              mt-5
              grid
              grid-cols-1
              gap-3
              sm:grid-cols-2
              lg:grid-cols-3
          "
          >
            {SERVICES.map(
              (service) => {
                const amount =
                  successfulTransactions
                    .filter(
                      (
                        transaction,
                      ) =>
                        String(
                          transaction.service ||
                            '',
                        ).toLowerCase() ===
                        service.key,
                    )
                    .reduce(
                      (
                        sum,
                        transaction,
                      ) =>
                        sum +
                        numberValue(
                          transaction.amount,
                        ),
                      0,
                    );

                return (
                  <div
                    key={
                      service.key
                    }
                    className="
                      rounded-2xl
                      border
                      border-slate-100
                      bg-slate-50
                      p-4
                    "
                  >
                    <div
                      className="
                        flex
                        items-center
                        gap-3
                      "
                    >
                      <div
                        className="
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-xl
                          bg-white
                          text-[#071a41]
                          shadow-sm
                        "
                      >
                        {
                          service.icon
                        }
                      </div>

                      <div>
                        <p
                          className="
                            text-xs
                            font-black
                            text-slate-800
                          "
                        >
                          {
                            service.label
                          }
                        </p>

                        <p
                          className="
                            mt-0.5
                            text-[9px]
                            text-slate-400
                          "
                        >
                          Successful volume
                        </p>
                      </div>
                    </div>

                    <p
                      className="
                        mt-4
                        text-lg
                        font-black
                        text-slate-900
                      "
                    >
                      {money(
                        amount,
                      )}
                    </p>
                  </div>
                );
              },
            )}
          </div>
        </Card>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | FUNDING SECTION
  |--------------------------------------------------------------------------
  */

  const FundingSection =
    () => (
      <div>
        <SectionTitle
          title="Funding Requests"
          subtitle="Approve or reject customer funding requests."
          action={
            <Button
              kind="light"
              onClick={() =>
                void loadFundingRequests()
              }
            >
              <RefreshCw
                size={15}
              />
              Refresh
            </Button>
          }
        />

        <Card
          className="p-4"
        >
          <div
            className="
              grid
              grid-cols-1
              gap-3
              md:grid-cols-[1fr_200px]
            "
          >
            <div
              className="
                relative
              "
            >
              <Search
                size={16}
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                value={
                  fundingSearch
                }
                onChange={(
                  event,
                ) =>
                  setFundingSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search funding requests..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  py-3
                  pl-10
                  pr-4
                  text-xs
                  outline-none
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-50
                "
              />
            </div>

            <Select
              label="Status"
              value={
                fundingFilter
              }
              onChange={(
                event,
              ) =>
                setFundingFilter(
                  event.target
                    .value,
                )
              }
            >
              <option value="all">
                All statuses
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="approved">
                Approved
              </option>

              <option value="rejected">
                Rejected
              </option>
            </Select>
          </div>
        </Card>

        <Card
          className="
            mt-5
            overflow-hidden
          "
        >
          {filteredFunding.length ===
          0 ? (
            <div className="p-5">
              <EmptyState
                title="No funding requests"
                message="Funding requests will appear here."
              />
            </div>
          ) : (
            <div
              className="
                overflow-x-auto
              "
            >
              <table
                className="
                  w-full
                  min-w-[850px]
                  text-left
                "
              >
                <thead>
                  <tr
                    className="
                      border-b
                      border-slate-100
                      bg-slate-50
                      text-[10px]
                      font-black
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    <th className="px-5 py-4">
                      Customer
                    </th>

                    <th className="px-5 py-4">
                      Amount
                    </th>

                    <th className="px-5 py-4">
                      Reason
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Date
                    </th>

                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredFunding.map(
                    (
                      request,
                    ) => {
                      const pending =
                        String(
                          request.status ||
                            '',
                        ).toLowerCase() ===
                        'pending';

                      return (
                        <tr
                          key={
                            request.id
                          }
                          className="
                            border-b
                            border-slate-50
                            last:border-0
                            hover:bg-slate-50/70
                          "
                        >
                          <td className="px-5 py-4">
                            <span
                              className="
                                text-xs
                                font-black
                                text-slate-800
                              "
                            >
                              {
                                request.phone ||
                                '—'
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className="
                                text-xs
                                font-black
                                text-slate-900
                              "
                            >
                              {money(
                                request.amount,
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div>
                              <p
                                className="
                                  max-w-[250px]
                                  truncate
                                  text-xs
                                  font-medium
                                  text-slate-700
                                "
                              >
                                {
                                  request.reason ||
                                  request.notes ||
                                  '—'
                                }
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={
                                request.status
                              }
                            />
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className="
                                text-[10px]
                                text-slate-500
                              "
                            >
                              {formatDate(
                                request.created_at,
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div
                              className="
                                flex
                                justify-end
                                gap-2
                              "
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedFunding(
                                    request,
                                  )
                                }
                                className="
                                  rounded-lg
                                  border
                                  border-slate-200
                                  bg-white
                                  p-2
                                  text-slate-500
                                  hover:bg-slate-50
                                "
                              >
                                <Eye
                                  size={15}
                                />
                              </button>

                              {pending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleApproveFunding(
                                        request,
                                      )
                                    }
                                    disabled={
                                      actionLoading
                                    }
                                    className="
                                      rounded-lg
                                      bg-emerald-600
                                      p-2
                                      text-white
                                      hover:bg-emerald-700
                                      disabled:opacity-50
                                    "
                                    title="Approve"
                                  >
                                    <Check
                                      size={15}
                                    />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleRejectFunding(
                                        request,
                                      )
                                    }
                                    disabled={
                                      actionLoading
                                    }
                                    className="
                                      rounded-lg
                                      bg-red-600
                                      p-2
                                      text-white
                                      hover:bg-red-700
                                      disabled:opacity-50
                                    "
                                    title="Reject"
                                  >
                                    <X
                                      size={15}
                                    />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | SERVICES SECTION
  |--------------------------------------------------------------------------
  */

  const ServicesSection =
    () => (
      <div>
        <SectionTitle
          title="Services"
          subtitle="Manage service products, prices and availability."
          action={
            <Button
              kind="dark"
              onClick={() => {
                setEditingProduct(
                  null,
                );

                setProductForm({
                  service: 'data',
                  name: '',
                  price: '',
                  network: '',
                  description:
                    '',
                  category: '',
                  cashback_percent:
                    '',
                  is_active: true,
                });
              }}
            >
              <Plus
                size={15}
              />
              Add Product
            </Button>
          }
        />

        <Card
          className="p-4"
        >
          <div
            className="
              flex
              flex-col
              gap-3
              md:flex-row
            "
          >
            <div
              className="
                relative
                flex-1
              "
            >
              <Search
                size={16}
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                value={search}
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search products..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  py-3
                  pl-10
                  pr-4
                  text-xs
                  outline-none
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-50
                "
              />
            </div>

            <select
              value={
                serviceFilter
              }
              onChange={(
                event,
              ) =>
                setServiceFilter(
                  event.target
                    .value as
                    | ServiceKey
                    | 'all',
                )
              }
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-3
                text-xs
                font-bold
                outline-none
                focus:border-blue-500
              "
            >
              <option value="all">
                All Services
              </option>

              {SERVICES.map(
                (service) => (
                  <option
                    key={
                      service.key
                    }
                    value={
                      service.key
                    }
                  >
                    {
                      service.label
                    }
                  </option>
                ),
              )}
            </select>
          </div>
        </Card>

        <div
          className="
            mt-5
            grid
            grid-cols-1
            gap-4
            md:grid-cols-2
            xl:grid-cols-3
          "
        >
          {filteredProducts.map(
            (product) => (
              <Card
                key={
                  product.id
                }
                className="p-5"
              >
                <div
                  className="
                    flex
                    items-start
                    justify-between
                    gap-3
                  "
                >
                  <div>
                    <p
                      className="
                        text-[10px]
                        font-black
                        uppercase
                        tracking-wider
                        text-blue-600
                      "
                    >
                      {
                        SERVICE_LABELS[
                          product.service as ServiceKey
                        ] ||
                        product.service
                      }
                    </p>

                    <h3
                      className="
                        mt-1
                        text-sm
                        font-black
                        text-slate-800
                      "
                    >
                      {
                        product.name
                      }
                    </h3>
                  </div>

                  <StatusBadge
                    status={
                      product.is_active
                        ? 'active'
                        : 'inactive'
                    }
                  />
                </div>

                <p
                  className="
                    mt-4
                    text-xl
                    font-black
                    text-[#071a41]
                  "
                >
                  {money(
                    product.price,
                  )}
                </p>

                <div
                  className="
                    mt-3
                    flex
                    flex-wrap
                    gap-2
                  "
                >
                  {product.network && (
                    <span
                      className="
                        rounded-lg
                        bg-slate-100
                        px-2
                        py-1
                        text-[9px]
                        font-bold
                        text-slate-600
                      "
                    >
                      {
                        product.network
                      }
                    </span>
                  )}

                  {product.category && (
                    <span
                      className="
                        rounded-lg
                        bg-slate-100
                        px-2
                        py-1
                        text-[9px]
                        font-bold
                        text-slate-600
                      "
                    >
                      {
                        product.category
                      }
                    </span>
                  )}
                </div>

                <div
                  className="
                    mt-5
                    flex
                    gap-2
                  "
                >
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(
                        product,
                      );

                      setProductForm({
                        service:
                          product.service,
                        name:
                          product.name,
                        price:
                          String(
                            product.price,
                          ),
                        network:
                          product.network ||
                          '',
                        description:
                          product.description ||
                          '',
                        category:
                          product.category ||
                          '',
                        cashback_percent:
                          String(
                            product.cashback_percent ||
                              0,
                          ),
                        is_active:
                          product.is_active,
                      });
                    }}
                    className="
                      flex-1
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-3
                      py-2.5
                      text-[10px]
                      font-black
                      text-slate-700
                      hover:bg-slate-50
                    "
                  >
                    <Edit3
                      size={14}
                      className="mr-1 inline"
                    />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handleToggleProduct(
                        product,
                      )
                    }
                    disabled={
                      productLoading
                    }
                    className="
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-3
                      py-2.5
                      text-[10px]
                      font-black
                      text-slate-700
                      hover:bg-slate-50
                      disabled:opacity-50
                    "
                  >
                    {product.is_active
                      ? 'Disable'
                      : 'Enable'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handleDeleteProduct(
                        product,
                      )
                    }
                    disabled={
                      productLoading
                    }
                    className="
                      rounded-xl
                      bg-red-50
                      px-3
                      py-2.5
                      text-red-600
                      hover:bg-red-100
                      disabled:opacity-50
                    "
                  >
                    <Trash2
                      size={14}
                    />
                  </button>
                </div>
              </Card>
            ),
          )}
        </div>

        {filteredProducts.length ===
          0 && (
          <div className="mt-5">
            <EmptyState
              title="No products found"
              message="Add a product or change your filters."
            />
          </div>
        )}
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | ADMINS SECTION
  |--------------------------------------------------------------------------
  */

  const AdminsSection =
    () => (
      <div>
        <SectionTitle
          title="Admins"
          subtitle="Review accounts with administrative privileges."
        />

        <Card
          className="
            overflow-hidden
          "
        >
          {users.filter(
            (user) =>
              user.is_admin,
          ).length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No admins found"
                message="There are currently no admin users returned by the API."
              />
            </div>
          ) : (
            <div
              className="
                overflow-x-auto
              "
            >
              <table
                className="
                  w-full
                  min-w-[700px]
                  text-left
                "
              >
                <thead>
                  <tr
                    className="
                      border-b
                      border-slate-100
                      bg-slate-50
                      text-[10px]
                      font-black
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    <th className="px-5 py-4">
                      Name
                    </th>

                    <th className="px-5 py-4">
                      Phone
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Joined
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users
                    .filter(
                      (
                        user,
                      ) =>
                        user.is_admin,
                    )
                    .map(
                      (user) => (
                        <tr
                          key={
                            user.id
                          }
                          className="
                            border-b
                            border-slate-50
                            last:border-0
                          "
                        >
                          <td className="px-5 py-4">
                            <span
                              className="
                                text-xs
                                font-black
                                text-slate-800
                              "
                            >
                              {getUserName(
                                user,
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className="
                                text-xs
                                font-medium
                                text-slate-600
                              "
                            >
                              {
                                user.phone
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={
                                user.is_active ===
                                false
                                  ? 'inactive'
                                  : 'active'
                              }
                            />
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className="
                                text-[10px]
                                text-slate-500
                              "
                            >
                              {formatDate(
                                user.created_at,
                              )}
                            </span>
                          </td>
                        </tr>
                      ),
                    )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | SECURITY SECTION
  |--------------------------------------------------------------------------
  */

  const SecuritySection =
    () => (
      <div>
        <SectionTitle
          title="Security"
          subtitle="Super admin session and platform security controls."
        />

        <div
          className="
            grid
            grid-cols-1
            gap-5
            md:grid-cols-2
          "
        >
          <Card
            className="p-6"
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-emerald-50
                  text-emerald-700
                "
              >
                <ShieldCheck
                  size={21}
                />
              </div>

              <div>
                <h3
                  className="
                    text-sm
                    font-black
                    text-slate-800
                  "
                >
                  Super Admin Session
                </h3>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    text-slate-500
                  "
                >
                  Protected dashboard session
                </p>
              </div>
            </div>

            <div
              className="
                mt-5
                rounded-xl
                bg-slate-50
                p-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >
                <span
                  className="
                    text-xs
                    font-bold
                    text-slate-600
                  "
                >
                  Session token
                </span>

                <span
                  className="
                    rounded-full
                    bg-emerald-100
                    px-2.5
                    py-1
                    text-[9px]
                    font-black
                    text-emerald-700
                  "
                >
                  Active
                </span>
              </div>
            </div>
          </Card>

          <Card
            className="p-6"
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-blue-50
                  text-blue-700
                "
              >
                <Database
                  size={21}
                />
              </div>

              <div>
                <h3
                  className="
                    text-sm
                    font-black
                    text-slate-800
                  "
                >
                  Supabase
                </h3>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    text-slate-500
                  "
                >
                  Database connection
                </p>
              </div>
            </div>

            <div
              className="
                mt-5
                rounded-xl
                bg-slate-50
                p-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >
                <span
                  className="
                    text-xs
                    font-bold
                    text-slate-600
                  "
                >
                  Client
                </span>

                <span
                  className="
                    rounded-full
                    bg-blue-100
                    px-2.5
                    py-1
                    text-[9px]
                    font-black
                    text-blue-700
                  "
                >
                  Connected
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | NOTIFICATIONS SECTION
  |--------------------------------------------------------------------------
  */

  const NotificationsSection =
    () => (
      <div>
        <SectionTitle
          title="Notifications"
          subtitle="Send platform notifications to customers."
        />

        <div
          className="
            grid
            grid-cols-1
            gap-5
            lg:grid-cols-3
          "
        >
          <Card
            className="
              p-6
              lg:col-span-2
            "
          >
            <div
              className="
                grid
                grid-cols-1
                gap-4
              "
            >
              <Input
                label="Title"
                value={
                  notificationForm.title
                }
                onChange={(
                  event,
                ) =>
                  setNotificationForm(
                    (
                      current,
                    ) => ({
                      ...current,
                      title:
                        event.target
                          .value,
                    }),
                  )
                }
                placeholder="Notification title"
              />

              <label className="block">
                <span
                  className="
                    mb-2
                    block
                    text-xs
                    font-bold
                    text-slate-600
                  "
                >
                  Message
                </span>

                <textarea
                  value={
                    notificationForm.message
                  }
                  onChange={(
                    event,
                  ) =>
                    setNotificationForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        message:
                          event.target
                            .value,
                      }),
                    )
                  }
                  rows={5}
                  placeholder="Write notification message..."
                  className="
                    w-full
                    resize-none
                    rounded-xl
                    border
                    border-slate-200
                    px-4
                    py-3
                    text-sm
                    outline-none
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-50
                  "
                />
              </label>

              <Select
                label="Type"
                value={
                  notificationForm.type
                }
                onChange={(
                  event,
                ) =>
                  setNotificationForm(
                    (
                      current,
                    ) => ({
                      ...current,
                      type:
                        event.target
                          .value,
                    }),
                  )
                }
              >
                <option value="info">
                  Info
                </option>

                <option value="success">
                  Success
                </option>

                <option value="warning">
                  Warning
                </option>

                <option value="error">
                  Error
                </option>
              </Select>

              <div className="pt-2">
                <Button
                  kind="dark"
                  onClick={() =>
                    void handleSendNotification()
                  }
                  disabled={
                    notificationLoading
                  }
                >
                  {notificationLoading ? (
                    <>
                      <RefreshCw
                        size={15}
                        className="animate-spin"
                      />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Bell
                        size={15}
                      />
                      Send Notification
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          <Card
            className="p-5"
          >
            <h3
              className="
                text-sm
                font-black
                text-[#071a41]
              "
            >
              Recent Notifications
            </h3>

            <div
              className="
                mt-4
                space-y-3
              "
            >
              {notifications
                .slice(
                  0,
                  8,
                )
                .map(
                  (
                    notification,
                  ) => (
                    <div
                      key={
                        notification.id
                      }
                      className="
                        rounded-xl
                        bg-slate-50
                        p-3
                      "
                    >
                      <p
                        className="
                          text-xs
                          font-black
                          text-slate-800
                        "
                      >
                        {
                          notification.title
                        }
                      </p>

                      <p
                        className="
                          mt-1
                          line-clamp-2
                          text-[10px]
                          leading-4
                          text-slate-500
                        "
                      >
                        {
                          notification.message
                        }
                      </p>

                      <p
                        className="
                          mt-2
                          text-[9px]
                          text-slate-400
                        "
                      >
                        {formatDate(
                          notification.created_at,
                        )}
                      </p>
                    </div>
                  ),
                )}

              {notifications.length ===
                0 && (
                <p
                  className="
                    py-8
                    text-center
                    text-xs
                    text-slate-400
                  "
                >
                  No notifications yet.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | SETTINGS SECTION
  |--------------------------------------------------------------------------
  */

  const SettingsSection =
    () => (
      <div>
        <SectionTitle
          title="Settings"
          subtitle="Dashboard and account controls."
        />

        <div
          className="
            grid
            grid-cols-1
            gap-5
            md:grid-cols-2
          "
        >
          <Card
            className="p-6"
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-blue-50
                  text-blue-700
                "
              >
                <Settings
                  size={21}
                />
              </div>

              <div>
                <h3
                  className="
                    text-sm
                    font-black
                    text-slate-800
                  "
                >
                  Dashboard
                </h3>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    text-slate-500
                  "
                >
                  Current dashboard configuration
                </p>
              </div>
            </div>

            <div
              className="
                mt-5
                space-y-3
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  rounded-xl
                  bg-slate-50
                  p-4
                "
              >
                <span
                  className="
                    text-xs
                    font-bold
                    text-slate-600
                  "
                >
                  Services
                </span>

                <span
                  className="
                    text-xs
                    font-black
                    text-slate-900
                  "
                >
                  {SERVICES.length}
                </span>
              </div>

              <div
                className="
                  flex
                  items-center
                  justify-between
                  rounded-xl
                  bg-slate-50
                  p-4
                "
              >
                <span
                  className="
                    text-xs
                    font-bold
                    text-slate-600
                  "
                >
                  Products
                </span>

                <span
                  className="
                    text-xs
                    font-black
                    text-slate-900
                  "
                >
                  {
                    products.length
                  }
                </span>
              </div>
            </div>
          </Card>

          <Card
            className="p-6"
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-red-50
                  text-red-600
                "
              >
                <LogOut
                  size={21}
                />
              </div>

              <div>
                <h3
                  className="
                    text-sm
                    font-black
                    text-slate-800
                  "
                >
                  Sign Out
                </h3>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    text-slate-500
                  "
                >
                  End the current Super Admin session.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <Button
                kind="red"
                onClick={
                  handleLogout
                }
              >
                <LogOut
                  size={15}
                />
                Logout
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | SECTION RENDER
  |--------------------------------------------------------------------------
  */

  const renderSection =
    () => {
      switch (
        section
      ) {
        case 'overview':
          return (
            <OverviewSection />
          );

        case 'users':
          return (
            <UsersSection />
          );

        case 'wallet':
          return (
            <WalletSection />
          );

        case 'transactions':
          return (
            <TransactionsSection />
          );

        case 'revenue':
          return (
            <RevenueSection />
          );

        case 'funding':
          return (
            <FundingSection />
          );

        case 'services':
          return (
            <ServicesSection />
          );

        case 'admins':
          return (
            <AdminsSection />
          );

        case 'security':
          return (
            <SecuritySection />
          );

        case 'notifications':
          return (
            <NotificationsSection />
          );

        case 'settings':
          return (
            <SettingsSection />
          );

        default:
          return (
            <OverviewSection />
          );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | LAYOUT
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className="
        min-h-screen
        bg-slate-50
        text-slate-900
      "
    >
      <Notice
        notice={notice}
        onClose={() =>
          setNotice(null)
        }
      />

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() =>
            setSidebarOpen(
              false,
            )
          }
          className="
            fixed
            inset-0
            z-40
            bg-black/40
            lg:hidden
          "
        />
      )}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          w-64
          bg-[#071a41]
          text-white
          transition-transform
          duration-300
          lg:translate-x-0
          ${
            sidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }
        `}
      >
        <div
          className="
            flex
            h-20
            items-center
            justify-between
            border-b
            border-white/10
            px-5
          "
        >
          <div>
            <p
              className="
                text-lg
                font-black
              "
            >
              GY DATA
            </p>

            <p
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-[0.25em]
                text-blue-200
              "
            >
              Super Admin
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(
                false,
              )
            }
            className="
              rounded-lg
              p-2
              text-white/70
              hover:bg-white/10
              lg:hidden
            "
          >
            <X size={18} />
          </button>
        </div>

        <nav
          className="
            h-[calc(100vh-5rem)]
            overflow-y-auto
            p-3
          "
        >
          <div className="space-y-1">
            {navigationItems.map(
              (item) => {
                const active =
                  section ===
                  item.key;

                return (
                  <button
                    key={
                      item.key
                    }
                    type="button"
                    onClick={() => {
                      setSection(
                        item.key,
                      );
                      setSidebarOpen(
                        false,
                      );
                    }}
                    className={`
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-3
                      text-left
                      text-xs
                      font-bold
                      transition
                      ${
                        active
                          ? 'bg-white text-[#071a41]'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    {
                      item.icon
                    }

                    <span>
                      {
                        item.label
                      }
                    </span>

                    {item.key ===
                      'funding' &&
                      pendingFunding.length >
                        0 && (
                        <span
                          className="
                            ml-auto
                            flex
                            h-5
                            min-w-5
                            items-center
                            justify-center
                            rounded-full
                            bg-orange-500
                            px-1
                            text-[9px]
                            font-black
                            text-white
                          "
                        >
                          {
                            pendingFunding.length
                          }
                        </span>
                      )}
                  </button>
                );
              },
            )}
          </div>

          <div
            className="
              mt-6
              border-t
              border-white/10
              pt-4
            "
          >
            <button
              type="button"
              onClick={
                handleLogout
              }
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                px-3
                py-3
                text-xs
                font-bold
                text-red-200
                transition
                hover:bg-red-500/10
                hover:text-red-100
              "
            >
              <LogOut
                size={18}
              />
              Logout
            </button>
          </div>
        </nav>
      </aside>

      <main
        className="
          min-h-screen
          lg:pl-64
        "
      >
        <header
          className="
            sticky
            top-0
            z-30
            flex
            h-20
            items-center
            justify-between
            border-b
            border-slate-200
            bg-white/95
            px-4
            backdrop-blur
            sm:px-6
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <button
              type="button"
              onClick={() =>
                setSidebarOpen(
                  true,
                )
              }
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                p-2.5
                text-slate-600
                hover:bg-slate-50
                lg:hidden
              "
            >
              <Menu
                size={19}
              />
            </button>

            <div>
              <h1
                className="
                  text-lg
                  font-black
                  text-[#071a41]
                "
              >
                {
                  navigationItems.find(
                    (
                      item,
                    ) =>
                      item.key ===
                      section,
                  )?.label ||
                  'Overview'
                }
              </h1>

              <p
                className="
                  hidden
                  text-[10px]
                  font-medium
                  text-slate-400
                  sm:block
                "
              >
                Super Admin Control Panel
              </p>
            </div>
          </div>

          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <button
              type="button"
              onClick={() =>
                void loadDashboard(
                  true,
                )
              }
              disabled={
                refreshing
              }
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                p-2.5
                text-slate-500
                hover:bg-slate-50
              "
              title="Refresh"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? 'animate-spin'
                    : ''
                }
              />
            </button>

            <button
              type="button"
              onClick={() =>
                setSection(
                  'notifications',
                )
              }
              className="
                relative
                rounded-xl
                border
                border-slate-200
                bg-white
                p-2.5
                text-slate-500
                hover:bg-slate-50
              "
              title="Notifications"
            >
              <Bell
                size={17}
              />

              {notifications.length >
                0 && (
                <span
                  className="
                    absolute
                    right-1
                    top-1
                    h-2
                    w-2
                    rounded-full
                    bg-orange-500
                  "
                />
              )}
            </button>

            <div
              className="
                hidden
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-[#071a41]
                text-xs
                font-black
                text-white
                sm:flex
              "
            >
              SA
            </div>
          </div>
        </header>

        <div
          className="
            mx-auto
            max-w-[1600px]
            p-4
            sm:p-6
          "
        >
          {loading ? (
            <div
              className="
                flex
                min-h-[60vh]
                items-center
                justify-center
              "
            >
              <div
                className="
                  text-center
                "
              >
                <RefreshCw
                  size={28}
                  className="
                    mx-auto
                    animate-spin
                    text-[#071a41]
                  "
                />

                <p
                  className="
                    mt-3
                    text-xs
                    font-bold
                    text-slate-500
                  "
                >
                  Loading Super Admin Dashboard...
                </p>
              </div>
            </div>
          ) : (
            renderSection()
          )}
        </div>
      </main>


      {/* ------------------------------------------------------------------ */}
      {/* USER DETAILS MODAL                                                 */}
      {/* ------------------------------------------------------------------ */}

      {selectedUser && (
        <div
          className="
            fixed
            inset-0
            z-[80]
            flex
            items-center
            justify-center
            bg-black/50
            p-4
          "
        >
          <div
            className="
              max-h-[90vh]
              w-full
              max-w-lg
              overflow-y-auto
              rounded-3xl
              bg-white
              shadow-2xl
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-slate-100
                px-6
                py-5
              "
            >
              <div>
                <h3
                  className="
                    text-base
                    font-black
                    text-[#071a41]
                  "
                >
                  User Details
                </h3>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    text-slate-400
                  "
                >
                  Customer account information
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedUser(
                    null,
                  )
                }
                className="
                  rounded-xl
                  bg-slate-100
                  p-2
                  text-slate-500
                  hover:bg-slate-200
                "
              >
                <X
                  size={17}
                />
              </button>
            </div>

            <div
              className="
                space-y-4
                p-6
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-4
                  rounded-2xl
                  bg-slate-50
                  p-4
                "
              >
                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-full
                    bg-[#071a41]
                    text-sm
                    font-black
                    text-white
                  "
                >
                  {getUserName(
                    selectedUser,
                  )
                    .slice(
                      0,
                      1,
                    )
                    .toUpperCase()}
                </div>

                <div>
                  <p
                    className="
                      text-sm
                      font-black
                      text-slate-800
                    "
                  >
                    {getUserName(
                      selectedUser,
                    )}
                  </p>

                  <p
                    className="
                      mt-0.5
                      text-xs
                      text-slate-500
                    "
                  >
                    {
                      selectedUser.phone
                    }
                  </p>
                </div>
              </div>

              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                "
              >
                <div
                  className="
                    rounded-2xl
                    bg-slate-50
                    p-4
                  "
                >
                  <p
                    className="
                      text-[9px]
                      font-black
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    Wallet
                  </p>

                  <p
                    className="
                      mt-1
                      text-lg
                      font-black
                      text-[#071a41]
                    "
                  >
                    {money(
                      selectedUser.wallet_balance,
                    )}
                  </p>
                </div>

                <div
                  className="
                    rounded-2xl
                    bg-slate-50
                    p-4
                  "
                >
                  <p
                    className="
                      text-[9px]
                      font-black
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    Status
                  </p>

                  <div className="mt-2">
                    <StatusBadge
                      status={
                        selectedUser.is_active ===
                        false
                          ? 'inactive'
                          : 'active'
                      }
                    />
                  </div>
                </div>
              </div>

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-100
                  p-4
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >
                  <span
                    className="
                      text-xs
                      font-bold
                      text-slate-500
                    "
                  >
                    Email
                  </span>

                  <span
                    className="
                      text-xs
                      font-bold
                      text-slate-800
                    "
                  >
                    {
                      selectedUser.email ||
                      '—'
                    }
                  </span>
                </div>

                <div
                  className="
                    mt-3
                    flex
                    items-center
                    justify-between
                  "
                >
                  <span
                    className="
                      text-xs
                      font-bold
                      text-slate-500
                    "
                  >
                    Joined
                  </span>

                  <span
                    className="
                      text-xs
                      font-bold
                      text-slate-800
                    "
                  >
                    {formatDate(
                      selectedUser.created_at,
                    )}
                  </span>
                </div>

                <div
                  className="
                    mt-3
                    flex
                    items-center
                    justify-between
                  "
                >
                  <span
                    className="
                      text-xs
                      font-bold
                      text-slate-500
                    "
                  >
                    Admin
                  </span>

                  <span
                    className="
                      text-xs
                      font-bold
                      text-slate-800
                    "
                  >
                    {selectedUser.is_admin
                      ? 'Yes'
                      : 'No'}
                  </span>
                </div>
              </div>

              <div
                className="
                  flex
                  gap-3
                "
              >
                <Button
                  kind="dark"
                  onClick={() => {
                    setWalletPhone(
                      selectedUser.phone,
                    );
                    setSelectedUser(
                      null,
                    );
                    setSection(
                      'wallet',
                    );
                  }}
                >
                  <Wallet
                    size={15}
                  />
                  Adjust Wallet
                </Button>

                <Button
                  kind="light"
                  onClick={() =>
                    setSelectedUser(
                      null,
                    )
                  }
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ------------------------------------------------------------------ */}
      {/* TRANSACTION DETAILS MODAL                                          */}
      {/* ------------------------------------------------------------------ */}

      {selectedTransaction && (
        <div
          className="
            fixed
            inset-0
            z-[80]
            flex
            items-center
            justify-center
            bg-black/50
            p-4
          "
        >
          <div
            className="
              max-h-[90vh]
              w-full
              max-w-lg
              overflow-y-auto
              rounded-3xl
              bg-white
              shadow-2xl
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-slate-100
                px-6
                py-5
              "
            >
              <div>
                <h3
                  className="
                    text-base
                    font-black
                    text-[#071a41]
                  "
                >
                  Transaction Details
                </h3>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    text-slate-400
                  "
                >
                  Complete transaction information
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedTransaction(
                    null,
                  )
                }
                className="
                  rounded-xl
                  bg-slate-100
                  p-2
                  text-slate-500
                "
              >
                <X
                  size={17}
                />
              </button>
            </div>

            <div
              className="
                space-y-3
                p-6
              "
            >
              <div
                className="
                  rounded-2xl
                  bg-[#071a41]
                  p-5
                  text-white
                "
              >
                <p
                  className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-wider
                    text-white/60
                  "
                >
                  Amount
                </p>

                <p
                  className="
                    mt-1
                    text-3xl
                    font-black
                  "
                >
                  {money(
                    selectedTransaction.amount,
                  )}
                </p>

                <div className="mt-3">
                  <StatusBadge
                    status={
                      selectedTransaction.status
                    }
                  />
                </div>
              </div>

              {[
                [
                  'Customer',
                  selectedTransaction.phone,
                ],
                [
                  'Type',
                  selectedTransaction.type,
                ],
                [
                  'Service',
                  selectedTransaction.service,
                ],
                [
                  'Product',
                  selectedTransaction.product,
                ],
                [
                  'Recipient',
                  selectedTransaction.recipient,
                ],
                [
                  'Network',
                  selectedTransaction.network,
                ],
                [
                  'Reference',
                  selectedTransaction.reference,
                ],
                [
                  'Date',
                  formatDate(
                    selectedTransaction.created_at,
                  ),
                ],
              ].map(
                ([
                  label,
                  value,
                ]) => (
                  <div
                    key={
                      label
                    }
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                      rounded-xl
                      bg-slate-50
                      px-4
                      py-3
                    "
                  >
                    <span
                      className="
                        text-[10px]
                        font-bold
                        text-slate-400
                      "
                    >
                      {label}
                    </span>

                    <span
                      className="
                        max-w-[65%]
                        truncate
                        text-right
                        text-xs
                        font-black
                        text-slate-800
                      "
                    >
                      {value ||
                        '—'}
                    </span>
                  </div>
                ),
              )}

              <Button
                kind="light"
                onClick={() =>
                  setSelectedTransaction(
                    null,
                  )
                }
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* ------------------------------------------------------------------ */}
      {/* FUNDING DETAILS MODAL                                              */}
      {/* ------------------------------------------------------------------ */}

      {selectedFunding && (
        <div
          className="
            fixed
            inset-0
            z-[80]
            flex
            items-center
            justify-center
            bg-black/50
            p-4
          "
        >
          <div
            className="
              max-h-[90vh]
              w-full
              max-w-lg
              overflow-y-auto
              rounded-3xl
              bg-white
              shadow-2xl
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-slate-100
                px-6
                py-5
              "
            >
              <div>
                <h3
                  className="
                    text-base
                    font-black
                    text-[#071a41]
                  "
                >
                  Funding Request
                </h3>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    text-slate-400
                  "
                >
                  Review funding request
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedFunding(
                    null,
                  )
                }
                className="
                  rounded-xl
                  bg-slate-100
                  p-2
                  text-slate-500
                "
              >
                <X
                  size={17}
                />
              </button>
            </div>

            <div
              className="
                space-y-4
                p-6
              "
            >
              <div
                className="
                  rounded-2xl
                  bg-orange-50
                  p-5
                "
              >
                <p
                  className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-wider
                    text-orange-600
                  "
                >
                  Requested Amount
                </p>

                <p
                  className="
                    mt-1
                    text-3xl
                    font-black
                    text-orange-900
                  "
                >
                  {money(
                    selectedFunding.amount,
                  )}
                </p>
              </div>

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-100
                  p-4
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >
                  <span
                    className="
                      text-xs
                      font-bold
                      text-slate-500
                    "
                  >
                    Customer
                  </span>

                  <span
                    className="
                      text-xs
                      font-black
                      text-slate-800
                    "
                  >
                    {
                      selectedFunding.phone ||
                      '—'
                    }
                  </span>
                </div>

                <div
                  className="
                    mt-3
                    flex
                    items-center
                    justify-between
                  "
                >
                  <span
                    className="
                      text-xs
                      font-bold
                      text-slate-500
                    "
                  >
                    Status
                  </span>

                  <StatusBadge
                    status={
                      selectedFunding.status
                    }
                  />
                </div>

                <div
                  className="
                    mt-3
                    flex
                    items-center
                    justify-between
                    gap-4
                  "
                >
                  <span
                    className="
                      text-xs
                      font-bold
                      text-slate-500
                    "
                  >
                    Date
                  </span>

                  <span
                    className="
                      text-xs
                      font-bold
                      text-slate-800
                    "
                  >
                    {formatDate(
                      selectedFunding.created_at,
                    )}
                  </span>
                </div>

                <div
                  className="
                    mt-4
                    border-t
                    border-slate-100
                    pt-4
                  "
                >
                  <p
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    Reason / Notes
                  </p>

                  <p
                    className="
                      mt-2
                      text-xs
                      leading-5
                      text-slate-700
                    "
                  >
                    {
                      selectedFunding.reason ||
                      selectedFunding.notes ||
                      'No reason provided.'
                    }
                  </p>
                </div>
              </div>

              {String(
                selectedFunding.status ||
                  '',
              ).toLowerCase() ===
                'pending' && (
                <div
                  className="
                    grid
                    grid-cols-2
                    gap-3
                  "
                >
                  <Button
                    kind="green"
                    onClick={() =>
                      void handleApproveFunding(
                        selectedFunding,
                      )
                    }
                    disabled={
                      actionLoading
                    }
                  >
                    <Check
                      size={15}
                    />
                    Approve
                  </Button>

                  <Button
                    kind="red"
                    onClick={() =>
                      void handleRejectFunding(
                        selectedFunding,
                      )
                    }
                    disabled={
                      actionLoading
                    }
                  >
                    <X
                      size={15}
                    />
                    Reject
                  </Button>
                </div>
              )}

              <Button
                kind="light"
                onClick={() =>
                  setSelectedFunding(
                    null,
                  )
                }
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* ------------------------------------------------------------------ */}
      {/* PRODUCT EDIT MODAL                                                 */}
      {/* ------------------------------------------------------------------ */}

      {(editingProduct ||
        (
          section ===
            'services' &&
          productForm.name ===
            '' &&
          productForm.price ===
            '' &&
          productForm.service ===
            'data'
        )) && false}


      {/* ------------------------------------------------------------------ */}
      {/* ADD / EDIT PRODUCT MODAL                                           */}
      {/* ------------------------------------------------------------------ */}

      {section ===
        'services' &&
        (editingProduct ||
          productForm.name !==
            '' ||
          productForm.price !==
            '') && (
          <div
            className="
              fixed
              inset-0
              z-[80]
              flex
              items-center
              justify-center
              bg-black/50
              p-4
            "
          >
            <div
              className="
                max-h-[90vh]
                w-full
                max-w-2xl
                overflow-y-auto
                rounded-3xl
                bg-white
                shadow-2xl
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-b
                  border-slate-100
                  px-6
                  py-5
                "
              >
                <div>
                  <h3
                    className="
                      text-base
                      font-black
                      text-[#071a41]
                    "
                  >
                    {editingProduct
                      ? 'Edit Product'
                      : 'Add Product'}
                  </h3>

                  <p
                    className="
                      mt-0.5
                      text-[10px]
                      text-slate-400
                    "
                  >
                    Configure service product
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(
                      null,
                    );

                    setProductForm({
                      service:
                        'data',
                      name:
                        '',
                      price:
                        '',
                      network:
                        '',
                      description:
                        '',
                      category:
                        '',
                      cashback_percent:
                        '',
                      is_active:
                        true,
                    });
                  }}
                  className="
                    rounded-xl
                    bg-slate-100
                    p-2
                    text-slate-500
                  "
                >
                  <X
                    size={17}
                  />
                </button>
              </div>

              <div
                className="
                  grid
                  grid-cols-1
                  gap-4
                  p-6
                  md:grid-cols-2
                "
              >
                <Select
                  label="Service"
                  value={
                    productForm.service
                  }
                  onChange={(
                    event,
                  ) =>
                    setProductForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        service:
                          event.target
                            .value,
                      }),
                    )
                  }
                >
                  {SERVICES.map(
                    (
                      service,
                    ) => (
                      <option
                        key={
                          service.key
                        }
                        value={
                          service.key
                        }
                      >
                        {
                          service.label
                        }
                      </option>
                    ),
                  )}
                </Select>

                <Input
                  label="Product Name"
                  value={
                    productForm.name
                  }
                  onChange={(
                    event,
                  ) =>
                    setProductForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        name:
                          event.target
                            .value,
                      }),
                    )
                  }
                  placeholder="Product name"
                />

                <Input
                  label="Price"
                  value={
                    productForm.price
                  }
                  onChange={(
                    event,
                  ) =>
                    setProductForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        price:
                          cleanAmount(
                            event.target
                              .value,
                          ),
                      }),
                    )
                  }
                  placeholder="0"
                  inputMode="decimal"
                />

                <Input
                  label="Network"
                  value={
                    productForm.network
                  }
                  onChange={(
                    event,
                  ) =>
                    setProductForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        network:
                          event.target
                            .value,
                      }),
                    )
                  }
                  placeholder="Network"
                />

                <Input
                  label="Category"
                  value={
                    productForm.category
                  }
                  onChange={(
                    event,
                  ) =>
                    setProductForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        category:
                          event.target
                            .value,
                      }),
                    )
                  }
                  placeholder="Category"
                />

                <Input
                  label="Cashback %"
                  value={
                    productForm.cashback_percent
                  }
                  onChange={(
                    event,
                  ) =>
                    setProductForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        cashback_percent:
                          cleanAmount(
                            event.target
                              .value,
                          ),
                      }),
                    )
                  }
                  placeholder="0"
                  inputMode="decimal"
                />

                <label
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    border
                    border-slate-200
                    px-4
                    py-3
                    md:col-span-2
                  "
                >
                  <input
                    type="checkbox"
                    checked={
                      productForm.is_active
                    }
                    onChange={(
                      event,
                    ) =>
                      setProductForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          is_active:
                            event
                              .target
                              .checked,
                        }),
                      )
                    }
                    className="
                      h-4
                      w-4
                      rounded
                    "
                  />

                  <span
                    className="
                      text-xs
                      font-bold
                      text-slate-700
                    "
                  >
                    Product is active
                  </span>
                </label>

                <label
                  className="
                    block
                    md:col-span-2
                  "
                >
                  <span
                    className="
                      mb-2
                      block
                      text-xs
                      font-bold
                      text-slate-600
                    "
                  >
                    Description
                  </span>

                  <textarea
                    value={
                      productForm.description
                    }
                    onChange={(
                      event,
                    ) =>
                      setProductForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          description:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    rows={4}
                    placeholder="Product description"
                    className="
                      w-full
                      resize-none
                      rounded-xl
                      border
                      border-slate-200
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-50
                    "
                  />
                </label>

                <div
                  className="
                    flex
                    gap-3
                    md:col-span-2
                  "
                >
                  <Button
                    kind="dark"
                    onClick={() =>
                      void handleSaveProduct()
                    }
                    disabled={
                      productLoading
                    }
                  >
                    {productLoading ? (
                      <>
                        <RefreshCw
                          size={15}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check
                          size={15}
                        />
                        Save Product
                      </>
                    )}
                  </Button>

                  <Button
                    kind="light"
                    onClick={() => {
                      setEditingProduct(
                        null,
                      );

                      setProductForm({
                        service:
                          'data',
                        name:
                          '',
                        price:
                          '',
                        network:
                          '',
                        description:
                          '',
                        category:
                          '',
                        cashback_percent:
                          '',
                        is_active:
                          true,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
