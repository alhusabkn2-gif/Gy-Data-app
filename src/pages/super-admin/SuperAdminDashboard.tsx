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
        inputMode={inputMode}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="
          w-full
          rounded-xl
          border
          border-slate-200
          bg-slate-50
          px-4
          py-3
          text-sm
          text-slate-900
          outline-none
          transition
          focus:border-blue-500
          focus:bg-white
          focus:ring-4
          focus:ring-blue-500/10
        "
      />
    </label>
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
  ] =
    useState<Section>(
      'overview',
    );

  const [
    mobileMenu,
    setMobileMenu,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    notice,
    setNotice,
  ] =
    useState<NoticeState | null>(
      null,
    );

  const [
    users,
    setUsers,
  ] =
    useState<User[]>([]);

  const [
    transactions,
    setTransactions,
  ] =
    useState<Transaction[]>(
      [],
    );

  const [
    fundingRequests,
    setFundingRequests,
  ] =
    useState<
      FundingRequest[]
    >([]);

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>(
      [],
    );

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      NotificationItem[]
    >([]);

  const [
    adjustmentPhone,
    setAdjustmentPhone,
  ] =
    useState('');

  const [
    adjustmentAmount,
    setAdjustmentAmount,
  ] =
    useState('');

  const [
    adjustmentType,
    setAdjustmentType,
  ] =
    useState<
      'fund' | 'refund'
    >('fund');

  const [
    adjustmentReason,
    setAdjustmentReason,
  ] =
    useState('');

  const [
    adjustingWallet,
    setAdjustingWallet,
  ] =
    useState(false);

  const [
    walletBalance,
    setWalletBalance,
  ] =
    useState(0);

  const [
    clubBalance,
    setClubBalance,
  ] =
    useState<number | null>(
      null,
    );

  const [
    clubConnected,
    setClubConnected,
  ] =
    useState(false);

  const [
    clubLoading,
    setClubLoading,
  ] =
    useState(false);

  const [
    clubError,
    setClubError,
  ] =
    useState('');

  const [
    search,
    setSearch,
  ] =
    useState('');

  const [
    selectedUser,
    setSelectedUser,
  ] =
    useState<User | null>(
      null,
    );

  const [
    selectedProduct,
    setSelectedProduct,
  ] =
    useState<Product | null>(
      null,
    );

  const [
    productForm,
    setProductForm,
  ] =
    useState({
      name: '',
      service:
        'data' as ServiceKey,
      network: '',
      price: '',
      description: '',
      category: '',
      cashback_percent:
        '',
      is_active: true,
    });

  const [
    userForm,
    setUserForm,
  ] =
    useState({
      name: '',
      email: '',
      is_active: true,
      is_admin: false,
    });

  const [
    notificationForm,
    setNotificationForm,
  ] =
    useState({
      title: '',
      message: '',
      type: 'info',
    });

  const [
    maintenance,
    setMaintenance,
  ] =
    useState(false);

  const [
    showBalance,
    setShowBalance,
  ] =
    useState(true);

  const [
    savingProduct,
    setSavingProduct,
  ] =
    useState(false);

  const [
    savingUser,
    setSavingUser,
  ] =
    useState(false);

  const [
    sendingNotification,
    setSendingNotification,
  ] =
    useState(false);


  /*
  |--------------------------------------------------------------------------
  | NOTICE
  |--------------------------------------------------------------------------
  */

  const showNotice =
    useCallback(
      (
        message: string,
        type: NoticeType =
          'success',
      ) => {
        setNotice({
          message,
          type,
        });

        window.setTimeout(
          () =>
            setNotice(
              null,
            ),
          3500,
        );
      },
      [],
    );


  /*
  |--------------------------------------------------------------------------
  | AUTH GUARD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const token =
      getToken();

    const expiry =
      Number(
        localStorage.getItem(
          SUPER_ADMIN_SESSION_EXPIRY,
        ) || 0,
      );

    if (
      !token ||
      !expiry ||
      expiry <= Date.now()
    ) {
      localStorage.removeItem(
        SUPER_ADMIN_SESSION,
      );

      localStorage.removeItem(
        SUPER_ADMIN_SESSION_EXPIRY,
      );

      navigate(
        '/super-admin-login',
        {
          replace: true,
        },
      );
    }
  }, [
    navigate,
  ]);


  /*
  |--------------------------------------------------------------------------
  | LOAD USERS
  |--------------------------------------------------------------------------
  */

  const loadUsers =
    useCallback(
      async () => {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'profiles',
            )
            .select('*')
            .order(
              'created_at',
              {
                ascending:
                  false,
              },
            );

        if (error) {
          console.error(
            'Users:',
            error,
          );
          showNotice(
            error.message,
            'error',
          );
          return;
        }

        const rows =
          (data ||
            []) as User[];

        setUsers(rows);

        const total =
          rows.reduce(
            (
              sum,
              user,
            ) =>
              sum +
              numberValue(
                user.wallet_balance,
              ),
            0,
          );

        setWalletBalance(
          total,
        );
      },
      [showNotice],
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD TRANSACTIONS
  |--------------------------------------------------------------------------
  */

  const loadTransactions =
    useCallback(
      async () => {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'transactions',
            )
            .select('*')
            .order(
              'created_at',
              {
                ascending:
                  false,
              },
            )
            .limit(100);

        if (error) {
          console.error(
            'Transactions:',
            error,
          );
          return;
        }

        setTransactions(
          (data ||
            []) as Transaction[],
        );
      },
      [],
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD FUNDING
  |--------------------------------------------------------------------------
  */

  const loadFunding =
    useCallback(
      async () => {
        try {
          const response =
            await fetch(
              '/api/funding/requests?status=pending',
              {
                headers:
                  authHeaders(),
              },
            );

          const result =
            await response
              .json()
              .catch(
                () => ({}),
              );

          if (
            !response.ok
          ) {
            throw new Error(
              result.message ||
                'Failed to load funding requests',
            );
          }

          setFundingRequests(
            Array.isArray(
              result.data,
            )
              ? result.data
              : [],
          );
        } catch (error) {
          console.error(
            'Funding:',
            error,
          );
        }
      },
      [],
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD PRODUCTS
  |--------------------------------------------------------------------------
  */

  const loadProducts =
    useCallback(
      async () => {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'products',
            )
            .select('*')
            .order(
              'created_at',
              {
                ascending:
                  false,
              },
            );

        if (error) {
          console.error(
            'Products:',
            error,
          );
          showNotice(
            error.message,
            'error',
          );
          return;
        }

        setProducts(
          (
            data || []
          ).map(
            (
              row: any,
            ) => ({
              id: String(
                row.id,
              ),
              service:
                row.service ||
                'data',
              name:
                row.name ||
                '',
              price:
                numberValue(
                  row.price,
                ),
              network:
                row.network ||
                null,
              description:
                row.description ||
                null,
              category:
                row.category ||
                null,
              cashback_percent:
                numberValue(
                  row.cashback_percent,
                ),
              is_active:
                row.is_active !==
                false,
              created_at:
                row.created_at ||
                null,
            }),
          ),
        );
      },
      [showNotice],
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD NOTIFICATIONS
  |--------------------------------------------------------------------------
  */

  const loadNotifications =
    useCallback(
      async () => {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              'notifications',
            )
            .select('*')
            .order(
              'created_at',
              {
                ascending:
                  false,
              },
            )
            .limit(50);

        if (error) {
          console.error(
            'Notifications:',
            error,
          );
          return;
        }

        setNotifications(
          (
            data ||
            []
          ) as NotificationItem[],
        );
      },
      [],
    );


  /*
  |--------------------------------------------------------------------------
  | CLUBKONNECT BALANCE
  |--------------------------------------------------------------------------
  */

  const loadClubKonnect =
    useCallback(
      async () => {
        setClubLoading(
          true,
        );

        setClubError('');

        try {
          const response =
            await fetch(
              '/api/clubkonnect/balance',
              {
                method: 'GET',
                headers:
                  authHeaders(),
              },
            );

          const result =
            await response
              .json()
              .catch(
                () => ({}),
              );

          if (
            !response.ok ||
            result.success !==
              true
          ) {
            throw new Error(
              result.message ||
                'ClubKonnect connection failed',
            );
          }

          const balance =
            numberValue(
              result.balance ??
                result.data
                  ?.balance,
            );

          setClubBalance(
            balance,
          );

          setClubConnected(
            true,
          );
        } catch (error) {
          console.error(
            'ClubKonnect:',
            error,
          );

          setClubConnected(
            false,
          );

          setClubBalance(
            null,
          );

          setClubError(
            error instanceof
              Error
              ? error.message
              : 'Connection failed',
          );
        } finally {
          setClubLoading(
            false,
          );
        }
      },
      [],
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD ALL
  |--------------------------------------------------------------------------
  */

  const loadAll =
    useCallback(
      async () => {
        setLoading(
          true,
        );

        await Promise.all([
          loadUsers(),
          loadTransactions(),
          loadFunding(),
          loadProducts(),
          loadNotifications(),
          loadClubKonnect(),
        ]);

        setLoading(
          false,
        );
      },
      [
        loadUsers,
        loadTransactions,
        loadFunding,
        loadProducts,
        loadNotifications,
        loadClubKonnect,
      ],
    );


  useEffect(() => {
    loadAll();
  }, [
    loadAll,
  ]);


  /*
  |--------------------------------------------------------------------------
  | NAVIGATION
  |--------------------------------------------------------------------------
  */

  const goTo = (
    next: Section,
  ) => {
    setSection(
      next,
    );

    setMobileMenu(
      false,
    );
  };


  /*
  |--------------------------------------------------------------------------
  | DIRECT SUPER ADMIN WALLET FUNDING
  |--------------------------------------------------------------------------
  */

  const adminAdjustWallet =
    async () => {
      const phone =
        cleanPhone(
          adjustmentPhone,
        );

      const amount =
        Number(
          cleanAmount(
            adjustmentAmount,
          ),
        );

      if (
        phone.length <
        10
      ) {
        showNotice(
          'Enter a valid customer phone number',
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
          'Enter a valid amount',
          'error',
        );
        return;
      }

      const token =
        getToken();

      if (!token) {
        navigate(
          '/super-admin-login',
        );
        return;
      }

      setAdjustingWallet(
        true,
      );

      try {
        const response =
          await fetch(
            '/api/funding/admin-adjust',
            {
              method: 'POST',
              headers:
                authHeaders(),
              body: JSON.stringify({
                phone,
                amount,
                type:
                  adjustmentType,
                reason:
                  adjustmentReason.trim() ||
                  'Super Admin wallet adjustment',
              }),
            },
          );

        const result =
          await response
            .json()
            .catch(
              () => ({}),
            );

        if (
          !response.ok ||
          result.success !==
            true ||
          result.status !==
            'success'
        ) {
          throw new Error(
            result.message ||
              'Wallet funding failed',
          );
        }

        showNotice(
          result.message ||
            'Customer wallet funded successfully',
          'success',
        );

        setAdjustmentAmount(
          '',
        );

        setAdjustmentReason(
          '',
        );

        await Promise.all([
          loadUsers(),
          loadTransactions(),
        ]);
      } catch (error) {
        console.error(
          'Wallet adjustment:',
          error,
        );

        showNotice(
          error instanceof
            Error
            ? error.message
            : 'Wallet funding failed',
          'error',
        );
      } finally {
        setAdjustingWallet(
          false,
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | APPROVE FUNDING
  |--------------------------------------------------------------------------
  */

  const approveFunding =
    async (
      id: string,
    ) => {
      try {
        const response =
          await fetch(
            '/api/funding/approve',
            {
              method: 'POST',
              headers:
                authHeaders(),
              body: JSON.stringify({
                requestId:
                  id,
                adminNotes:
                  'Approved by Super Admin',
              }),
            },
          );

        const result =
          await response
            .json()
            .catch(
              () => ({}),
            );

        if (
          !response.ok ||
          result.success !==
            true
        ) {
          throw new Error(
            result.message ||
              'Funding approval failed',
          );
        }

        showNotice(
          'Funding request approved successfully',
          'success',
        );

        await Promise.all([
          loadFunding(),
          loadUsers(),
          loadTransactions(),
        ]);
      } catch (error) {
        showNotice(
          error instanceof
            Error
            ? error.message
            : 'Funding approval failed',
          'error',
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | REJECT FUNDING
  |--------------------------------------------------------------------------
  */

  const rejectFunding =
    async (
      id: string,
    ) => {
      try {
        const response =
          await fetch(
            '/api/funding/reject',
            {
              method: 'POST',
              headers:
                authHeaders(),
              body: JSON.stringify({
                requestId:
                  id,
                adminNotes:
                  'Rejected by Super Admin',
              }),
            },
          );

        const result =
          await response
            .json()
            .catch(
              () => ({}),
            );

        if (
          !response.ok ||
          result.success !==
            true
        ) {
          throw new Error(
            result.message ||
              'Funding rejection failed',
          );
        }

        showNotice(
          'Funding request rejected',
          'success',
        );

        await loadFunding();
      } catch (error) {
        showNotice(
          error instanceof
            Error
            ? error.message
            : 'Funding rejection failed',
          'error',
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | PRODUCT FORM
  |--------------------------------------------------------------------------
  */

  const resetProduct =
    () => {
      setSelectedProduct(
        null,
      );

      setProductForm({
        name: '',
        service:
          'data',
        network: '',
        price: '',
        description: '',
        category: '',
        cashback_percent:
          '',
        is_active:
          true,
      });
    };


  const editProduct =
    (
      product: Product,
    ) => {
      setSelectedProduct(
        product,
      );

      setProductForm({
        name:
          product.name,
        service:
          (
            product.service ||
            'data'
          ) as ServiceKey,
        network:
          product.network ||
          '',
        price:
          String(
            product.price,
          ),
        description:
          product.description ||
          '',
        category:
          product.category ||
          '',
        cashback_percent:
          String(
            product.cashback_percent ||
              '',
          ),
        is_active:
          product.is_active,
      });

      goTo(
        'services',
      );
    };


  /*
  |--------------------------------------------------------------------------
  | SAVE PRODUCT / PRICE CONTROL
  |--------------------------------------------------------------------------
  */

  const saveProduct =
    async () => {
      const name =
        productForm.name.trim();

      const price =
        Number(
          cleanAmount(
            productForm.price,
          ),
        );

      const cashbackPercent =
        Number(
          productForm.cashback_percent ||
            0,
        );

      if (!name) {
        showNotice(
          'Product name is required',
          'error',
        );
        return;
      }

      if (
        !Number.isFinite(
          price,
        ) ||
        price < 0
      ) {
        showNotice(
          'Enter a valid product price',
          'error',
        );
        return;
      }

      if (
        !Number.isFinite(
          cashbackPercent,
        ) ||
        cashbackPercent < 0
      ) {
        showNotice(
          'Enter a valid cashback percentage',
          'error',
        );
        return;
      }

      setSavingProduct(
        true,
      );

      const payload = {
        name,
        service:
          productForm.service,
        network:
          productForm.network.trim() ||
          null,
        price,
        description:
          productForm.description.trim() ||
          null,
        category:
          productForm.category.trim() ||
          null,
        cashback_percent:
          cashbackPercent,
        is_active:
          productForm.is_active,
      };

      try {
        let error;

        if (
          selectedProduct
        ) {
          const result =
            await supabase
              .from(
                'products',
              )
              .update(
                payload,
              )
              .eq(
                'id',
                selectedProduct.id,
              );

          error =
            result.error;
        } else {
          const result =
            await supabase
              .from(
                'products',
              )
              .insert(
                payload,
              );

          error =
            result.error;
        }

        if (error) {
          throw error;
        }

        showNotice(
          selectedProduct
            ? 'Product price updated successfully'
            : 'Product created successfully',
          'success',
        );

        resetProduct();

        await loadProducts();
      } catch (error) {
        showNotice(
          error instanceof
            Error
            ? error.message
            : 'Unable to save product',
          'error',
        );
      } finally {
        setSavingProduct(
          false,
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | DELETE PRODUCT
  |--------------------------------------------------------------------------
  */

  const deleteProduct =
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

      const {
        error,
      } =
        await supabase
          .from(
            'products',
          )
          .delete()
          .eq(
            'id',
            product.id,
          );

      if (error) {
        showNotice(
          error.message,
          'error',
        );
        return;
      }

      showNotice(
        'Product deleted successfully',
        'success',
      );

      await loadProducts();
    };


  /*
  |--------------------------------------------------------------------------
  | TOGGLE PRODUCT
  |--------------------------------------------------------------------------
  */

  const toggleProduct =
    async (
      product: Product,
    ) => {
      const {
        error,
      } =
        await supabase
          .from(
            'products',
          )
          .update({
            is_active:
              !product.is_active,
          })
          .eq(
            'id',
            product.id,
          );

      if (error) {
        showNotice(
          error.message,
          'error',
        );
        return;
      }

      showNotice(
        product.is_active
          ? 'Product disabled'
          : 'Product activated',
        'success',
      );

      await loadProducts();
    };


  /*
  |--------------------------------------------------------------------------
  | USER EDIT
  |--------------------------------------------------------------------------
  */

  const editUser =
    (
      user: User,
    ) => {
      setSelectedUser(
        user,
      );

      setUserForm({
        name:
          user.name ||
          user.full_name ||
          '',
        email:
          user.email ||
          '',
        is_active:
          user.is_active !==
          false,
        is_admin:
          user.is_admin ===
          true,
      });
    };


  const saveUser =
    async () => {
      if (
        !selectedUser
      ) {
        return;
      }

      setSavingUser(
        true,
      );

      try {
        /*
         * IMPORTANT:
         * profiles has no updated_at.
         */
        const {
          error,
        } =
          await supabase
            .from(
              'profiles',
            )
            .update({
              name:
                userForm.name.trim() ||
                null,
              email:
                userForm.email.trim() ||
                null,
              is_active:
                userForm.is_active,
              is_admin:
                userForm.is_admin,
            })
            .eq(
              'id',
              selectedUser.id,
            );

        if (error) {
          throw error;
        }

        showNotice(
          'User updated successfully',
          'success',
        );

        setSelectedUser(
          null,
        );

        await loadUsers();
      } catch (error) {
        showNotice(
          error instanceof
            Error
            ? error.message
            : 'Unable to update user',
          'error',
        );
      } finally {
        setSavingUser(
          false,
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | DELETE USER
  |--------------------------------------------------------------------------
  */

  const deleteUser =
    async (
      user: User,
    ) => {
      if (
        !window.confirm(
          `Delete ${user.phone}?`,
        )
      ) {
        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            'profiles',
          )
          .delete()
          .eq(
            'id',
            user.id,
          );

      if (error) {
        showNotice(
          error.message,
          'error',
        );
        return;
      }

      showNotice(
        'User deleted successfully',
        'success',
      );

      await loadUsers();
    };


  /*
  |--------------------------------------------------------------------------
  | SEND NOTIFICATION
  |--------------------------------------------------------------------------
  */

  const sendNotification =
    async () => {
      if (
        !notificationForm.title.trim() ||
        !notificationForm.message.trim()
      ) {
        showNotice(
          'Title and message are required',
          'error',
        );
        return;
      }

      setSendingNotification(
        true,
      );

      try {
        const {
          error,
        } =
          await supabase
            .from(
              'notifications',
            )
            .insert({
              title:
                notificationForm.title.trim(),
              message:
                notificationForm.message.trim(),
              type:
                notificationForm.type,
            });

        if (error) {
          throw error;
        }

        showNotice(
          'Notification sent successfully',
          'success',
        );

        setNotificationForm({
          title: '',
          message: '',
          type: 'info',
        });

        await loadNotifications();
      } catch (error) {
        showNotice(
          error instanceof
            Error
            ? error.message
            : 'Unable to send notification',
          'error',
        );
      } finally {
        setSendingNotification(
          false,
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | DELETE NOTIFICATION
  |--------------------------------------------------------------------------
  */

  const deleteNotification =
    async (
      id: string,
    ) => {
      const {
        error,
      } =
        await supabase
          .from(
            'notifications',
          )
          .delete()
          .eq(
            'id',
            id,
          );

      if (error) {
        showNotice(
          error.message,
          'error',
        );
        return;
      }

      showNotice(
        'Notification deleted',
        'success',
      );

      await loadNotifications();
    };


  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const filteredUsers =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return users;
      }

      return users.filter(
        (user) =>
          String(
            user.phone ||
              '',
          )
            .toLowerCase()
            .includes(value) ||
          String(
            user.name ||
              user.full_name ||
              '',
          )
            .toLowerCase()
            .includes(value) ||
          String(
            user.email ||
              '',
          )
            .toLowerCase()
            .includes(value),
      );
    }, [
      users,
      search,
    ]);


  const filteredProducts =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return products;
      }

      return products.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(value) ||
          product.service
            .toLowerCase()
            .includes(value) ||
          String(
            product.network ||
              '',
          )
            .toLowerCase()
            .includes(value),
      );
    }, [
      products,
      search,
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

  const adminUsers =
    users.filter(
      (user) =>
        user.is_admin ===
        true,
    ).length;

  const totalRevenue =
    transactions
      .filter(
        (transaction) =>
          statusKind(
            transaction.status,
          ) ===
          'success',
      )
      .reduce(
        (
          total,
          transaction,
        ) =>
          total +
          numberValue(
            transaction.amount,
          ),
        0,
      );

  const successfulTransactions =
    transactions.filter(
      (transaction) =>
        statusKind(
          transaction.status,
        ) ===
        'success',
    ).length;

  const failedTransactions =
    transactions.filter(
      (transaction) =>
        statusKind(
          transaction.status,
        ) ===
        'error',
    ).length;


  /*
  |--------------------------------------------------------------------------
  | NAV ITEMS
  |--------------------------------------------------------------------------
  */

  const navItems: {
    key: Section;
    label: string;
    icon: ReactNode;
  }[] = [
    {
      key: 'overview',
      label: 'Overview',
      icon:
        <BarChart3
          size={17}
        />,
    },
    {
      key: 'users',
      label: 'Users',
      icon:
        <Users
          size={17}
        />,
    },
    {
      key: 'wallet',
      label: 'Wallet',
      icon:
        <Wallet
          size={17}
        />,
    },
    {
      key: 'transactions',
      label: 'Transactions',
      icon:
        <Activity
          size={17}
        />,
    },
    {
      key: 'revenue',
      label: 'Revenue',
      icon:
        <TrendingUp
          size={17}
        />,
    },
    {
      key: 'funding',
      label: 'Funding',
      icon:
        <CreditCard
          size={17}
        />,
    },
    {
      key: 'services',
      label:
        'Products & Services',
      icon:
        <Package
          size={17}
        />,
    },
    {
      key: 'admins',
      label: 'Admins',
      icon:
        <UserCog
          size={17}
        />,
    },
    {
      key: 'security',
      label: 'Security',
      icon:
        <Shield
          size={17}
        />,
    },
    {
      key: 'notifications',
      label:
        'Notifications',
      icon:
        <Bell
          size={17}
        />,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon:
        <Settings
          size={17}
        />,
    },
  ];


  /*
  |--------------------------------------------------------------------------
  | OVERVIEW
  |--------------------------------------------------------------------------
  */

  const overviewView =
    (
      <div>
        <SectionTitle
          title="Super Admin Overview"
          subtitle="Complete control center for GY DATA"
          action={
            <Button
              kind="light"
              onClick={
                loadAll
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
            sm:grid-cols-2
            xl:grid-cols-5
          "
        >
          <StatCard
            title="Customers"
            value={String(
              totalUsers,
            )}
            icon={
              <Users
                size={20}
              />
            }
            iconClass="
              bg-blue-50
              text-blue-700
            "
            onClick={() =>
              goTo('users')
            }
            loading={loading}
          />

          <StatCard
            title="Main Wallet"
            value={
              showBalance
                ? money(
                    walletBalance,
                  )
                : '••••••'
            }
            icon={
              <Wallet
                size={20}
              />
            }
            iconClass="
              bg-emerald-50
              text-emerald-700
            "
            onClick={() =>
              goTo('wallet')
            }
            loading={loading}
          />

          <StatCard
            title="Revenue"
            value={money(
              totalRevenue,
            )}
            icon={
              <TrendingUp
                size={20}
              />
            }
            iconClass="
              bg-indigo-50
              text-indigo-700
            "
            onClick={() =>
              goTo('revenue')
            }
          />

          <StatCard
            title="Pending Funding"
            value={String(
              fundingRequests.length,
            )}
            icon={
              <Clock3
                size={20}
              />
            }
            iconClass="
              bg-orange-50
              text-orange-700
            "
            onClick={() =>
              goTo('funding')
            }
          />

          <StatCard
            title="ClubKonnect"
            value={
              clubBalance !==
              null
                ? money(
                    clubBalance,
                  )
                : '—'
            }
            icon={
              <Server
                size={20}
              />
            }
            iconClass={
              clubConnected
                ? `
                  bg-emerald-50
                  text-emerald-700
                `
                : `
                  bg-red-50
                  text-red-700
                `
            }
            onClick={
              loadClubKonnect
            }
            loading={
              clubLoading
            }
          />
        </div>


        <div
          className="
            mt-5
            grid
            grid-cols-1
            gap-5
            xl:grid-cols-3
          "
        >

          <Card
            className="
              overflow-hidden
              bg-[#071a41]
              text-white
              xl:col-span-2
            "
          >
            <div
              className="
                relative
                p-6
              "
            >
              <div
                className="
                  absolute
                  right-0
                  top-0
                  h-40
                  w-40
                  rounded-full
                  bg-blue-500/10
                  blur-2xl
                "
              />

              <div
                className="
                  relative
                  flex
                  items-start
                  justify-between
                  gap-5
                "
              >
                <div>
                  <p
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-widest
                      text-blue-300
                    "
                  >
                    Main Wallet
                  </p>

                  <div
                    className="
                      mt-3
                      flex
                      items-center
                      gap-3
                    "
                  >
                    <h3
                      className="
                        text-3xl
                        font-black
                      "
                    >
                      {showBalance
                        ? money(
                            walletBalance,
                          )
                        : '••••••'}
                    </h3>

                    <button
                      type="button"
                      onClick={() =>
                        setShowBalance(
                          (value) =>
                            !value,
                        )
                      }
                      className="
                        rounded-lg
                        p-2
                        text-blue-200
                        hover:bg-white/10
                      "
                    >
                      {showBalance ? (
                        <EyeOff
                          size={17}
                        />
                      ) : (
                        <Eye
                          size={17}
                        />
                      )}
                    </button>
                  </div>

                  <p
                    className="
                      mt-2
                      text-xs
                      text-blue-200/70
                    "
                  >
                    Total customer
                    wallet balances
                  </p>
                </div>

                <div
                  className="
                    rounded-2xl
                    bg-white/10
                    p-3
                  "
                >
                  <Wallet
                    size={24}
                  />
                </div>
              </div>

              <div
                className="
                  relative
                  mt-7
                  flex
                  flex-wrap
                  gap-2
                "
              >
                <Button
                  kind="blue"
                  onClick={() =>
                    goTo('wallet')
                  }
                >
                  <Wallet
                    size={14}
                  />
                  Wallet Adjustment
                </Button>

                <Button
                  kind="light"
                  onClick={() =>
                    goTo('transactions')
                  }
                >
                  <Activity
                    size={14}
                  />
                  Transactions
                </Button>
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
                    text-slate-400
                  "
                >
                  ClubKonnect Balance
                </p>

                <p
                  className="
                    mt-2
                    text-2xl
                    font-black
                    text-slate-900
                  "
                >
                  {clubLoading
                    ? '...'
                    : clubBalance !==
                        null
                      ? money(
                          clubBalance,
                        )
                      : '—'}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  loadClubKonnect
                }
                className="
                  rounded-xl
                  bg-slate-100
                  p-3
                  text-slate-700
                  hover:bg-blue-50
                  hover:text-blue-700
                "
              >
                <RefreshCw
                  size={18}
                  className={
                    clubLoading
                      ? 'animate-spin'
                      : ''
                  }
                />
              </button>
            </div>

            <div
              className="
                mt-5
                flex
                items-center
                gap-2
              "
            >
              <span
                className={`
                  h-2.5
                  w-2.5
                  rounded-full
                  ${
                    clubConnected
                      ? 'bg-emerald-500'
                      : 'bg-red-500'
                  }
                `}
              />

              <span
                className="
                  text-xs
                  font-bold
                  text-slate-600
                "
              >
                {clubConnected
                  ? 'Connected'
                  : 'Connection failed'}
              </span>
            </div>

            {clubError && (
              <p
                className="
                  mt-3
                  text-[11px]
                  leading-5
                  text-red-600
                "
              >
                {clubError}
              </p>
            )}

            <div
              className="
                mt-5
                rounded-xl
                bg-slate-50
                p-3
                text-[10px]
                leading-5
                text-slate-500
              "
            >
              ClubKonnect balance is
              separate from customer
              Main Wallet.
            </div>
          </Card>
        </div>


        <div
          className="
            mt-5
            grid
            grid-cols-2
            gap-4
            lg:grid-cols-4
          "
        >
          <Card
            onClick={() =>
              goTo('services')
            }
            className="p-5"
          >
            <Package
              className="
                text-blue-700
              "
              size={22}
            />
            <p
              className="
                mt-3
                text-sm
                font-black
                text-slate-800
              "
            >
              Products & Services
            </p>
            <p
              className="
                mt-1
                text-[10px]
                text-slate-400
              "
            >
              Price control
              & services
            </p>
          </Card>

          <Card
            onClick={() =>
              goTo('users')
            }
            className="p-5"
          >
            <Users
              className="
                text-indigo-700
              "
              size={22}
            />
            <p
              className="
                mt-3
                text-sm
                font-black
                text-slate-800
              "
            >
              User Management
            </p>
            <p
              className="
                mt-1
                text-[10px]
                text-slate-400
              "
            >
              Accounts &
              permissions
            </p>
          </Card>

          <Card
            onClick={() =>
              goTo('funding')
            }
            className="p-5"
          >
            <CreditCard
              className="
                text-orange-600
              "
              size={22}
            />
            <p
              className="
                mt-3
                text-sm
                font-black
                text-slate-800
              "
            >
              Funding
            </p>
            <p
              className="
                mt-1
                text-[10px]
                text-slate-400
              "
            >
              Requests &
              approvals
            </p>
          </Card>

          <Card
            onClick={() =>
              goTo(
                'notifications',
              )
            }
            className="p-5"
          >
            <Bell
              className="
                text-purple-700
              "
              size={22}
            />
            <p
              className="
                mt-3
                text-sm
                font-black
                text-slate-800
              "
            >
              Notifications
            </p>
            <p
              className="
                mt-1
                text-[10px]
                text-slate-400
              "
            >
              Customer
              announcements
            </p>
          </Card>
        </div>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | WALLET
  |--------------------------------------------------------------------------
  */

  const walletView =
    (
      <div>
        <SectionTitle
          title="Wallet Management"
          subtitle="Direct Super Admin wallet control"
          action={
            <Button
              kind="light"
              onClick={() =>
                Promise.all([
                  loadUsers(),
                  loadTransactions(),
                ])
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
            gap-5
            lg:grid-cols-3
          "
        >
          <Card
            className="
              bg-[#071a41]
              p-6
              text-white
              lg:col-span-1
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
                  text-[10px]
                  font-black
                  uppercase
                  tracking-widest
                  text-blue-300
                "
              >
                Main Wallet
              </span>

              <Wallet
                size={22}
              />
            </div>

            <p
              className="
                mt-5
                text-3xl
                font-black
              "
            >
              {money(
                walletBalance,
              )}
            </p>

            <p
              className="
                mt-2
                text-xs
                text-blue-200/70
              "
            >
              Combined customer
              wallet balance
            </p>

            <div
              className="
                mt-6
                h-px
                bg-white/10
              "
            />

            <div
              className="
                mt-5
                flex
                justify-between
                text-xs
              "
            >
              <span
                className="
                  text-blue-200/70
                "
              >
                Customers
              </span>

              <b>
                {totalUsers}
              </b>
            </div>
          </Card>


          <Card
            className="
              p-6
              lg:col-span-2
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
                border-b
                border-slate-100
                pb-5
              "
            >
              <div
                className="
                  rounded-xl
                  bg-blue-50
                  p-3
                  text-blue-700
                "
              >
                <Wallet
                  size={20}
                />
              </div>

              <div>
                <h3
                  className="
                    text-base
                    font-black
                    text-slate-900
                  "
                >
                  Wallet Adjustment
                </h3>

                <p
                  className="
                    text-[11px]
                    text-slate-500
                  "
                >
                  Direct database wallet
                  adjustment
                </p>
              </div>
            </div>


            <div
              className="
                mt-5
                grid
                grid-cols-1
                gap-4
                md:grid-cols-2
              "
            >
              <label>
                <span
                  className="
                    mb-2
                    block
                    text-xs
                    font-bold
                    text-slate-600
                  "
                >
                  Customer Phone
                </span>

                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={
                    adjustmentPhone
                  }
                  onChange={(
                    event,
                  ) =>
                    setAdjustmentPhone(
                      cleanPhone(
                        event
                          .target
                          .value,
                      ),
                    )
                  }
                  placeholder="080XXXXXXXX"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    py-3
                    text-sm
                    outline-none
                    focus:border-blue-500
                    focus:bg-white
                    focus:ring-4
                    focus:ring-blue-500/10
                  "
                />
              </label>


              <label>
                <span
                  className="
                    mb-2
                    block
                    text-xs
                    font-bold
                    text-slate-600
                  "
                >
                  Amount
                </span>

                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    adjustmentAmount
                  }
                  onChange={(
                    event,
                  ) =>
                    setAdjustmentAmount(
                      cleanAmount(
                        event
                          .target
                          .value,
                      ),
                    )
                  }
                  placeholder="#0.00"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    py-3
                    text-sm
                    outline-none
                    focus:border-blue-500
                    focus:bg-white
                    focus:ring-4
                    focus:ring-blue-500/10
                  "
                />
              </label>


              <label>
                <span
                  className="
                    mb-2
                    block
                    text-xs
                    font-bold
                    text-slate-600
                  "
                >
                  Adjustment Type
                </span>

                <select
                  value={
                    adjustmentType
                  }
                  onChange={(
                    event,
                  ) =>
                    setAdjustmentType(
                      event.target
                        .value as
                        | 'fund'
                        | 'refund',
                    )
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    py-3
                    text-sm
                    outline-none
                    focus:border-blue-500
                  "
                >
                  <option value="fund">
                    Fund Wallet
                  </option>

                  <option value="refund">
                    Refund / Deduct
                  </option>
                </select>
              </label>


              <label>
                <span
                  className="
                    mb-2
                    block
                    text-xs
                    font-bold
                    text-slate-600
                  "
                >
                  Reason
                </span>

                <input
                  type="text"
                  value={
                    adjustmentReason
                  }
                  onChange={(
                    event,
                  ) =>
                    setAdjustmentReason(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Optional reason"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    py-3
                    text-sm
                    outline-none
                    focus:border-blue-500
                    focus:bg-white
                    focus:ring-4
                    focus:ring-blue-500/10
                  "
                />
              </label>
            </div>


            <div
              className="
                mt-5
                flex
                flex-wrap
                items-center
                justify-between
                gap-3
              "
            >
              <p
                className="
                  max-w-md
                  text-[10px]
                  leading-5
                  text-slate-400
                "
              >
                Super Admin funding goes
                directly through
                admin_adjust_wallet().
                It does not create a
                funding request.
              </p>

              <Button
                kind={
                  adjustmentType ===
                  'fund'
                    ? 'green'
                    : 'orange'
                }
                disabled={
                  adjustingWallet
                }
                onClick={
                  adminAdjustWallet
                }
              >
                {adjustingWallet ? (
                  <RefreshCw
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <Check
                    size={15}
                  />
                )}

                {adjustingWallet
                  ? 'Processing...'
                  : adjustmentType ===
                      'fund'
                    ? 'Fund Wallet'
                    : 'Refund Wallet'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | USERS
  |--------------------------------------------------------------------------
  */

  const usersView =
    (
      <div>
        <SectionTitle
          title="Users"
          subtitle="Customer account management"
          action={
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <div
                className="
                  relative
                "
              >
                <Search
                  size={15}
                  className="
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
                  placeholder="Search user"
                  className="
                    w-52
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    py-2.5
                    pl-9
                    pr-3
                    text-xs
                    outline-none
                    focus:border-blue-500
                  "
                />
              </div>

              <Button
                kind="light"
                onClick={
                  loadUsers
                }
              >
                <RefreshCw
                  size={14}
                />
              </Button>
            </div>
          }
        />

        <Card className="overflow-hidden">
          <div
            className="
              overflow-x-auto
            "
          >
            <table
              className="
                min-w-[900px]
                w-full
                text-left
              "
            >
              <thead
                className="
                  bg-slate-50
                  text-[10px]
                  font-black
                  uppercase
                  tracking-wider
                  text-slate-400
                "
              >
                <tr>
                  <th className="px-5 py-4">
                    User
                  </th>

                  <th className="px-5 py-4">
                    Wallet
                  </th>

                  <th className="px-5 py-4">
                    Role
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Joined
                  </th>

                  <th className="px-5 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody
                className="
                  divide-y
                  divide-slate-100
                "
              >
                {filteredUsers.map(
                  (user) => (
                    <tr
                      key={
                        user.id
                      }
                      className="
                        hover:bg-slate-50/70
                      "
                    >
                      <td className="px-5 py-4">
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

                          <p
                            className="
                              mt-1
                              text-[10px]
                              text-slate-400
                            "
                          >
                            {
                              user.phone
                            }
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className="
                            text-xs
                            font-black
                            text-slate-800
                          "
                        >
                          {money(
                            user.wallet_balance,
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {user.is_admin ? (
                          <span
                            className="
                              rounded-full
                              bg-blue-50
                              px-2.5
                              py-1
                              text-[10px]
                              font-bold
                              text-blue-700
                            "
                          >
                            Admin
                          </span>
                        ) : (
                          <span
                            className="
                              rounded-full
                              bg-slate-100
                              px-2.5
                              py-1
                              text-[10px]
                              font-bold
                              text-slate-500
                            "
                          >
                            Customer
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={
                            user.is_active ===
                            false
                              ? 'failed'
                              : 'success'
                          }
                        />
                      </td>

                      <td
                        className="
                          px-5
                          py-4
                          text-[10px]
                          text-slate-500
                        "
                      >
                        {formatDate(
                          user.created_at,
                        )}
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
                              editUser(
                                user,
                              )
                            }
                            className="
                              rounded-lg
                              bg-blue-50
                              p-2
                              text-blue-700
                              hover:bg-blue-100
                            "
                          >
                            <Edit3
                              size={14}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteUser(
                                user,
                              )
                            }
                            className="
                              rounded-lg
                              bg-red-50
                              p-2
                              text-red-600
                              hover:bg-red-100
                            "
                          >
                            <Trash2
                              size={14}
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

          {!filteredUsers.length && (
            <div
              className="
                p-10
                text-center
                text-xs
                text-slate-400
              "
            >
              No users found.
            </div>
          )}
        </Card>


        {selectedUser && (
          <Card
            className="
              mt-5
              p-6
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
                <h3
                  className="
                    font-black
                    text-slate-900
                  "
                >
                  Edit User
                </h3>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-400
                  "
                >
                  {
                    selectedUser.phone
                  }
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
                  rounded-lg
                  bg-slate-100
                  p-2
                "
              >
                <X
                  size={16}
                />
              </button>
            </div>

            <div
              className="
                mt-5
                grid
                grid-cols-1
                gap-4
                md:grid-cols-2
              "
            >
              <Input
                label="Name"
                value={
                  userForm.name
                }
                onChange={(
                  event,
                ) =>
                  setUserForm(
                    (old) => ({
                      ...old,
                      name:
                        event.target
                          .value,
                    }),
                  )
                }
              />

              <Input
                label="Email"
                type="email"
                inputMode="email"
                value={
                  userForm.email
                }
                onChange={(
                  event,
                ) =>
                  setUserForm(
                    (old) => ({
                      ...old,
                      email:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </div>

            <div
              className="
                mt-5
                flex
                flex-wrap
                gap-5
              "
            >
              <label
                className="
                  flex
                  items-center
                  gap-2
                  text-xs
                  font-bold
                  text-slate-600
                "
              >
                <input
                  type="checkbox"
                  checked={
                    userForm.is_active
                  }
                  onChange={(
                    event,
                  ) =>
                    setUserForm(
                      (old) => ({
                        ...old,
                        is_active:
                          event.target
                            .checked,
                      }),
                    )
                  }
                />
                Active
              </label>

              <label
                className="
                  flex
                  items-center
                  gap-2
                  text-xs
                  font-bold
                  text-slate-600
                "
              >
                <input
                  type="checkbox"
                  checked={
                    userForm.is_admin
                  }
                  onChange={(
                    event,
                  ) =>
                    setUserForm(
                      (old) => ({
                        ...old,
                        is_admin:
                          event.target
                            .checked,
                      }),
                    )
                  }
                />
                Admin
              </label>
            </div>

            <div
              className="
                mt-5
                flex
                justify-end
                gap-2
              "
            >
              <Button
                kind="light"
                onClick={() =>
                  setSelectedUser(
                    null,
                  )
                }
              >
                Cancel
              </Button>

              <Button
                kind="blue"
                disabled={
                  savingUser
                }
                onClick={
                  saveUser
                }
              >
                {savingUser
                  ? 'Saving...'
                  : 'Save User'}
              </Button>
            </div>
          </Card>
        )}
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | TRANSACTIONS
  |--------------------------------------------------------------------------
  */

  const transactionsView =
    (
      <div>
        <SectionTitle
          title="Transactions"
          subtitle="Latest GY DATA transactions"
          action={
            <Button
              kind="light"
              onClick={
                loadTransactions
              }
            >
              <RefreshCw
                size={14}
              />
              Refresh
            </Button>
          }
        />

        <Card className="overflow-hidden">
          <div
            className="
              overflow-x-auto
            "
          >
            <table
              className="
                min-w-[950px]
                w-full
                text-left
              "
            >
              <thead
                className="
                  bg-slate-50
                  text-[10px]
                  font-black
                  uppercase
                  tracking-wider
                  text-slate-400
                "
              >
                <tr>
                  <th className="px-5 py-4">
                    Reference
                  </th>

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
                    Date
                  </th>
                </tr>
              </thead>

              <tbody
                className="
                  divide-y
                  divide-slate-100
                "
              >
                {transactions.map(
                  (
                    transaction,
                  ) => (
                    <tr
                      key={
                        transaction.id
                      }
                      className="
                        hover:bg-slate-50
                      "
                    >
                      <td className="px-5 py-4">
                        <span
                          className="
                            font-mono
                            text-[10px]
                            text-slate-500
                          "
                        >
                          {
                            transaction.reference ||
                            transaction.id
                          }
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          <p
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
                          </p>

                          {transaction.recipient && (
                            <p
                              className="
                                mt-1
                                text-[10px]
                                text-slate-400
                              "
                            >
                              {
                                transaction.recipient
                              }
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className="
                            text-xs
                            font-bold
                            text-slate-600
                          "
                        >
                          {SERVICE_LABELS[
                            (
                              transaction.service ||
                              ''
                            ) as ServiceKey
                          ] ||
                            transaction.service ||
                            transaction.type ||
                            '—'}
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

                      <td
                        className="
                          px-5
                          py-4
                          text-[10px]
                          text-slate-500
                        "
                      >
                        {formatDate(
                          transaction.created_at,
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          {!transactions.length && (
            <div
              className="
                p-10
                text-center
                text-xs
                text-slate-400
              "
            >
              No transactions found.
            </div>
          )}
        </Card>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | REVENUE
  |--------------------------------------------------------------------------
  */

  const revenueView =
    (
      <div>
        <SectionTitle
          title="Revenue"
          subtitle="Transaction performance"
        />

        <div
          className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-3
          "
        >
          <StatCard
            title="Successful"
            value={String(
              successfulTransactions,
            )}
            icon={
              <CheckCircle2
                size={20}
              />
            }
            iconClass="
              bg-emerald-50
              text-emerald-700
            "
          />

          <StatCard
            title="Failed"
            value={String(
              failedTransactions,
            )}
            icon={
              <XCircle
                size={20}
              />
            }
            iconClass="
              bg-red-50
              text-red-700
            "
          />

          <StatCard
            title="Revenue"
            value={money(
              totalRevenue,
            )}
            icon={
              <TrendingUp
                size={20}
              />
            }
            iconClass="
              bg-blue-50
              text-blue-700
            "
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
              text-base
              font-black
              text-slate-900
            "
          >
            Revenue Summary
          </h3>

          <div
            className="
              mt-5
              grid
              grid-cols-1
              gap-4
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >
            {SERVICES.map(
              (service) => {
                const total =
                  transactions
                    .filter(
                      (
                        transaction,
                      ) =>
                        String(
                          transaction.service ||
                            '',
                        ).toLowerCase() ===
                        service.key &&
                        statusKind(
                          transaction.status,
                        ) ===
                          'success',
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
                      rounded-xl
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
                        gap-2
                        text-slate-500
                      "
                    >
                      {service.icon}

                      <span
                        className="
                          text-xs
                          font-bold
                        "
                      >
                        {
                          service.label
                        }
                      </span>
                    </div>

                    <p
                      className="
                        mt-3
                        text-lg
                        font-black
                        text-slate-900
                      "
                    >
                      {money(
                        total,
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
  | FUNDING
  |--------------------------------------------------------------------------
  */

  const fundingView =
    (
      <div>
        <SectionTitle
          title="Funding Requests"
          subtitle="Customer funding approval queue"
          action={
            <Button
              kind="light"
              onClick={
                loadFunding
              }
            >
              <RefreshCw
                size={14}
              />
              Refresh
            </Button>
          }
        />

        <Card className="overflow-hidden">
          <div
            className="
              overflow-x-auto
            "
          >
            <table
              className="
                min-w-[850px]
                w-full
                text-left
              "
            >
              <thead
                className="
                  bg-slate-50
                  text-[10px]
                  font-black
                  uppercase
                  tracking-wider
                  text-slate-400
                "
              >
                <tr>
                  <th className="px-5 py-4">
                    Customer
                  </th>

                  <th className="px-5 py-4">
                    Amount
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Date
                  </th>

                  <th className="px-5 py-4 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody
                className="
                  divide-y
                  divide-slate-100
                "
              >
                {fundingRequests.map(
                  (
                    request,
                  ) => (
                    <tr
                      key={
                        request.id
                      }
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p
                            className="
                              text-xs
                              font-black
                              text-slate-800
                            "
                          >
                            {
                              request.phone
                            }
                          </p>

                          {request.reason && (
                            <p
                              className="
                                mt-1
                                text-[10px]
                                text-slate-400
                              "
                            >
                              {
                                request.reason
                              }
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className="
                            text-sm
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
                        <StatusBadge
                          status={
                            request.status ||
                            'pending'
                          }
                        />
                      </td>

                      <td
                        className="
                          px-5
                          py-4
                          text-[10px]
                          text-slate-500
                        "
                      >
                        {formatDate(
                          request.created_at,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div
                          className="
                            flex
                            justify-end
                            gap-2
                          "
                        >
                          <Button
                            kind="green"
                            onClick={() =>
                              approveFunding(
                                request.id,
                              )
                            }
                          >
                            <Check
                              size={13}
                            />
                            Approve
                          </Button>

                          <Button
                            kind="red"
                            onClick={() =>
                              rejectFunding(
                                request.id,
                              )
                            }
                          >
                            <X
                              size={13}
                            />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          {!fundingRequests.length && (
            <div
              className="
                p-10
                text-center
              "
            >
              <CheckCircle2
                size={28}
                className="
                  mx-auto
                  text-emerald-500
                "
              />

              <p
                className="
                  mt-3
                  text-sm
                  font-bold
                  text-slate-600
                "
              >
                No pending funding
                requests.
              </p>
            </div>
          )}
        </Card>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | SERVICES / PRICE CONTROL
  |--------------------------------------------------------------------------
  */

  const servicesView =
    (
      <div>
        <SectionTitle
          title="Products & Services"
          subtitle="Manage products, prices, cashback and availability"
          action={
            <div
              className="
                flex
                flex-wrap
                gap-2
              "
            >
              <Button
                kind="light"
                onClick={
                  loadProducts
                }
              >
                <RefreshCw
                  size={14}
                />
                Refresh
              </Button>

              <Button
                kind="blue"
                onClick={
                  resetProduct
                }
              >
                <Plus
                  size={14}
                />
                New Product
              </Button>
            </div>
          }
        />

        <div
          className="
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-3
            lg:grid-cols-5
          "
        >
          {SERVICES.map(
            (service) => {
              const count =
                products.filter(
                  (product) =>
                    product.service ===
                    service.key,
                ).length;

              return (
                <Card
                  key={
                    service.key
                  }
                  onClick={() => {
                    setProductForm(
                      (old) => ({
                        ...old,
                        service:
                          service.key,
                      }),
                    );

                    setSearch(
                      '',
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
                      justify-between
                    "
                  >
                    <div
                      className="
                        rounded-xl
                        bg-blue-50
                        p-2.5
                        text-blue-700
                      "
                    >
                      {
                        service.icon
                      }
                    </div>

                    <span
                      className="
                        rounded-full
                        bg-slate-100
                        px-2
                        py-1
                        text-[9px]
                        font-black
                        text-slate-500
                      "
                    >
                      {count}
                    </span>
                  </div>

                  <p
                    className="
                      mt-3
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
                      mt-1
                      text-[9px]
                      text-slate-400
                    "
                  >
                    Open service
                  </p>
                </Card>
              );
            },
          )}
        </div>


        <Card
          className="
            mt-5
            overflow-hidden
          "
        >
          <div
            className="
              border-b
              border-slate-100
              p-5
            "
          >
            <div
              className="
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div>
                <h3
                  className="
                    font-black
                    text-slate-900
                  "
                >
                  Price Control
                </h3>

                <p
                  className="
                    mt-1
                    text-[10px]
                    text-slate-400
                  "
                >
                  Change product selling
                  price and cashback.
                </p>
              </div>

              <div
                className="
                  relative
                "
              >
                <Search
                  size={14}
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  value={
                    search
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search products"
                  className="
                    w-56
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    py-2.5
                    pl-9
                    pr-3
                    text-xs
                    outline-none
                    focus:border-blue-500
                  "
                />
              </div>
            </div>
          </div>


          <div
            className="
              overflow-x-auto
            "
          >
            <table
              className="
                min-w-[950px]
                w-full
                text-left
              "
            >
              <thead
                className="
                  bg-slate-50
                  text-[10px]
                  font-black
                  uppercase
                  tracking-wider
                  text-slate-400
                "
              >
                <tr>
                  <th className="px-5 py-4">
                    Product
                  </th>

                  <th className="px-5 py-4">
                    Service
                  </th>

                  <th className="px-5 py-4">
                    Price
                  </th>

                  <th className="px-5 py-4">
                    Cashback
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody
                className="
                  divide-y
                  divide-slate-100
                "
              >
                {filteredProducts.map(
                  (
                    product,
                  ) => (
                    <tr
                      key={
                        product.id
                      }
                      className="
                        hover:bg-slate-50
                      "
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p
                            className="
                              text-xs
                              font-black
                              text-slate-800
                            "
                          >
                            {
                              product.name
                            }
                          </p>

                          {product.network && (
                            <p
                              className="
                                mt-1
                                text-[10px]
                                text-slate-400
                              "
                            >
                              {
                                product.network
                              }
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className="
                            rounded-full
                            bg-blue-50
                            px-2.5
                            py-1
                            text-[10px]
                            font-bold
                            text-blue-700
                          "
                        >
                          {
                            SERVICE_LABELS[
                              product.service as ServiceKey
                            ] ||
                            product.service
                          }
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className="
                            text-sm
                            font-black
                            text-slate-900
                          "
                        >
                          {money(
                            product.price,
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className="
                            text-xs
                            font-bold
                            text-emerald-600
                          "
                        >
                          {numberValue(
                            product.cashback_percent,
                          )}
                          %
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={
                            product.is_active
                              ? 'success'
                              : 'failed'
                          }
                        />
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
                              editProduct(
                                product,
                              )
                            }
                            className="
                              rounded-lg
                              bg-blue-50
                              p-2
                              text-blue-700
                              hover:bg-blue-100
                            "
                          >
                            <Edit3
                              size={14}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleProduct(
                                product,
                              )
                            }
                            className={`
                              rounded-lg
                              p-2
                              ${
                                product.is_active
                                  ? 'bg-orange-50 text-orange-600'
                                  : 'bg-emerald-50 text-emerald-600'
                              }
                            `}
                          >
                            {product.is_active ? (
                              <EyeOff
                                size={14}
                              />
                            ) : (
                              <Eye
                                size={14}
                              />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteProduct(
                                product,
                              )
                            }
                            className="
                              rounded-lg
                              bg-red-50
                              p-2
                              text-red-600
                              hover:bg-red-100
                            "
                          >
                            <Trash2
                              size={14}
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

          {!filteredProducts.length && (
            <div
              className="
                p-10
                text-center
                text-xs
                text-slate-400
              "
            >
              No products found.
            </div>
          )}
        </Card>


        <Card
          className="
            mt-5
            p-6
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
              <h3
                className="
                  text-base
                  font-black
                  text-slate-900
                "
              >
                {selectedProduct
                  ? 'Edit Product / Price'
                  : 'Add Product'}
              </h3>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-slate-400
                "
              >
                All prices use # currency.
              </p>
            </div>

            {selectedProduct && (
              <button
                type="button"
                onClick={
                  resetProduct
                }
                className="
                  rounded-lg
                  bg-slate-100
                  p-2
                  text-slate-500
                "
              >
                <X
                  size={16}
                />
              </button>
            )}
          </div>


          <div
            className="
              mt-5
              grid
              grid-cols-1
              gap-4
              md:grid-cols-2
              lg:grid-cols-3
            "
          >
            <Input
              label="Product Name"
              value={
                productForm.name
              }
              onChange={(
                event,
              ) =>
                setProductForm(
                  (old) => ({
                    ...old,
                    name:
                      event.target
                        .value,
                  }),
                )
              }
              placeholder="Example: 1GB Data"
            />


            <label>
              <span
                className="
                  mb-2
                  block
                  text-xs
                  font-bold
                  text-slate-600
                "
              >
                Service
              </span>

              <select
                value={
                  productForm.service
                }
                onChange={(
                  event,
                ) =>
                  setProductForm(
                    (old) => ({
                      ...old,
                      service:
                        event.target
                          .value as ServiceKey,
                    }),
                  )
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-4
                  py-3
                  text-sm
                  outline-none
                  focus:border-blue-500
                "
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
              </select>
            </label>


            <Input
              label="Network"
              value={
                productForm.network
              }
              onChange={(
                event,
              ) =>
                setProductForm(
                  (old) => ({
                    ...old,
                    network:
                      event.target
                        .value,
                  }),
                )
              }
              placeholder="MTN / Airtel / Glo"
            />


            <Input
              label="Selling Price"
              value={
                productForm.price
              }
              onChange={(
                event,
              ) =>
                setProductForm(
                  (old) => ({
                    ...old,
                    price:
                      cleanAmount(
                        event.target
                          .value,
                      ),
                  }),
                )
              }
              placeholder="#0.00"
              inputMode="decimal"
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
                  (old) => ({
                    ...old,
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


            <Input
              label="Category"
              value={
                productForm.category
              }
              onChange={(
                event,
              ) =>
                setProductForm(
                  (old) => ({
                    ...old,
                    category:
                      event.target
                        .value,
                  }),
                )
              }
              placeholder="Optional category"
            />
          </div>


          <label
            className="
              mt-4
              block
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
                  (old) => ({
                    ...old,
                    description:
                      event.target
                        .value,
                  }),
                )
              }
              rows={3}
              className="
                w-full
                resize-none
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-4
                py-3
                text-sm
                outline-none
                focus:border-blue-500
                focus:bg-white
              "
            />
          </label>


          <label
            className="
              mt-4
              flex
              items-center
              gap-2
              text-xs
              font-bold
              text-slate-600
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
                  (old) => ({
                    ...old,
                    is_active:
                      event.target
                        .checked,
                  }),
                )
              }
            />
            Product is active
          </label>


          <div
            className="
              mt-5
              flex
              justify-end
              gap-2
            "
          >
            <Button
              kind="light"
              onClick={
                resetProduct
              }
            >
              Clear
            </Button>

            <Button
              kind="blue"
              disabled={
                savingProduct
              }
              onClick={
                saveProduct
              }
            >
              {savingProduct
                ? 'Saving...'
                : selectedProduct
                  ? 'Save Price & Product'
                  : 'Create Product'}
            </Button>
          </div>
        </Card>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | ADMINS
  |--------------------------------------------------------------------------
  */

  const adminsView =
    (
      <div>
        <SectionTitle
          title="Admins"
          subtitle="Normal admin accounts and permissions"
        />

        <Card className="p-6">
          <div
            className="
              flex
              items-start
              gap-4
              rounded-2xl
              bg-blue-50
              p-5
            "
          >
            <div
              className="
                rounded-xl
                bg-blue-100
                p-3
                text-blue-700
              "
            >
              <UserCog
                size={22}
              />
            </div>

            <div>
              <h3
                className="
                  font-black
                  text-blue-950
                "
              >
                Super Admin
              </h3>

              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-blue-800/70
                "
              >
                Super Admin has full
                control and uses the
                secure server session.
                Normal Admin accounts
                do not receive Super
                Admin privileges.
              </p>
            </div>
          </div>


          <div
            className="
              mt-6
              grid
              grid-cols-1
              gap-4
              sm:grid-cols-3
            "
          >
            <StatCard
              title="Admin Accounts"
              value={String(
                adminUsers,
              )}
              icon={
                <UserCheck
                  size={20}
                />
              }
              iconClass="
                bg-blue-50
                text-blue-700
              "
            />

            <StatCard
              title="Active Users"
              value={String(
                activeUsers,
              )}
              icon={
                <Users
                  size={20}
                />
              }
              iconClass="
                bg-emerald-50
                text-emerald-700
              "
            />

            <StatCard
              title="Customers"
              value={String(
                totalUsers -
                  adminUsers,
              )}
              icon={
                <UserCheck
                  size={20}
                />
              }
              iconClass="
                bg-indigo-50
                text-indigo-700
              "
            />
          </div>
        </Card>


        <Card
          className="
            mt-5
            overflow-hidden
          "
        >
          <div
            className="
              overflow-x-auto
            "
          >
            <table
              className="
                min-w-[700px]
                w-full
                text-left
              "
            >
              <thead
                className="
                  bg-slate-50
                  text-[10px]
                  font-black
                  uppercase
                  tracking-wider
                  text-slate-400
                "
              >
                <tr>
                  <th className="px-5 py-4">
                    Admin
                  </th>

                  <th className="px-5 py-4">
                    Email
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Joined
                  </th>

                  <th className="px-5 py-4 text-right">
                    Manage
                  </th>
                </tr>
              </thead>

              <tbody
                className="
                  divide-y
                  divide-slate-100
                "
              >
                {users
                  .filter(
                    (user) =>
                      user.is_admin ===
                      true,
                  )
                  .map(
                    (user) => (
                      <tr
                        key={
                          user.id
                        }
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
                              getUserName(
                                user,
                              )
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className="
                              text-xs
                              text-slate-500
                            "
                          >
                            {
                              user.email ||
                              '—'
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            status={
                              user.is_active ===
                              false
                                ? 'failed'
                                : 'success'
                            }
                          />
                        </td>

                        <td
                          className="
                            px-5
                            py-4
                            text-[10px]
                            text-slate-500
                          "
                        >
                          {formatDate(
                            user.created_at,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div
                            className="
                              flex
                              justify-end
                            "
                          >
                            <Button
                              kind="light"
                              onClick={() =>
                                editUser(
                                  user,
                                )
                              }
                            >
                              <Edit3
                                size={13}
                              />
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | SECURITY
  |--------------------------------------------------------------------------
  */

  const securityView =
    (
      <div>
        <SectionTitle
          title="Security"
          subtitle="Super Admin security controls"
        />

        <Card
          className="
            p-6
          "
        >
          <div
            className="
              flex
              items-center
              gap-4
            "
          >
            <div
              className="
                rounded-2xl
                bg-emerald-50
                p-4
                text-emerald-600
              "
            >
              <ShieldCheck
                size={26}
              />
            </div>

            <div>
              <h3
                className="
                  font-black
                  text-slate-900
                "
              >
                Server-side Super Admin
              </h3>

              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-slate-500
                "
              >
                Super Admin PIN and
                ClubKonnect API credentials
                must remain on the backend.
              </p>
            </div>
          </div>

          <div
            className="
              mt-6
              grid
              grid-cols-1
              gap-4
              md:grid-cols-3
            "
          >
            <div
              className="
                rounded-xl
                border
                border-emerald-100
                bg-emerald-50/50
                p-4
              "
            >
              <CheckCircle2
                size={20}
                className="
                  text-emerald-600
                "
              />

              <p
                className="
                  mt-3
                  text-xs
                  font-black
                  text-slate-800
                "
              >
                Signed Session
              </p>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-slate-500
                "
              >
                Server verifies every
                privileged request.
              </p>
            </div>

            <div
              className="
                rounded-xl
                border
                border-blue-100
                bg-blue-50/50
                p-4
              "
            >
              <Shield
                size={20}
                className="
                  text-blue-600
                "
              />

              <p
                className="
                  mt-3
                  text-xs
                  font-black
                  text-slate-800
                "
              >
                API Key Protection
              </p>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-slate-500
                "
              >
                ClubKonnect key stays
                backend-only.
              </p>
            </div>

            <div
              className="
                rounded-xl
                border
                border-orange-100
                bg-orange-50/50
                p-4
              "
            >
              <AlertCircle
                size={20}
                className="
                  text-orange-600
                "
              />

              <p
                className="
                  mt-3
                  text-xs
                  font-black
                  text-slate-800
                "
              >
                Direct Funding
              </p>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-slate-500
                "
              >
                Direct wallet adjustment
                bypasses funding requests.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | NOTIFICATIONS
  |--------------------------------------------------------------------------
  */

  const notificationsView =
    (
      <div>
        <SectionTitle
          title="Notifications"
          subtitle="Send announcements to customers"
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
              lg:col-span-1
            "
          >
            <h3
              className="
                font-black
                text-slate-900
              "
            >
              New Notification
            </h3>

            <div
              className="
                mt-5
                space-y-4
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
                    (old) => ({
                      ...old,
                      title:
                        event.target
                          .value,
                    }),
                  )
                }
              />

              <label>
                <span
                  className="
                    mb-2
                    block
                    text-xs
                    font-bold
                    text-slate-600
                  "
                >
                  Type
                </span>

                <select
                  value={
                    notificationForm.type
                  }
                  onChange={(
                    event,
                  ) =>
                    setNotificationForm(
                      (old) => ({
                        ...old,
                        type:
                          event.target
                            .value,
                      }),
                    )
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    py-3
                    text-sm
                    outline-none
                  "
                >
                  <option value="info">
                    Information
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
                </select>
              </label>

              <label>
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
                  rows={5}
                  value={
                    notificationForm.message
                  }
                  onChange={(
                    event,
                  ) =>
                    setNotificationForm(
                      (old) => ({
                        ...old,
                        message:
                          event.target
                            .value,
                      }),
                    )
                  }
                  className="
                    w-full
                    resize-none
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    py-3
                    text-sm
                    outline-none
                    focus:border-blue-500
                  "
                />
              </label>

              <Button
                kind="blue"
                disabled={
                  sendingNotification
                }
                onClick={
                  sendNotification
                }
              >
                <Bell
                  size={14}
                />
                {sendingNotification
                  ? 'Sending...'
                  : 'Send Notification'}
              </Button>
            </div>
          </Card>


          <Card
            className="
              overflow-hidden
              lg:col-span-2
            "
          >
            <div
              className="
                border-b
                border-slate-100
                p-5
              "
            >
              <h3
                className="
                  font-black
                  text-slate-900
                "
              >
                Recent Notifications
              </h3>
            </div>

            <div
              className="
                divide-y
                divide-slate-100
              "
            >
              {notifications.map(
                (
                  notification,
                ) => (
                  <div
                    key={
                      notification.id
                    }
                    className="
                      flex
                      items-start
                      justify-between
                      gap-4
                      p-5
                    "
                  >
                    <div>
                      <p
                        className="
                          text-sm
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
                          text-xs
                          leading-5
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

                    <button
                      type="button"
                      onClick={() =>
                        deleteNotification(
                          notification.id,
                        )
                      }
                      className="
                        rounded-lg
                        bg-red-50
                        p-2
                        text-red-600
                        hover:bg-red-100
                      "
                    >
                      <Trash2
                        size={14}
                      />
                    </button>
                  </div>
                ),
              )}

              {!notifications.length && (
                <div
                  className="
                    p-10
                    text-center
                    text-xs
                    text-slate-400
                  "
                >
                  No notifications.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | SETTINGS
  |--------------------------------------------------------------------------
  */

  const settingsView =
    (
      <div>
        <SectionTitle
          title="Settings"
          subtitle="Super Admin dashboard settings"
        />

        <div
          className="
            grid
            grid-cols-1
            gap-5
            lg:grid-cols-2
          "
        >
          <Card
            className="p-6"
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-4
              "
            >
              <div>
                <h3
                  className="
                    font-black
                    text-slate-900
                  "
                >
                  Maintenance Mode
                </h3>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-slate-500
                  "
                >
                  Local dashboard control.
                  Connect this to your
                  application setting when
                  the backend maintenance
                  endpoint is available.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMaintenance(
                    (value) =>
                      !value,
                  )
                }
                className={`
                  relative
                  h-7
                  w-12
                  rounded-full
                  transition
                  ${
                    maintenance
                      ? 'bg-blue-600'
                      : 'bg-slate-200'
                  }
                `}
              >
                <span
                  className={`
                    absolute
                    top-1
                    h-5
                    w-5
                    rounded-full
                    bg-white
                    shadow
                    transition
                    ${
                      maintenance
                        ? 'left-6'
                        : 'left-1'
                    }
                  `}
                />
              </button>
            </div>
          </Card>


          <Card
            className="p-6"
          >
            <h3
              className="
                font-black
                text-slate-900
              "
            >
              Currency
            </h3>

            <div
              className="
                mt-4
                rounded-xl
                bg-slate-50
                p-4
              "
            >
              <p
                className="
                  text-2xl
                  font-black
                  text-slate-900
                "
              >
                #1,000.00
              </p>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-slate-400
                "
              >
                GY DATA uses # throughout
                the Super Admin dashboard.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | SELECT CONTENT
  |--------------------------------------------------------------------------
  */

  let content:
    ReactNode =
    overviewView;

  if (
    section ===
    'users'
  ) {
    content =
      usersView;
  }

  if (
    section ===
    'wallet'
  ) {
    content =
      walletView;
  }

  if (
    section ===
    'transactions'
  ) {
    content =
      transactionsView;
  }

  if (
    section ===
    'revenue'
  ) {
    content =
      revenueView;
  }

  if (
    section ===
    'funding'
  ) {
    content =
      fundingView;
  }

  if (
    section ===
    'services'
  ) {
    content =
      servicesView;
  }

  if (
    section ===
    'admins'
  ) {
    content =
      adminsView;
  }

  if (
    section ===
    'security'
  ) {
    content =
      securityView;
  }

  if (
    section ===
    'notifications'
  ) {
    content =
      notificationsView;
  }

  if (
    section ===
    'settings'
  ) {
    content =
      settingsView;
  }


  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const logout =
    () => {
      localStorage.removeItem(
        SUPER_ADMIN_SESSION,
      );

      localStorage.removeItem(
        SUPER_ADMIN_SESSION_EXPIRY,
      );

      navigate(
        '/super-admin-login',
        {
          replace: true,
        },
      );
    };


  /*
  |--------------------------------------------------------------------------
  | RENDER
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

      {/* MOBILE OVERLAY */}
      {mobileMenu && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() =>
            setMobileMenu(
              false,
            )
          }
          className="
            fixed
            inset-0
            z-40
            bg-slate-950/50
            lg:hidden
          "
        />
      )}


      {/* SIDEBAR */}
      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          flex
          w-72
          flex-col
          bg-[#071a41]
          text-white
          shadow-2xl
          transition-transform
          duration-200
          lg:translate-x-0
          ${
            mobileMenu
              ? 'translate-x-0'
              : '-translate-x-full'
          }
        `}
      >

        {/* BRAND */}
        <div
          className="
            border-b
            border-white/10
            px-5
            py-5
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
                rounded-2xl
                bg-blue-600
                p-3
                shadow-lg
                shadow-blue-950/20
              "
            >
              <Zap
                size={21}
              />
            </div>

            <div>
              <p
                className="
                  text-sm
                  font-black
                  tracking-wide
                "
              >
                GY DATA
              </p>

              <p
                className="
                  mt-0.5
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.25em]
                  text-blue-300
                "
              >
                Super Admin
              </p>
            </div>
          </div>
        </div>


        {/* NAVIGATION */}
        <nav
          className="
            flex-1
            space-y-1
            overflow-y-auto
            px-3
            py-4
          "
        >
          {navItems.map(
            (item) => (
              <button
                type="button"
                key={
                  item.key
                }
                onClick={() =>
                  goTo(
                    item.key,
                  )
                }
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
                    section ===
                    item.key
                      ? `
                        bg-blue-600
                        text-white
                        shadow-lg
                        shadow-blue-950/20
                      `
                      : `
                        text-blue-100/75
                        hover:bg-white/10
                        hover:text-white
                      `
                  }
                `}
              >
                {item.icon}

                <span>
                  {item.label}
                </span>

                {item.key ===
                  'funding' &&
                  fundingRequests.length >
                    0 && (
                    <span
                      className="
                        ml-auto
                        rounded-full
                        bg-orange-500
                        px-2
                        py-0.5
                        text-[9px]
                        font-black
                        text-white
                      "
                    >
                      {
                        fundingRequests.length
                      }
                    </span>
                  )}
              </button>
            ),
          )}
        </nav>


        {/* EXIT */}
        <div
          className="
            border-t
            border-white/10
            p-3
          "
        >
          <button
            type="button"
            onClick={
              logout
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
              text-blue-100/75
              hover:bg-red-500/10
              hover:text-red-200
            "
          >
            <LogOut
              size={17}
            />

            Exit Super Admin
          </button>
        </div>
      </aside>


      {/* MAIN */}
      <div
        className="
          min-h-screen
          lg:pl-72
        "
      >

        {/* TOP BAR */}
        <header
          className="
            sticky
            top-0
            z-30
            border-b
            border-slate-200
            bg-white/95
            backdrop-blur
          "
        >
          <div
            className="
              flex
              h-16
              items-center
              justify-between
              gap-4
              px-4
              sm:px-6
              lg:px-8
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
                  setMobileMenu(
                    true,
                  )
                }
                className="
                  rounded-xl
                  bg-slate-100
                  p-2
                  text-slate-700
                  lg:hidden
                "
              >
                <Menu
                  size={19}
                />
              </button>

              <div>
                <p
                  className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.2em]
                    text-blue-600
                  "
                >
                  GY DATA
                </p>

                <h1
                  className="
                    text-sm
                    font-black
                    text-slate-900
                  "
                >
                  {navItems.find(
                    (
                      item,
                    ) =>
                      item.key ===
                      section,
                  )?.label ||
                    'Overview'}
                </h1>
              </div>
            </div>


            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <div
                className="
                  hidden
                  items-center
                  gap-2
                  rounded-full
                  bg-emerald-50
                  px-3
                  py-2
                  sm:flex
                "
              >
                <span
                  className="
                    h-2
                    w-2
                    rounded-full
                    bg-emerald-500
                  "
                />

                <span
                  className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-wider
                    text-emerald-700
                  "
                >
                  Super Admin
                </span>
              </div>

              <button
                type="button"
                onClick={
                  loadAll
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  p-2.5
                  text-slate-600
                  hover:border-blue-200
                  hover:text-blue-700
                "
                title="Refresh dashboard"
              >
                <RefreshCw
                  size={16}
                  className={
                    loading
                      ? 'animate-spin'
                      : ''
                  }
                />
              </button>
            </div>
          </div>
        </header>


        {/* NOTICE */}
        {notice && (
          <div
            className="
              fixed
              right-4
              top-20
              z-[100]
              w-[calc(100%-2rem)]
              max-w-sm
            "
          >
            <div
              className={`
                flex
                items-start
                gap-3
                rounded-2xl
                border
                p-4
                shadow-xl
                ${
                  notice.type ===
                  'success'
                    ? `
                      border-emerald-200
                      bg-emerald-50
                      text-emerald-800
                    `
                    : notice.type ===
                        'pending'
                      ? `
                        border-orange-200
                        bg-orange-50
                        text-orange-800
                      `
                      : `
                        border-red-200
                        bg-red-50
                        text-red-800
                      `
                }
              `}
            >
              {notice.type ===
              'success' ? (
                <CheckCircle2
                  size={18}
                  className="
                    mt-0.5
                    shrink-0
                  "
                />
              ) : notice.type ===
                'pending' ? (
                <Clock3
                  size={18}
                  className="
                    mt-0.5
                    shrink-0
                  "
                />
              ) : (
                <XCircle
                  size={18}
                  className="
                    mt-0.5
                    shrink-0
                  "
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
                {
                  notice.message
                }
              </p>

              <button
                type="button"
                onClick={() =>
                  setNotice(
                    null,
                  )
                }
                className="
                  opacity-60
                  hover:opacity-100
                "
              >
                <X
                  size={15}
                />
              </button>
            </div>
          </div>
        )}


        {/* CONTENT */}
        <main
          className="
            mx-auto
            w-full
            max-w-[1600px]
            px-4
            py-6
            sm:px-6
            lg:px-8
          "
        >
          {content}
        </main>


        {/* FOOTER */}
        <footer
          className="
            border-t
            border-slate-200
            px-4
            py-6
            sm:px-6
            lg:px-8
          "
        >
          <div
            className="
              mx-auto
              flex
              max-w-[1600px]
              flex-col
              gap-2
              text-[9px]
              text-slate-400
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <span>
              GY DATA · Endless Joy
            </span>

            <span>
              Super Admin Control
              Center
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
