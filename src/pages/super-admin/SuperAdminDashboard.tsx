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


const API_URL = String(import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

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
              text-[#071a41]
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
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: 'blue' | 'green' | 'orange' | 'red' | 'slate';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  const kinds = {
    blue:
      'bg-[#082b82] text-white hover:bg-[#071f61]',
    green:
      'bg-emerald-600 text-white hover:bg-emerald-700',
    orange:
      'bg-orange-500 text-white hover:bg-orange-600',
    red:
      'bg-red-600 text-white hover:bg-red-700',
    slate:
      'bg-slate-100 text-slate-700 hover:bg-slate-200',
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
        transition
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${kinds[kind]}
        ${className}
      `}
    >
      {children}
    </button>
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


  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

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
    useState<Product[]>([]);

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      NotificationItem[]
    >([]);

  const [
    notice,
    setNotice,
  ] =
    useState<
      NoticeState | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    clubLoading,
    setClubLoading,
  ] =
    useState(false);

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
    clubError,
    setClubError,
  ] =
    useState('');

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
    search,
    setSearch,
  ] =
    useState('');

  const [
    selectedService,
    setSelectedService,
  ] =
    useState<ServiceKey>(
      'data',
    );

  const [
    editingProduct,
    setEditingProduct,
  ] =
    useState<Product | null>(
      null,
    );

  const [
    productModal,
    setProductModal,
  ] =
    useState(false);

  const [
    deletingProduct,
    setDeletingProduct,
  ] =
    useState<string | null>(
      null,
    );


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
  | NAVIGATION
  |--------------------------------------------------------------------------
  */

  const goTo =
    useCallback(
      (
        next: Section,
      ) => {
        setSection(next);
        setMobileMenu(false);
      },
      [],
    );


  const backToDashboard =
    useCallback(() => {
      setSection(
        'overview',
      );
      setMobileMenu(false);
    }, []);


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
            .select(
              'id,phone,full_name,email,wallet_balance,is_admin,is_active,created_at',
            )
            .order(
              'created_at',
              {
                ascending:
                  false,
              },
            )
            .limit(500);

        if (error) {
          console.error(
            'Users:',
            error,
          );
          return;
        }

        setUsers(
          (data ||
            []) as User[],
        );
      },
      [],
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
              `${API_URL}/api/funding/requests?status=pending`,
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
              `${API_URL}/api/clubkonnect/balance`,
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
              result.balance,
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

          setClubBalance(
            null,
          );

          setClubConnected(
            false,
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
  | LOAD EVERYTHING
  |--------------------------------------------------------------------------
  */

  const loadDashboard =
    useCallback(
      async () => {
        setLoading(
          true,
        );

        try {
          await Promise.all([
            loadUsers(),
            loadTransactions(),
            loadFunding(),
            loadProducts(),
            loadNotifications(),
            loadClubKonnect(),
          ]);
        } finally {
          setLoading(
            false,
          );
        }
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

      return;
    }

    loadDashboard();
  }, [
    navigate,
    loadDashboard,
  ]);


  /*
  |--------------------------------------------------------------------------
  | FILTERED USERS
  |--------------------------------------------------------------------------
  */

  const filteredUsers =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase();

        if (!term) {
          return users;
        }

        return users.filter(
          (user) =>
            String(
              user.phone ||
                '',
            )
              .toLowerCase()
              .includes(term) ||
            String(
              user.name ||
                user.full_name ||
                '',
            )
              .toLowerCase()
              .includes(term) ||
            String(
              user.email ||
                '',
            )
              .toLowerCase()
              .includes(term),
        );
      },
      [
        users,
        search,
      ],
    );


  /*
  |--------------------------------------------------------------------------
  | WALLET BALANCE
  |--------------------------------------------------------------------------
  */

  const walletBalance =
    useMemo(
      () =>
        users.reduce(
          (
            total,
            user,
          ) =>
            total +
            numberValue(
              user.wallet_balance,
            ),
          0,
        ),
      [users],
    );


  /*
  |--------------------------------------------------------------------------
  | REVENUE
  |--------------------------------------------------------------------------
  */

  const successfulTransactions =
    useMemo(
      () =>
        transactions.filter(
          (transaction) =>
            statusKind(
              transaction.status,
            ) ===
            'success',
        ),
      [transactions],
    );


  const revenue =
    useMemo(
      () =>
        successfulTransactions.reduce(
          (
            total,
            transaction,
          ) =>
            total +
            numberValue(
              transaction.amount,
            ),
          0,
        ),
      [
        successfulTransactions,
      ],
    );


  /*
  |--------------------------------------------------------------------------
  | ADMIN ADJUST WALLET
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
            `${API_URL}/api/funding/admin-adjust`,
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
            `${API_URL}/api/funding/approve`,
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
            `${API_URL}/api/funding/reject`,
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
          'Funding request rejected successfully',
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
  | PRODUCT SAVE
  |--------------------------------------------------------------------------
  */

  const saveProduct =
    async (
      product: Product,
    ) => {
      try {
        const payload = {
          service:
            product.service,
          name:
            product.name,
          price:
            numberValue(
              product.price,
            ),
          network:
            product.network ||
            null,
          description:
            product.description ||
            null,
          category:
            product.category ||
            null,
          cashback_percent:
            numberValue(
              product.cashback_percent,
            ),
          is_active:
            product.is_active,
        };

        if (
          product.id
        ) {
          const {
            error,
          } =
            await supabase
              .from(
                'products',
              )
              .update(
                payload,
              )
              .eq(
                'id',
                product.id,
              );

          if (error) {
            throw error;
          }
        } else {
          const {
            error,
          } =
            await supabase
              .from(
                'products',
              )
              .insert(
                payload,
              );

          if (error) {
            throw error;
          }
        }

        showNotice(
          'Product saved successfully',
          'success',
        );

        setProductModal(
          false,
        );

        setEditingProduct(
          null,
        );

        await loadProducts();
      } catch (error) {
        console.error(
          'Save product:',
          error,
        );

        showNotice(
          error instanceof
            Error
            ? error.message
            : 'Unable to save product',
          'error',
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | PRODUCT DELETE
  |--------------------------------------------------------------------------
  */

  const deleteProduct =
    async (
      id: string,
    ) => {
      setDeletingProduct(
        id,
      );

      try {
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
              id,
            );

        if (error) {
          throw error;
        }

        showNotice(
          'Product deleted successfully',
          'success',
        );

        await loadProducts();
      } catch (error) {
        console.error(
          'Delete product:',
          error,
        );

        showNotice(
          error instanceof
            Error
            ? error.message
            : 'Unable to delete product',
          'error',
        );
      } finally {
        setDeletingProduct(
          null,
        );
      }
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
      try {
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
          throw error;
        }

        await loadProducts();
      } catch (error) {
        showNotice(
          error instanceof
            Error
            ? error.message
            : 'Unable to update product',
          'error',
        );
      }
    };


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
  | NAV ITEMS
  |--------------------------------------------------------------------------
  */

  const navItems: {
    key: Section;
    label: string;
    icon: ReactNode;
    badge?: number;
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
        <Activity
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
      badge:
        fundingRequests.length,
    },
    {
      key: 'services',
      label: 'Products & Services',
      icon:
        <Package
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
      key: 'revenue',
      label: 'Revenue',
      icon:
        <TrendingUp
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
        <Shield
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
      badge:
        notifications.length,
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
  | SIDEBAR
  |--------------------------------------------------------------------------
  */

  const sidebar =
    (
      <aside
        className="
          flex
          h-full
          w-[260px]
          shrink-0
          flex-col
          bg-[#071a41]
          text-white
        "
      >
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
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-blue-500/20
                text-blue-300
              "
            >
              <ShieldCheck
                size={21}
              />
            </div>

            <div>
              <p
                className="
                  text-sm
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
                  tracking-[0.18em]
                  text-blue-300
                "
              >
                Super Admin
              </p>
            </div>
          </div>
        </div>


        <nav
          className="
            flex-1
            space-y-1
            overflow-y-auto
            p-3
          "
        >
          {navItems.map(
            (item) => (
              <button
                key={
                  item.key
                }
                type="button"
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
                        bg-white
                        text-[#071a41]
                        shadow-sm
                      `
                      : `
                        text-white/65
                        hover:bg-white/5
                        hover:text-white
                      `
                  }
                `}
              >
                {item.icon}

                <span
                  className="flex-1"
                >
                  {item.label}
                </span>

                {!!item.badge &&
                  item.badge >
                    0 && (
                    <span
                      className="
                        rounded-full
                        bg-orange-500
                        px-1.5
                        py-0.5
                        text-[9px]
                        text-white
                      "
                    >
                      {item.badge}
                    </span>
                  )}
              </button>
            ),
          )}
        </nav>


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
              text-left
              text-xs
              font-bold
              text-white/60
              transition
              hover:bg-red-500/10
              hover:text-red-300
            "
          >
            <LogOut
              size={18}
            />

            Logout
          </button>
        </div>
      </aside>
    );


  /*
  |--------------------------------------------------------------------------
  | HEADER
  |--------------------------------------------------------------------------
  */

  const header =
    (
      <header
        className="
          sticky
          top-0
          z-30
          flex
          h-[68px]
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
              setMobileMenu(
                true,
              )
            }
            className="
              rounded-xl
              p-2
              text-slate-600
              hover:bg-slate-100
              lg:hidden
            "
          >
            <Menu
              size={21}
            />
          </button>

          <div>
            <p
              className="
                text-[9px]
                font-black
                uppercase
                tracking-[0.18em]
                text-blue-600
              "
            >
              Control Center
            </p>

            <h1
              className="
                text-base
                font-black
                text-[#071a41]
              "
            >
              Super Admin
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
          <Button
            kind="slate"
            onClick={
              loadDashboard
            }
            disabled={
              loading
            }
            className="
              !px-3
              !py-2
            "
          >
            <RefreshCw
              size={14}
              className={
                loading
                  ? 'animate-spin'
                  : ''
              }
            />

            <span
              className="hidden sm:inline"
            >
              Refresh
            </span>
          </Button>

          <div
            className="
              hidden
              items-center
              gap-2
              rounded-full
              bg-emerald-50
              px-3
              py-2
              text-[10px]
              font-bold
              text-emerald-700
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

            Secure
          </div>
        </div>
      </header>
    );


  /*
  |--------------------------------------------------------------------------
  | OVERVIEW
  |--------------------------------------------------------------------------
  */

  const overviewView =
    (
      <div>
        <SectionTitle
          title="Dashboard Overview"
          subtitle="Real-time control center"
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
            title="Main Wallet"
            value={money(
              walletBalance,
            )}
            icon={
              <Wallet
                size={20}
              />
            }
            iconClass="
              bg-blue-50
              text-blue-700
            "
            onClick={() =>
              goTo(
                'wallet',
              )
            }
            loading={
              loading
            }
          />

          <StatCard
            title="Customers"
            value={String(
              users.length,
            )}
            icon={
              <Users
                size={20}
              />
            }
            iconClass="
              bg-violet-50
              text-violet-700
            "
            onClick={() =>
              goTo(
                'users',
              )
            }
          />

          <StatCard
            title="Revenue"
            value={money(
              revenue,
            )}
            icon={
              <TrendingUp
                size={20}
              />
            }
            iconClass="
              bg-emerald-50
              text-emerald-700
            "
            onClick={() =>
              goTo(
                'revenue',
              )
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
              goTo(
                'funding',
              )
            }
          />
        </div>


        <div
          className="
            mt-5
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
                {users.length}
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
                justify-between
                gap-3
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
                  ClubKonnect Balance
                </h3>

                <p
                  className="
                    mt-1
                    text-[11px]
                    text-slate-500
                  "
                >
                  Provider wallet connection
                </p>
              </div>

              <Button
                kind="slate"
                onClick={
                  loadClubKonnect
                }
                disabled={
                  clubLoading
                }
              >
                <RefreshCw
                  size={14}
                  className={
                    clubLoading
                      ? 'animate-spin'
                      : ''
                  }
                />

                Refresh Balance
              </Button>
            </div>


            <div
              className="
                mt-6
                flex
                flex-col
                gap-5
                sm:flex-row
                sm:items-end
                sm:justify-between
              "
            >
              <div>
                <p
                  className="
                    text-3xl
                    font-black
                    text-[#071a41]
                  "
                >
                  {clubConnected &&
                  clubBalance !==
                    null
                    ? money(
                        clubBalance,
                      )
                    : '—'}
                </p>

                <div
                  className="
                    mt-2
                    flex
                    items-center
                    gap-2
                  "
                >
                  <span
                    className={`
                      h-2
                      w-2
                      rounded-full
                      ${
                        clubConnected
                          ? 'bg-emerald-500'
                          : 'bg-red-500'
                      }
                    `}
                  />

                  <span
                    className={`
                      text-xs
                      font-bold
                      ${
                        clubConnected
                          ? 'text-emerald-700'
                          : 'text-red-700'
                      }
                    `}
                  >
                    {clubConnected
                      ? 'Connected'
                      : 'Connection failed'}
                  </span>
                </div>
              </div>

              <p
                className="
                  max-w-xs
                  text-[10px]
                  leading-5
                  text-slate-400
                "
              >
                ClubKonnect balance is
                separate from the customer
                Main Wallet.
              </p>
            </div>

            {clubError && (
              <div
                className="
                  mt-4
                  rounded-xl
                  bg-red-50
                  px-4
                  py-3
                  text-xs
                  font-semibold
                  text-red-700
                "
              >
                {clubError}
              </div>
            )}
          </Card>
        </div>


        <div
          className="
            mt-5
            grid
            grid-cols-2
            gap-4
            sm:grid-cols-3
            lg:grid-cols-6
          "
        >
          {navItems
            .filter(
              (item) =>
                item.key !==
                'overview',
            )
            .map(
              (item) => (
                <Card
                  key={
                    item.key
                  }
                  onClick={() =>
                    goTo(
                      item.key,
                    )
                  }
                  className="
                    p-4
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-2
                    "
                  >
                    <span
                      className="
                        rounded-xl
                        bg-slate-100
                        p-2.5
                        text-slate-700
                      "
                    >
                      {item.icon}
                    </span>

                    <ChevronRight
                      size={15}
                      className="
                        text-slate-300
                      "
                    />
                  </div>

                  <p
                    className="
                      mt-3
                      text-[11px]
                      font-black
                      text-slate-700
                    "
                  >
                    {item.label}
                  </p>
                </Card>
              ),
            )}
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
          title="Wallet"
          subtitle="Customer Main Wallet balances"
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
            "
          >
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

            <p
              className="
                mt-4
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
                text-blue-100/60
              "
            >
              profiles.wallet_balance
            </p>
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
                  Customer Wallets
                </h3>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-500
                  "
                >
                  Current balances
                </p>
              </div>

              <Button
                kind="slate"
                onClick={
                  loadUsers
                }
              >
                <RefreshCw
                  size={14}
                />
                Refresh
              </Button>
            </div>

            <div
              className="
                mt-5
                overflow-x-auto
              "
            >
              <table
                className="
                  w-full
                  min-w-[620px]
                  text-left
                "
              >
                <thead>
                  <tr
                    className="
                      border-b
                      border-slate-100
                      text-[10px]
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    <th
                      className="pb-3"
                    >
                      Customer
                    </th>

                    <th
                      className="pb-3"
                    >
                      Phone
                    </th>

                    <th
                      className="pb-3"
                    >
                      Balance
                    </th>

                    <th
                      className="pb-3"
                    >
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users
                    .slice(
                      0,
                      20,
                    )
                    .map(
                      (
                        user,
                      ) => (
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
                          <td
                            className="
                              py-3
                              text-xs
                              font-bold
                              text-slate-700
                            "
                          >
                            {getUserName(
                              user,
                            )}
                          </td>

                          <td
                            className="
                              py-3
                              text-xs
                              text-slate-500
                            "
                          >
                            {user.phone}
                          </td>

                          <td
                            className="
                              py-3
                              text-xs
                              font-black
                              text-slate-800
                            "
                          >
                            {money(
                              user.wallet_balance,
                            )}
                          </td>

                          <td
                            className="py-3"
                          >
                            <StatusBadge
                              status={
                                user.is_active ===
                                false
                                  ? 'failed'
                                  : 'success'
                              }
                            />
                          </td>
                        </tr>
                      ),
                    )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
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
          subtitle="Latest customer transactions"
          action={
            <Button
              kind="slate"
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

        <Card
          className="overflow-hidden"
        >
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
              <thead
                className="
                  bg-slate-50
                "
              >
                <tr
                  className="
                    text-[10px]
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  <th
                    className="
                      px-5
                      py-4
                    "
                  >
                    Customer
                  </th>

                  <th
                    className="
                      px-5
                      py-4
                    "
                  >
                    Service
                  </th>

                  <th
                    className="
                      px-5
                      py-4
                    "
                  >
                    Amount
                  </th>

                  <th
                    className="
                      px-5
                      py-4
                    "
                  >
                    Status
                  </th>

                  <th
                    className="
                      px-5
                      py-4
                    "
                  >
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {transactions.map(
                  (
                    transaction,
                  ) => (
                    <tr
                      key={
                        transaction.id
                      }
                      className="
                        border-t
                        border-slate-100
                      "
                    >
                      <td
                        className="
                          px-5
                          py-4
                        "
                      >
                        <p
                          className="
                            text-xs
                            font-bold
                            text-slate-800
                          "
                        >
                          {transaction.phone ||
                            transaction.recipient ||
                            '—'}
                        </p>

                        {transaction.reference && (
                          <p
                            className="
                              mt-1
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

                      <td
                        className="
                          px-5
                          py-4
                          text-xs
                          text-slate-600
                        "
                      >
                        {transaction.service ||
                          transaction.product ||
                          transaction.type ||
                          '—'}
                      </td>

                      <td
                        className="
                          px-5
                          py-4
                          text-xs
                          font-black
                          text-slate-800
                        "
                      >
                        {money(
                          transaction.amount,
                        )}
                      </td>

                      <td
                        className="
                          px-5
                          py-4
                        "
                      >
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
                px-5
                py-12
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
  | FUNDING
  |--------------------------------------------------------------------------
  */

  const fundingView =
    (
      <div>
        <SectionTitle
          title="Funding"
          subtitle="Customer funding approval queue"
          action={
            <Button
              kind="slate"
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

        <Card
          className="
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
                w-full
                min-w-[850px]
                text-left
              "
            >
              <thead
                className="
                  bg-slate-50
                "
              >
                <tr
                  className="
                    text-[10px]
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  <th
                    className="
                      px-5
                      py-4
                    "
                  >
                    Customer
                  </th>

                  <th
                    className="
                      px-5
                      py-4
                    "
                  >
                    Amount
                  </th>

                  <th
                    className="
                      px-5
                      py-4
                    "
                  >
                    Reason
                  </th>

                  <th
                    className="
                      px-5
                      py-4
                    "
                  >
                    Status
                  </th>

                  <th
                    className="
                      px-5
                      py-4
                    "
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {fundingRequests.map(
                  (
                    request,
                  ) => (
                    <tr
                      key={
                        request.id
                      }
                      className="
                        border-t
                        border-slate-100
                      "
                    >
                      <td
                        className="
                          px-5
                          py-4
                          text-xs
                          font-bold
                          text-slate-800
                        "
                      >
                        {request.phone ||
                          '—'}
                      </td>

                      <td
                        className="
                          px-5
                          py-4
                          text-xs
                          font-black
                          text-slate-800
                        "
                      >
                        {money(
                          request.amount,
                        )}
                      </td>

                      <td
                        className="
                          px-5
                          py-4
                          text-xs
                          text-slate-500
                        "
                      >
                        {request.reason ||
                          request.notes ||
                          '—'}
                      </td>

                      <td
                        className="
                          px-5
                          py-4
                        "
                      >
                        <StatusBadge
                          status={
                            request.status
                          }
                        />
                      </td>

                      <td
                        className="
                          px-5
                          py-4
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
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
                              size={14}
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
                              size={14}
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
                px-5
                py-12
                text-center
                text-xs
                text-slate-400
              "
            >
              No pending funding
              requests.
            </div>
          )}
        </Card>
      </div>
    );


  /*
  |--------------------------------------------------------------------------
  | WALLET ADJUSTMENT
  |--------------------------------------------------------------------------
  */

  const walletAdjustmentView =
    (
      <div>
        <SectionTitle
          title="Wallet Adjustment"
          subtitle="Direct Super Admin customer wallet funding"
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
              Customer Main Wallet
            </p>
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
