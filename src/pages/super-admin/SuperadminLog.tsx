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

import { supabase } from '../../lib/supabase';

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

type NoticeType = 'success' | 'pending' | 'error';

type Notice = {
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

const SESSION_KEY =
  'gydata_super_admin_session';

const EXPIRY_KEY =
  'gydata_super_admin_session_expiry';

const SERVICES: {
  key: ServiceKey;
  label: string;
  icon: ReactNode;
}[] = [
  {
    key: 'data',
    label: 'Data',
    icon: <Database size={18} />,
  },
  {
    key: 'airtime',
    label: 'Airtime',
    icon: <Zap size={18} />,
  },
  {
    key: 'electricity',
    label: 'Electricity',
    icon: <Landmark size={18} />,
  },
  {
    key: 'cable',
    label: 'Cable TV',
    icon: <CreditCard size={18} />,
  },
  {
    key: 'waec',
    label: 'WAEC PIN',
    icon: <ShieldCheck size={18} />,
  },
  {
    key: 'jamb',
    label: 'JAMB PIN',
    icon: <Shield size={18} />,
  },
  {
    key: 'betting',
    label: 'Betting',
    icon: <Activity size={18} />,
  },
  {
    key: 'smile',
    label: 'Smile',
    icon: <Server size={18} />,
  },
  {
    key: 'internet',
    label: 'Internet',
    icon: <Database size={18} />,
  },
];

const money = (value: unknown) =>
  `₦${Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const num = (value: unknown) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
};

const cleanPhone = (value: string) =>
  value.replace(/\D/g, '').trim();

const cleanAmount = (value: string) =>
  value.replace(/,/g, '').trim();

const dateText = (value?: string | null) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const userName = (user: User) =>
  user.name ||
  user.full_name ||
  user.phone ||
  'Customer';

const getToken = () =>
  localStorage.getItem(SESSION_KEY);

const authHeaders = () => {
  const token = getToken();

  return {
    'Content-Type': 'application/json',
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
};

const initials = (user: User) =>
  userName(user)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join('')
    .toUpperCase();

function StatusBadge({
  status,
}: {
  status?: string | null;
}) {
  const value =
    String(status || 'unknown').toLowerCase();

  const success =
    value === 'success' ||
    value === 'successful' ||
    value === 'completed' ||
    value === 'approved' ||
    value === 'active';

  const danger =
    value === 'failed' ||
    value === 'rejected' ||
    value === 'cancelled' ||
    value === 'inactive';

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1',
        'text-[10px] font-bold uppercase',
        success
          ? 'bg-emerald-50 text-emerald-700'
          : danger
          ? 'bg-red-50 text-red-700'
          : 'bg-amber-50 text-amber-700',
      ].join(' ')}
    >
      {status || 'Unknown'}
    </span>
  );
}

function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        'rounded-2xl border border-slate-100 bg-white',
        'shadow-[0_4px_20px_rgba(15,23,42,0.04)]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
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
      className={[
        'inline-flex items-center justify-center gap-2',
        'rounded-xl px-4 py-2.5 text-xs font-bold',
        'shadow-sm transition disabled:cursor-not-allowed',
        'disabled:opacity-50',
        styles[kind],
      ].join(' ')}
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
  disabled = false,
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
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-600">
        {label}
      </span>

      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className={[
          'w-full rounded-xl border border-slate-200',
          'bg-slate-50 px-4 py-3 text-sm text-slate-900',
          'outline-none transition',
          'focus:border-blue-500 focus:bg-white',
          'focus:ring-4 focus:ring-blue-500/10',
          'disabled:cursor-not-allowed disabled:opacity-60',
        ].join(' ')}
      />
    </label>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  description?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-xl font-black text-[#071a41]">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-[10px] text-slate-400">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const [section, setSection] =
    useState<Section>('overview');

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [notice, setNotice] =
    useState<Notice | null>(null);

  const [users, setUsers] =
    useState<User[]>([]);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [fundingRequests, setFundingRequests] =
    useState<FundingRequest[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  /*
   * WALLET FORM
   *
   * These states are intentionally kept
   * independent from data loading.
   *
   * DO NOT call loadAll/loadUsers from
   * the amount input onChange.
   *
   * This prevents the keyboard/focus bug.
   */
  const [adjustmentPhone, setAdjustmentPhone] =
    useState('');

  const [adjustmentAmount, setAdjustmentAmount] =
    useState('');

  const [adjustmentType, setAdjustmentType] =
    useState<'fund' | 'refund'>('fund');

  const [adjustmentReason, setAdjustmentReason] =
    useState('');

  const [adjustingWallet, setAdjustingWallet] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [productForm, setProductForm] =
    useState({
      name: '',
      service: 'data' as ServiceKey,
      network: '',
      price: '',
      description: '',
      category: '',
      cashback_percent: '',
      is_active: true,
    });

  const [userForm, setUserForm] =
    useState({
      name: '',
      email: '',
      is_active: true,
      is_admin: false,
    });

  const [notificationForm, setNotificationForm] =
    useState({
      title: '',
      message: '',
      type: 'info',
    });

  const [savingProduct, setSavingProduct] =
    useState(false);

  const [savingUser, setSavingUser] =
    useState(false);

  const [sendingNotification, setSendingNotification] =
    useState(false);

  const [clubBalance, setClubBalance] =
    useState<number | null>(null);

  const [clubConnected, setClubConnected] =
    useState(false);

  const [clubLoading, setClubLoading] =
    useState(false);

  const [clubError, setClubError] =
    useState('');

  const [showBalance, setShowBalance] =
    useState(true);

  const [maintenance, setMaintenance] =
    useState(false);

  const showNotice = useCallback(
    (
      message: string,
      type: NoticeType = 'success',
    ) => {
      setNotice({
        message,
        type,
      });

      window.setTimeout(() => {
        setNotice(null);
      }, 3500);
    },
    [],
  );

  /*
   * AUTH GUARD
   */
  useEffect(() => {
    const token = getToken();

    const expiry = Number(
      localStorage.getItem(
        EXPIRY_KEY,
      ) || 0,
    );

    if (
      !token ||
      !expiry ||
      expiry <= Date.now()
    ) {
      localStorage.removeItem(
        SESSION_KEY,
      );

      localStorage.removeItem(
        EXPIRY_KEY,
      );

      navigate(
        '/super-admin-login',
        {
          replace: true,
        },
      );
    }
  }, [navigate]);

  /*
   * USERS
   */
  const loadUsers = useCallback(
    async () => {
      const { data, error } =
        await supabase
          .from('profiles')
          .select('*')
          .order('created_at', {
            ascending: false,
          });

      if (error) {
        console.error(
          'Super Admin users:',
          error,
        );

        showNotice(
          error.message,
          'error',
        );

        return;
      }

      setUsers(
        (data || []) as User[],
      );
    },
    [showNotice],
  );

  /*
   * TRANSACTIONS
   */
  const loadTransactions =
    useCallback(async () => {
      const { data, error } =
        await supabase
          .from('transactions')
          .select('*')
          .order('created_at', {
            ascending: false,
          })
          .limit(200);

      if (error) {
        console.error(
          'Super Admin transactions:',
          error,
        );
        return;
      }

      setTransactions(
        (data || []) as Transaction[],
      );
    }, []);

  /*
   * FUNDING REQUESTS
   */
  const loadFunding =
    useCallback(async () => {
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
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.message ||
              'Failed to load funding requests',
          );
        }

        setFundingRequests(
          Array.isArray(result.data)
            ? result.data
            : [],
        );
      } catch (error) {
        console.error(
          'Funding requests:',
          error,
        );
      }
    }, []);

  /*
   * PRODUCTS
   */
  const loadProducts =
    useCallback(async () => {
      const { data, error } =
        await supabase
          .from('products')
          .select('*')
          .order('created_at', {
            ascending: false,
          });

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
        (data || []).map(
          (row: any) => ({
            id: String(row.id),
            service:
              row.service || 'data',
            name: row.name || '',
            price: num(row.price),
            network:
              row.network || null,
            description:
              row.description || null,
            category:
              row.category || null,
            cashback_percent:
              num(
                row.cashback_percent,
              ),
            is_active:
              row.is_active !== false,
            created_at:
              row.created_at || null,
          }),
        ),
      );
    }, [showNotice]);

  /*
   * NOTIFICATIONS
   */
  const loadNotifications =
    useCallback(async () => {
      const { data, error } =
        await supabase
          .from('notifications')
          .select('*')
          .order('created_at', {
            ascending: false,
          })
          .limit(100);

      if (error) {
        console.error(
          'Notifications:',
          error,
        );
        return;
      }

      setNotifications(
        (data || []) as NotificationItem[],
      );
    }, []);

  /*
   * CLUBKONNECT BALANCE
   *
   * This calls the existing backend.
   * It does NOT touch PurchaseController.
   */
  const loadClubKonnect =
    useCallback(async () => {
      setClubLoading(true);
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
            .catch(() => ({}));

        if (
          !response.ok ||
          result.success !== true
        ) {
          throw new Error(
            result.message ||
              'ClubKonnect connection failed',
          );
        }

        setClubBalance(
          num(
            result.balance ??
              result.data?.balance,
          ),
        );

        setClubConnected(true);
      } catch (error) {
        console.error(
          'ClubKonnect balance:',
          error,
        );

        setClubConnected(false);
        setClubBalance(null);

        setClubError(
          error instanceof Error
            ? error.message
            : 'Connection failed',
        );
      } finally {
        setClubLoading(false);
      }
    }, []);

  /*
   * LOAD ALL
   *
   * Notice that this is NOT connected
   * to the amount input onChange.
   */
  const loadAll = useCallback(
    async () => {
      setLoading(true);

      await Promise.all([
        loadUsers(),
        loadTransactions(),
        loadFunding(),
        loadProducts(),
        loadNotifications(),
        loadClubKonnect(),
      ]);

      setLoading(false);
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
  }, [loadAll]);

  /*
   * NAVIGATION
   */
  const goTo = (
    next: Section,
  ) => {
    setSection(next);
    setMobileMenu(false);
  };

  /*
   * DIRECT SUPER ADMIN WALLET
   *
   * Uses backend admin-adjust.
   *
   * It does NOT create a funding request.
   * It does NOT directly update profiles
   * from the browser.
   */
  const adminAdjustWallet =
    async () => {
      if (adjustingWallet) {
        return;
      }

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

      if (phone.length < 10) {
        showNotice(
          'Enter a valid customer phone number',
          'error',
        );
        return;
      }

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        showNotice(
          'Enter a valid amount',
          'error',
        );
        return;
      }

      const token = getToken();

      if (!token) {
        navigate(
          '/super-admin-login',
          {
            replace: true,
          },
        );
        return;
      }

      setAdjustingWallet(true);

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
            .catch(() => ({}));

        if (
          !response.ok ||
          result.success !== true ||
          result.status !== 'success'
        ) {
          throw new Error(
            result.message ||
              'Wallet adjustment failed',
          );
        }

        showNotice(
          result.message ||
            'Customer wallet updated successfully',
          'success',
        );

        /*
         * Clear only AFTER the request
         * succeeds.
         */
        setAdjustmentAmount('');
        setAdjustmentReason('');

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
          error instanceof Error
            ? error.message
            : 'Wallet adjustment failed',
          'error',
        );
      } finally {
        setAdjustingWallet(false);
      }
    };

  /*
   * APPROVE FUNDING REQUEST
   */
  const approveFunding =
    async (id: string) => {
      try {
        const response =
          await fetch(
            '/api/funding/approve',
            {
              method: 'POST',
              headers:
                authHeaders(),
              body: JSON.stringify({
                requestId: id,
                adminNotes:
                  'Approved by Super Admin',
              }),
            },
          );

        const result =
          await response
            .json()
            .catch(() => ({}));

        if (
          !response.ok ||
          result.success !== true
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
          error instanceof Error
            ? error.message
            : 'Funding approval failed',
          'error',
        );
      }
    };

  /*
   * REJECT FUNDING REQUEST
   */
  const rejectFunding =
    async (id: string) => {
      try {
        const response =
          await fetch(
            '/api/funding/reject',
            {
              method: 'POST',
              headers:
                authHeaders(),
              body: JSON.stringify({
                requestId: id,
                adminNotes:
                  'Rejected by Super Admin',
              }),
            },
          );

        const result =
          await response
            .json()
            .catch(() => ({}));

        if (
          !response.ok ||
          result.success !== true
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
          error instanceof Error
            ? error.message
            : 'Funding rejection failed',
          'error',
        );
      }
    };

  /*
   * PRODUCT FORM
   */
  const resetProduct =
    () => {
      setSelectedProduct(null);

      setProductForm({
        name: '',
        service: 'data',
        network: '',
        price: '',
        description: '',
        category: '',
        cashback_percent: '',
        is_active: true,
      });
    };

  const editProduct =
    (product: Product) => {
      setSelectedProduct(product);

      setProductForm({
        name: product.name,
        service:
          (product.service ||
            'data') as ServiceKey,
        network:
          product.network || '',
        price:
          String(product.price),
        description:
          product.description || '',
        category:
          product.category || '',
        cashback_percent:
          String(
            product.cashback_percent ||
              '',
          ),
        is_active:
          product.is_active,
      });

      goTo('services');
    };

  /*
   * SAVE PRODUCT
   *
   * This preserves existing product
   * price and active/inactive control.
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

      const cashback =
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
        !Number.isFinite(price) ||
        price < 0
      ) {
        showNotice(
          'Enter a valid price',
          'error',
        );
        return;
      }

      if (
        !Number.isFinite(cashback) ||
        cashback < 0
      ) {
        showNotice(
          'Enter a valid cashback percentage',
          'error',
        );
        return;
      }

      setSavingProduct(true);

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
          cashback,
        is_active:
          productForm.is_active,
      };

      try {
        if (selectedProduct) {
          const { error } =
            await supabase
              .from('products')
              .update(payload)
              .eq(
                'id',
                selectedProduct.id,
              );

          if (error) {
            throw error;
          }

          showNotice(
            'Product updated successfully',
            'success',
          );
        } else {
          const { error } =
            await supabase
              .from('products')
              .insert(payload);

          if (error) {
            throw error;
          }

          showNotice(
            'Product created successfully',
            'success',
          );
        }

        resetProduct();
        await loadProducts();
      } catch (error) {
        showNotice(
          error instanceof Error
            ? error.message
            : 'Unable to save product',
          'error',
        );
      } finally {
        setSavingProduct(false);
      }
    };

  /*
   * DELETE PRODUCT
   */
  const deleteProduct =
    async (product: Product) => {
      if (
        !window.confirm(
          `Delete "${product.name}"?`,
        )
      ) {
        return;
      }

      const { error } =
        await supabase
          .from('products')
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
   * ACTIVE / INACTIVE PRODUCT
   */
  const toggleProduct =
    async (product: Product) => {
      const { error } =
        await supabase
          .from('products')
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
   * USER EDIT
   */
  const editUser =
    (user: User) => {
      setSelectedUser(user);

      setUserForm({
        name:
          user.name ||
          user.full_name ||
          '',
        email:
          user.email || '',
        is_active:
          user.is_active !== false,
        is_admin:
          user.is_admin === true,
      });
    };

  const saveUser =
    async () => {
      if (!selectedUser) {
        return;
      }

      setSavingUser(true);

      try {
        const { error } =
          await supabase
            .from('profiles')
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

        setSelectedUser(null);

        await loadUsers();
      } catch (error) {
        showNotice(
          error instanceof Error
            ? error.message
            : 'Unable to update user',
          'error',
        );
      } finally {
        setSavingUser(false);
      }
    };

  const deleteUser =
    async (user: User) => {
      if (
        !window.confirm(
          `Delete ${userName(user)}? This action cannot be undone.`,
        )
      ) {
        return;
      }

      const { error } =
        await supabase
          .from('profiles')
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

      setSelectedUser(null);
      await loadUsers();
    };

  /*
   * NOTIFICATION
   */
  const sendNotification =
    async () => {
      const title =
        notificationForm.title.trim();

      const message =
        notificationForm.message.trim();

      if (!title || !message) {
        showNotice(
          'Title and message are required',
          'error',
        );
        return;
      }

      setSendingNotification(true);

      try {
        const { error } =
          await supabase
            .from('notifications')
            .insert({
              title,
              message,
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
          error instanceof Error
            ? error.message
            : 'Unable to send notification',
          'error',
        );
      } finally {
        setSendingNotification(false);
      }
    };

  const deleteNotification =
    async (
      item: NotificationItem,
    ) => {
      const { error } =
        await supabase
          .from('notifications')
          .delete()
          .eq(
            'id',
            item.id,
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
   * DERIVED DATA
   */
  const filteredUsers =
    useMemo(() => {
      const q =
        search.trim().toLowerCase();

      if (!q) {
        return users;
      }

      return users.filter(
        (user) =>
          userName(user)
            .toLowerCase()
            .includes(q) ||
          String(user.phone || '')
            .toLowerCase()
            .includes(q) ||
          String(user.email || '')
            .toLowerCase()
            .includes(q),
      );
    }, [users, search]);

  const filteredProducts =
    useMemo(() => {
      const q =
        search.trim().toLowerCase();

      if (!q) {
        return products;
      }

      return products.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(q) ||
          product.service
            .toLowerCase()
            .includes(q) ||
          String(
            product.network || '',
          )
            .toLowerCase()
            .includes(q),
      );
    }, [products, search]);

  const totalWallet =
    useMemo(
      () =>
        users.reduce(
          (sum, user) =>
            sum +
            num(
              user.wallet_balance,
            ),
          0,
        ),
      [users],
    );

  const totalRevenue =
    useMemo(
      () =>
        transactions
          .filter(
            (tx) =>
              String(
                tx.status || '',
              ).toLowerCase() ===
              'success',
          )
          .reduce(
            (sum, tx) =>
              sum + num(tx.amount),
            0,
          ),
      [transactions],
    );

  const successful =
    transactions.filter(
      (tx) =>
        String(
          tx.status || '',
        ).toLowerCase() ===
        'success',
    ).length;

  const failed =
    transactions.filter(
      (tx) =>
        String(
          tx.status || '',
        ).toLowerCase() ===
        'failed',
    ).length;

  const activeUsers =
    users.filter(
      (user) =>
        user.is_active !== false,
    ).length;

  const adminUsers =
    users.filter(
      (user) =>
        user.is_admin === true,
    ).length;

  const pendingFunding =
    fundingRequests.length;

  const navItems: {
    key: Section;
    label: string;
    icon: ReactNode;
  }[] = [
    {
      key: 'overview',
      label: 'Overview',
      icon: <BarChart3 size={18} />,
    },
    {
      key: 'users',
      label: 'Users',
      icon: <Users size={18} />,
    },
    {
      key: 'wallet',
      label: 'Wallet',
      icon: <Wallet size={18} />,
    },
    {
      key: 'transactions',
      label: 'Transactions',
      icon: <CreditCard size={18} />,
    },
    {
      key: 'revenue',
      label: 'Revenue',
      icon: <TrendingUp size={18} />,
    },
    {
      key: 'funding',
      label: 'Funding Requests',
      icon: <Landmark size={18} />,
    },
    {
      key: 'services',
      label: 'Services & Prices',
      icon: <Package size={18} />,
    },
    {
      key: 'admins',
      label: 'Admins',
      icon: <UserCog size={18} />,
    },
    {
      key: 'security',
      label: 'Security',
      icon: <Shield size={18} />,
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: <Bell size={18} />,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <Settings size={18} />,
    },
  ];

  const logout = () => {
    localStorage.removeItem(
      SESSION_KEY,
    );

    localStorage.removeItem(
      EXPIRY_KEY,
    );

    navigate(
      '/super-admin-login',
      {
        replace: true,
      },
    );
  };

  const serviceCounts = useMemo(() => {
    return SERVICES.map(
      (service) => ({
        ...service,
        total:
          products.filter(
            (product) =>
              product.service ===
              service.key,
          ).length,
        active:
          products.filter(
            (product) =>
              product.service ===
                service.key &&
              product.is_active,
          ).length,
      }),
    );
  }, [products]);

  const pageTitle =
    navItems.find(
      (item) =>
        item.key === section,
    )?.label ||
    'Super Admin';

  /*
   * OVERVIEW
   */
  const overviewView = (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#071a41]">
          Dashboard Overview
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          Full control center for GY DATA.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Users"
          value={users.length.toLocaleString()}
          icon={<Users size={20} />}
          description={`${activeUsers} active users`}
        />

        <StatCard
          title="Total Wallet Balance"
          value={
            showBalance
              ? money(totalWallet)
              : '••••••'
          }
          icon={<Wallet size={20} />}
          description="Customer wallet balances"
        />

        <StatCard
          title="Total Revenue"
          value={money(totalRevenue)}
          icon={<TrendingUp size={20} />}
          description={`${successful} successful transactions`}
        />

        <StatCard
          title="Pending Funding"
          value={String(pendingFunding)}
          icon={<Clock3 size={20} />}
          description={`${failed} failed transactions`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-[#071a41]">
                ClubKonnect Balance
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Live provider balance.
              </p>
            </div>

            <Button
              kind="light"
              onClick={loadClubKonnect}
              disabled={clubLoading}
            >
              <RefreshCw
                size={15}
                className={
                  clubLoading
                    ? 'animate-spin'
                    : ''
                }
              />
              Refresh
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-3xl font-black text-[#071a41]">
                {clubLoading
                  ? 'Loading...'
                  : clubBalance === null
                  ? '—'
                  : money(clubBalance)}
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span
                  className={[
                    'h-2.5 w-2.5 rounded-full',
                    clubConnected
                      ? 'bg-emerald-500'
                      : 'bg-red-500',
                  ].join(' ')}
                />

                <span className="text-xs font-semibold text-slate-500">
                  {clubConnected
                    ? 'Connected'
                    : clubError ||
                      'Not connected'}
                </span>
              </div>
            </div>

            <Server
              size={46}
              className="text-blue-100"
            />
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-black text-[#071a41]">
            Service Status
          </h3>

          <div className="mt-4 space-y-2">
            {serviceCounts.map(
              (service) => (
                <div
                  key={service.key}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    {service.icon}
                    {service.label}
                  </div>

                  <span className="text-[10px] font-bold text-emerald-600">
                    {service.active}/
                    {service.total}
                  </span>
                </div>
              ),
            )}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-black text-[#071a41]">
            Recent Transactions
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400">
                <th className="px-5 py-3">
                  Customer
                </th>
                <th className="px-5 py-3">
                  Service
                </th>
                <th className="px-5 py-3">
                  Amount
                </th>
                <th className="px-5 py-3">
                  Status
                </th>
                <th className="px-5 py-3">
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {transactions
                .slice(0, 8)
                .map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="px-5 py-4 text-xs font-bold text-slate-700">
                      {tx.phone || '—'}
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500">
                      {tx.service ||
                        tx.product ||
                        '—'}
                    </td>

                    <td className="px-5 py-4 text-xs font-black text-[#071a41]">
                      {money(tx.amount)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge
                        status={tx.status}
                      />
                    </td>

                    <td className="px-5 py-4 text-[10px] text-slate-400">
                      {dateText(
                        tx.created_at,
                      )}
                    </td>
                  </tr>
                ))}

              {!transactions.length && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-xs text-slate-400"
                  >
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  /*
   * WALLET VIEW
   *
   * The amount input is deliberately
   * NOT tied to loadUsers/loadAll.
   *
   * This is the important keyboard fix.
   */
  const walletView = (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#071a41]">
          Wallet Management
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          Direct Super Admin wallet funding and refunds.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Wallet size={21} />
            </div>

            <div>
              <h3 className="font-black text-[#071a41]">
                Direct Wallet Adjustment
              </h3>

              <p className="text-[10px] text-slate-400">
                No approval request required.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Input
              label="Customer Phone"
              value={adjustmentPhone}
              onChange={(event) =>
                setAdjustmentPhone(
                  event.target.value,
                )
              }
              placeholder="08012345678"
              inputMode="tel"
              type="tel"
              disabled={adjustingWallet}
            />

            <Input
              label="Amount"
              value={adjustmentAmount}
              onChange={(event) =>
                setAdjustmentAmount(
                  event.target.value,
                )
              }
              placeholder="5000"
              inputMode="decimal"
              type="number"
              disabled={adjustingWallet}
            />

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-600">
                Action
              </span>

              <select
                value={adjustmentType}
                onChange={(event) =>
                  setAdjustmentType(
                    event.target.value as
                      | 'fund'
                      | 'refund',
                  )
                }
                disabled={adjustingWallet}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="fund">
                  Fund Wallet
                </option>
                <option value="refund">
                  Refund / Deduct
                </option>
              </select>
            </label>

            <Input
              label="Reason"
              value={adjustmentReason}
              onChange={(event) =>
                setAdjustmentReason(
                  event.target.value,
                )
              }
              placeholder="Super Admin adjustment"
              disabled={adjustingWallet}
            />

            <Button
              kind={
                adjustmentType ===
                'refund'
                  ? 'orange'
                  : 'dark'
              }
              onClick={
                adminAdjustWallet
              }
              disabled={
                adjustingWallet
              }
            >
              {adjustingWallet ? (
                <>
                  <RefreshCw
                    size={15}
                    className="animate-spin"
                  />
                  Processing...
                </>
              ) : adjustmentType ===
                'refund' ? (
                <>
                  <CreditCard
                    size={15}
                  />
                  Refund Wallet
                </>
              ) : (
                <>
                  <Plus size={15} />
                  Fund Wallet
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="font-black text-[#071a41]">
                Customer Wallets
              </h3>

              <p className="text-[10px] text-slate-400">
                {users.length} customer accounts
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowBalance(
                  (value) => !value,
                )
              }
              className="rounded-lg bg-slate-100 p-2 text-slate-500"
            >
              {showBalance ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400">
                  <th className="px-5 py-3">
                    Customer
                  </th>
                  <th className="px-5 py-3">
                    Phone
                  </th>
                  <th className="px-5 py-3">
                    Balance
                  </th>
                  <th className="px-5 py-3">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {users
                  .filter(
                    (user) =>
                      !user.is_admin,
                  )
                  .slice(0, 100)
                  .map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#071a41] text-[10px] font-black text-white">
                            {initials(
                              user,
                            )}
                          </div>

                          <span className="text-xs font-bold text-slate-700">
                            {userName(
                              user,
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {user.phone}
                      </td>

                      <td className="px-5 py-4 text-xs font-black text-[#071a41]">
                        {showBalance
                          ? money(
                              user.wallet_balance,
                            )
                          : '••••••'}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={
                            user.is_active !==
                            false
                              ? 'active'
                              : 'inactive'
                          }
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );

  /*
   * USERS VIEW
   */
  const usersView = (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black text-[#071a41]">
            Users
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Manage customer accounts.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search name, phone or email..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-xs outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase text-slate-400">
                <th className="px-5 py-3">
                  User
                </th>
                <th className="px-5 py-3">
                  Phone
                </th>
                <th className="px-5 py-3">
                  Wallet
                </th>
                <th className="px-5 py-3">
                  Role
                </th>
                <th className="px-5 py-3">
                  Status
                </th>
                <th className="px-5 py-3">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map(
                (user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-black text-blue-700">
                          {initials(
                            user,
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-700">
                            {userName(
                              user,
                            )}
                          </p>

                          <p className="text-[10px] text-slate-400">
                            {user.email ||
                              'No email'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500">
                      {user.phone}
                    </td>

                    <td className="px-5 py-4 text-xs font-black text-[#071a41]">
                      {money(
                        user.wallet_balance,
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge
                        status={
                          user.is_admin
                            ? 'Admin'
                            : 'Customer'
                        }
                      />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge
                        status={
                          user.is_active !==
                          false
                            ? 'active'
                            : 'inactive'
                        }
                      />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            editUser(
                              user,
                            )
                          }
                          className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
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
                          className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
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

              {!filteredUsers.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-xs text-slate-400"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  /*
   * TRANSACTIONS VIEW
   */
  const transactionsView = (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-[#071a41]">
          Transactions
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          Latest platform transactions.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase text-slate-400">
                <th className="px-5 py-3">
                  Reference
                </th>
                <th className="px-5 py-3">
                  Phone
                </th>
                <th className="px-5 py-3">
                  Service
                </th>
                <th className="px-5 py-3">
                  Product
                </th>
                <th className="px-5 py-3">
                  Amount
                </th>
                <th className="px-5 py-3">
                  Status
                </th>
                <th className="px-5 py-3">
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {transactions.map(
                (tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-slate-50"
                  >
                    <td className="px-5 py-4 text-[10px] font-bold text-slate-600">
                      {tx.reference ||
                        tx.id}
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500">
                      {tx.phone ||
                        '—'}
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500">
                      {tx.service ||
                        '—'}
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500">
                      {tx.product ||
                        '—'}
                    </td>

                    <td className="px-5 py-4 text-xs font-black text-[#071a41]">
                      {money(
                        tx.amount,
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge
                        status={
                          tx.status
                        }
                      />
                    </td>

                    <td className="px-5 py-4 text-[10px] text-slate-400">
                      {dateText(
                        tx.created_at,
                      )}
                    </td>
                  </tr>
                ),
              )}

              {!transactions.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-xs text-slate-400"
                  >
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  /*
   * REVENUE VIEW
   */
  const revenueView = (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#071a41]">
          Revenue
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          Platform transaction performance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Revenue"
          value={money(totalRevenue)}
          icon={
            <TrendingUp
              size={20}
            />
          }
        />

        <StatCard
          title="Successful"
          value={successful.toLocaleString()}
          icon={
            <CheckCircle2
              size={20}
            />
          }
        />

        <StatCard
          title="Failed"
          value={failed.toLocaleString()}
          icon={
            <XCircle
              size={20}
            />
          }
        />

        <StatCard
          title="Transactions"
          value={transactions.length.toLocaleString()}
          icon={
            <BarChart3
              size={20}
            />
          }
        />
      </div>

      <Card className="p-5">
        <h3 className="font-black text-[#071a41]">
          Revenue by Service
        </h3>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(
            (service) => {
              const serviceTransactions =
                transactions.filter(
                  (tx) =>
                    String(
                      tx.service ||
                        '',
                    ).toLowerCase() ===
                    service.key,
                );

              const total =
                serviceTransactions
                  .filter(
                    (tx) =>
                      String(
                        tx.status ||
                          '',
                      ).toLowerCase() ===
                      'success',
                  )
                  .reduce(
                    (sum, tx) =>
                      sum +
                      num(
                        tx.amount,
                      ),
                    0,
                  );

              return (
                <div
                  key={service.key}
                  className="rounded-xl bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      {service.icon}
                      {service.label}
                    </span>

                    <span className="text-[10px] text-slate-400">
                      {
                        serviceTransactions.length
                      }{' '}
                      tx
                    </span>
                  </div>

                  <p className="mt-3 text-lg font-black text-[#071a41]">
                    {money(total)}
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
   * FUNDING VIEW
   */
  const fundingView = (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-[#071a41]">
          Funding Requests
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          Review customer funding requests.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase text-slate-400">
                <th className="px-5 py-3">
                  Customer
                </th>
                <th className="px-5 py-3">
                  Amount
                </th>
                <th className="px-5 py-3">
                  Reason
                </th>
                <th className="px-5 py-3">
                  Status
                </th>
                <th className="px-5 py-3">
                  Date
                </th>
                <th className="px-5 py-3">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {fundingRequests.map(
                (request) => (
                  <tr
                    key={request.id}
                    className="border-b border-slate-50"
                  >
                    <td className="px-5 py-4 text-xs font-bold text-slate-700">
                      {request.phone ||
                        '—'}
                    </td>

                    <td className="px-5 py-4 text-xs font-black text-[#071a41]">
                      {money(
                        request.amount,
                      )}
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500">
                      {request.reason ||
                        request.notes ||
                        '—'}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge
                        status={
                          request.status ||
                          'pending'
                        }
                      />
                    </td>

                    <td className="px-5 py-4 text-[10px] text-slate-400">
                      {dateText(
                        request.created_at,
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            approveFunding(
                              request.id,
                            )
                          }
                          className="rounded-lg bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100"
                        >
                          <Check
                            size={15}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            rejectFunding(
                              request.id,
                            )
                          }
                          className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                        >
                          <X
                            size={15}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}

              {!fundingRequests.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-xs text-slate-400"
                  >
                    No pending funding requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  /*
   * SERVICES VIEW CONTINUES IN PART 2.
   *
   * IMPORTANT:
   * Do not close the component after this
   * part. Part 2 continues from here.
   */
