import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  Activity,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  Database,
  Edit3,
  LogOut,
  Menu,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';

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

type Product = {
  id: string;
  service: string;
  name: string;
  price: number;
  network?: string | null;
  description?: string | null;
  is_active: boolean;
  category?: string | null;
  cashback_percent?: number | null;
};

type User = {
  id: string;
  phone: string;
  name?: string | null;
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
  created_at?: string | null;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  type?: string | null;
  created_at?: string | null;
};

type NoticeType = 'success' | 'pending' | 'error';

type NoticeState = {
  message: string;
  type: NoticeType;
};

const SERVICES = [
  'data',
  'airtime',
  'electricity',
  'cable',
  'waec',
  'jamb',
  'betting',
  'smile',
  'internet',
];

const SERVICE_LABEL: Record<string, string> = {
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

const money = (value: unknown) =>
  `#${Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const cleanPhone = (value: string) =>
  value.replace(/\D/g, '').slice(0, 11);

const cleanAmount = (value: string) =>
  value.replace(/[^0-9.]/g, '');

const superAdminStyles = `
  .gy-super-admin {
    position: relative;
    isolation: isolate;
  }

  .gy-super-admin::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -2;
    pointer-events: none;
    background:
      radial-gradient(
        circle at 10% 10%,
        rgba(37, 99, 235, .07),
        transparent 30%
      ),
      radial-gradient(
        circle at 90% 15%,
        rgba(14, 165, 233, .05),
        transparent 30%
      ),
      #f8fafc;
  }

  .gy-super-admin .gy-dashboard-card {
    transition:
      transform .18s ease,
      box-shadow .18s ease,
      border-color .18s ease;
  }

  .gy-super-admin .gy-dashboard-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(15, 23, 42, .08);
    border-color: rgba(37, 99, 235, .25);
  }

  .gy-super-admin button {
    transition:
      transform .16s ease,
      box-shadow .16s ease,
      border-color .16s ease,
      background-color .16s ease;
  }

  .gy-super-admin button:active {
    transform: translateY(1px);
  }

  .gy-super-admin .gy-money {
    color: #0f172a;
    font-weight: 900;
  }

  .gy-super-admin .gy-section-accent {
    background:
      linear-gradient(
        90deg,
        #1d4ed8,
        #2563eb,
        #0284c7
      );
  }
`;

const Button = ({
  children,
  onClick,
  kind = 'blue',
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  kind?: 'blue' | 'dark' | 'red' | 'light' | 'green';
  disabled?: boolean;
}) => {
  const colors = {
    blue:
      'bg-blue-700 text-white hover:bg-blue-800',
    dark:
      'bg-[#071a41] text-white hover:bg-[#0b2456]',
    red:
      'bg-red-50 text-red-700 hover:bg-red-100',
    light:
      'bg-slate-100 text-slate-700 hover:bg-slate-200',
    green:
      'bg-emerald-600 text-white hover:bg-emerald-700',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition disabled:pointer-events-none disabled:opacity-50 ${colors[kind]}`}
    >
      {children}
    </button>
  );
};

const Input = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
}: {
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?:
    | 'text'
    | 'numeric'
    | 'decimal'
    | 'tel'
    | 'email'
    | 'url'
    | 'search';
}) => (
  <input
    type={type}
    inputMode={
      inputMode ||
      (type === 'number'
        ? 'decimal'
        : undefined)
    }
    value={value ?? ''}
    onChange={(event) =>
      onChange(event.target.value)
    }
    placeholder={placeholder}
    autoComplete="off"
    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
  />
);

const Select = ({
  value,
  onChange,
  children,
}: {
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  children: ReactNode;
}) => (
  <select
    value={value ?? ''}
    onChange={(event) =>
      onChange(event.target.value)
    }
    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
  >
    {children}
  </select>
);

const Panel = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <section
    className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
  >
    {children}
  </section>
);

const StatCard = ({
  title,
  value,
  subtitle,
  Icon,
  onClick,
}: {
  title: string;
  value: string;
  subtitle: string;
  Icon: typeof Wallet;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="gy-dashboard-card group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"
  >
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </p>

        <p className="gy-money mt-1 truncate text-xl">
          {value}
        </p>

        <p className="mt-1 text-[10px] font-semibold text-slate-400">
          {subtitle}
        </p>
      </div>

      <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700 transition group-hover:bg-blue-100">
        <Icon size={18} />
      </div>
    </div>
  </button>
);

const formatDate = (
  value?: string | null,
) => {
  if (!value) return '-';

  try {
    return new Date(value).toLocaleString(
      'en-NG',
    );
  } catch {
    return value;
  }
};

const statusClass = (
  status?: string | null,
) => {
  const normalized = String(
    status || '',
  ).toLowerCase();

  if (
    normalized === 'success' ||
    normalized === 'successful' ||
    normalized === 'completed' ||
    normalized === 'approved' ||
    normalized === 'active'
  ) {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (
    normalized === 'pending' ||
    normalized === 'processing' ||
    normalized === 'waiting'
  ) {
    return 'bg-amber-50 text-amber-700';
  }

  if (
    normalized === 'failed' ||
    normalized === 'rejected' ||
    normalized === 'inactive'
  ) {
    return 'bg-red-50 text-red-700';
  }

  return 'bg-slate-100 text-slate-600';
};

const normalizeUser = (
  row: any,
): User => ({
  id: String(row?.id || ''),
  phone: String(row?.phone || ''),
  name: row?.name ?? null,
  email: row?.email ?? null,
  wallet_balance: Number(
    row?.wallet_balance || 0,
  ),
  is_admin: Boolean(
    row?.is_admin,
  ),
  is_active:
    row?.is_active === undefined
      ? true
      : Boolean(row?.is_active),
  created_at:
    row?.created_at ?? null,
});

const normalizeTransaction = (
  row: any,
): Transaction => ({
  id: String(row?.id || ''),
  phone: row?.phone ?? null,
  type: row?.type ?? null,
  service: row?.service ?? null,
  product: row?.product ?? null,
  amount: Number(
    row?.amount || 0,
  ),
  status:
    row?.status ?? null,
  recipient:
    row?.recipient ?? null,
  network:
    row?.network ?? null,
  created_at:
    row?.created_at ?? null,
  reference:
    row?.reference ?? null,
});

const normalizeFundingRequest = (
  row: any,
): FundingRequest => ({
  id: String(row?.id || ''),
  phone: row?.phone ?? null,
  amount: Number(
    row?.amount || 0,
  ),
  status:
    row?.status ?? null,
  reason:
    row?.reason ?? null,
  created_at:
    row?.created_at ?? null,
});

const normalizeNotification = (
  row: any,
): Notification => ({
  id: String(row?.id || ''),
  title: String(
    row?.title || '',
  ),
  message: String(
    row?.message || '',
  ),
  type:
    row?.type ?? null,
  created_at:
    row?.created_at ?? null,
});

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const [section, setSection] =
    useState<Section>('overview');

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [adjustingWallet, setAdjustingWallet] =
    useState(false);

  const [notice, setNotice] =
    useState<NoticeState | null>(null);

  const [users, setUsers] =
    useState<User[]>([]);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [fundingRequests, setFundingRequests] =
    useState<FundingRequest[]>([]);

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [adjustmentPhone, setAdjustmentPhone] =
    useState('');

  const [adjustmentAmount, setAdjustmentAmount] =
    useState('');

  const [adjustmentType, setAdjustmentType] =
    useState<'fund' | 'refund'>('fund');

  const [adjustmentReason, setAdjustmentReason] =
    useState('');

  const [notifyForm, setNotifyForm] =
    useState({
      title: '',
      message: '',
      type: 'info',
    });

  const [cashback, setCashback] =
    useState<Product | null>(null);

  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [productForm, setProductForm] =
    useState({
      name: '',
      service: 'data',
      network: '',
      price: '',
      description: '',
      category: '',
      cashback_percent: '',
      is_active: true,
    });

  const [userEditForm, setUserEditForm] =
    useState({
      name: '',
      email: '',
      is_active: true,
      is_admin: false,
    });

  const [maintenance, setMaintenance] =
    useState(false);

  const [cashbackForm, setCashbackForm] =
    useState<any>({
      default_percent: '',
    });

  const showNotice = (
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
  };

  const loadUsers = async () => {
    const {
      data,
      error,
    } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      console.error(error);
      return;
    }

    setUsers(
      (data || []).map(
        normalizeUser,
      ),
    );
  };

  const loadTransactions =
    async () => {
      const {
        data,
        error,
      } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', {
          ascending: false,
        })
        .limit(100);

      if (error) {
        console.error(error);
        return;
      }

      setTransactions(
        (data || []).map(
          normalizeTransaction,
        ),
      );
    };

  const loadFundingRequests =
    async () => {
      try {
        const response =
          await fetch(
            '/api/funding/requests?status=pending',
            {
              headers: {
                'x-super-admin-email':
                  'sadmin@gyd.com',
              },
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
          (result.data || []).map(
            normalizeFundingRequest,
          ),
        );
      } catch (error) {
        console.error(error);
      }
    };

  const loadNotifications =
    async () => {
      const {
        data,
        error,
      } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', {
          ascending: false,
        })
        .limit(50);

      if (error) {
        console.error(error);
        return;
      }

      setNotifications(
        (data || []).map(
          normalizeNotification,
        ),
      );
    };

  const loadProducts =
    async () => {
      const {
        data,
        error,
      } = await supabase
        .from('products')
        .select('*')
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        console.error(error);
        return;
      }

      setProducts(
        (data || []).map(
          (row: any) => ({
            id: String(
              row?.id || '',
            ),
            service:
              row?.service || '',
            name:
              row?.name || '',
            price: Number(
              row?.price || 0,
            ),
            network:
              row?.network ?? null,
            description:
              row?.description ??
              null,
            is_active:
              Boolean(
                row?.is_active,
              ),
            category:
              row?.category ??
              null,
            cashback_percent:
              row?.cashback_percent ??
              null,
          }),
        ),
      );
    };

  const loadAll = async () => {
    setLoading(true);

    try {
      await Promise.all([
        loadUsers(),
        loadTransactions(),
        loadFundingRequests(),
        loadNotifications(),
        loadProducts(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const activeUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.is_active !==
          false,
      ),
    [users],
  );

  const totalWallet = useMemo(
    () =>
      users.reduce(
        (sum, user) =>
          sum +
          Number(
            user.wallet_balance ||
              0,
          ),
        0,
      ),
    [users],
  );

  const successfulTransactions =
    useMemo(
      () =>
        transactions.filter(
          (transaction) =>
            [
              'success',
              'successful',
              'completed',
            ].includes(
              String(
                transaction.status ||
                  '',
              ).toLowerCase(),
            ),
        ),
      [transactions],
    );

  const totalRevenue =
    useMemo(
      () =>
        successfulTransactions.reduce(
          (sum, transaction) =>
            sum +
            Number(
              transaction.amount ||
                0,
            ),
          0,
        ),
      [successfulTransactions],
    );

  const filteredUsers =
    useMemo(() => {
      const query =
        searchTerm
          .trim()
          .toLowerCase();

      if (!query) {
        return users;
      }

      return users.filter(
        (user) =>
          String(
            user.phone || '',
          )
            .toLowerCase()
            .includes(query) ||
          String(
            user.name || '',
          )
            .toLowerCase()
            .includes(query) ||
          String(
            user.email || '',
          )
            .toLowerCase()
            .includes(query),
      );
    }, [
      users,
      searchTerm,
    ]);

  /*
   * FINAL DIRECT WALLET FUNDING
   *
   * This endpoint does NOT create a funding request.
   * It calls the backend direct-adjustment route.
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
        phone.length < 10
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

      setAdjustingWallet(true);

      try {
        const response =
          await fetch(
            '/api/funding/admin-adjust',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
                'x-super-admin-email':
                  'sadmin@gyd.com',
              },
              body: JSON.stringify({
                phone,
                amount,
                type:
                  adjustmentType,
                reason:
                  adjustmentReason.trim() ||
                  'Super Admin wallet adjustment',
                superAdminEmail:
                  'sadmin@gyd.com',
              }),
            },
          );

        const result =
          await response
            .json()
            .catch(() => ({}));

        if (
          !response.ok ||
          result.success !==
            true
        ) {
          throw new Error(
            result.message ||
              'Wallet funding failed',
          );
        }

        showNotice(
          adjustmentType ===
            'fund'
            ? 'Customer wallet funded successfully'
            : 'Customer wallet refunded successfully',
          'success',
        );

        setAdjustmentAmount(
          '',
        );
        setAdjustmentReason(
          '',
        );

        await loadAll();
      } catch (error: any) {
        console.error(error);

        showNotice(
          error?.message ||
            'Wallet funding failed',
          'error',
        );
      } finally {
        setAdjustingWallet(
          false,
        );
      }
    };

  const updateNotification =
    async () => {
      if (
        !notifyForm.title.trim() ||
        !notifyForm.message.trim()
      ) {
        showNotice(
          'Notification title and message are required',
          'error',
        );
        return;
      }

      const {
        error,
      } = await supabase
        .from('notifications')
        .insert({
          title:
            notifyForm.title.trim(),
          message:
            notifyForm.message.trim(),
          type:
            notifyForm.type,
        });

      if (error) {
        showNotice(
          error.message,
          'error',
        );
        return;
      }

      setNotifyForm({
        title: '',
        message: '',
        type: 'info',
      });

      showNotice(
        'Notification created successfully',
        'success',
      );

      await loadNotifications();
    };

  const deleteNotification =
    async (
      id: string,
    ) => {
      const {
        error,
      } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

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

  const saveUser =
    async () => {
      if (!selectedUser) {
        return;
      }

      const {
        error,
      } = await supabase
        .from('profiles')
        .update({
          name:
            userEditForm.name.trim() ||
            null,
          email:
            userEditForm.email.trim() ||
            null,
          is_active:
            userEditForm.is_active,
          is_admin:
            userEditForm.is_admin,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          selectedUser.id,
        );

      if (error) {
        showNotice(
          error.message,
          'error',
        );
        return;
      }

      setSelectedUser(
        null,
      );

      showNotice(
        'User updated successfully',
        'success',
      );

      await loadUsers();
    };

  const deleteUser =
    async (
      user: User,
    ) => {
      if (
        !window.confirm(
          `Delete "${user.phone}"?`,
        )
      ) {
        return;
      }

      const {
        error,
      } = await supabase
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

      await loadUsers();
    };

  const saveProduct =
    async () => {
      if (
        !productForm.name.trim()
      ) {
        showNotice(
          'Product name is required',
          'error',
        );
        return;
      }

      const price =
        Number(
          cleanAmount(
            productForm.price,
          ),
        );

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

      const payload = {
        name:
          productForm.name.trim(),
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
          Number(
            productForm.cashback_percent ||
              0,
          ),
        is_active:
          productForm.is_active,
      };

      const query =
        selectedProduct
          ? supabase
              .from('products')
              .update(
                payload,
              )
              .eq(
                'id',
                selectedProduct.id,
              )
          : supabase
              .from('products')
              .insert(
                payload,
              );

      const {
        error,
      } = await query;

      if (error) {
        showNotice(
          error.message,
          'error',
        );
        return;
      }

      setSelectedProduct(
        null,
      );

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

      showNotice(
        selectedProduct
          ? 'Product updated successfully'
          : 'Product created successfully',
        'success',
      );

      await loadProducts();
    };

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
      } = await supabase
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

  const approveFunding =
    async (
      requestId: string,
    ) => {
      try {
        const response =
          await fetch(
            '/api/funding/approve',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
                'x-super-admin-email':
                  'sadmin@gyd.com',
              },
              body: JSON.stringify({
                requestId,
                adminNotes:
                  'Approved by Super Admin',
                superAdminEmail:
                  'sadmin@gyd.com',
              }),
            },
          );

        const result =
          await response
            .json()
            .catch(() => ({}));

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              'Failed to approve funding',
          );
        }

        showNotice(
          'Funding request approved successfully',
          'success',
        );

        await loadAll();
      } catch (error: any) {
        showNotice(
          error?.message ||
            'Failed to approve funding',
          'error',
        );
      }
    };

  const rejectFunding =
    async (
      requestId: string,
    ) => {
      try {
        const response =
          await fetch(
            '/api/funding/reject',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
                'x-super-admin-email':
                  'sadmin@gyd.com',
              },
              body: JSON.stringify({
                requestId,
                adminNotes:
                  'Rejected by Super Admin',
                superAdminEmail:
                  'sadmin@gyd.com',
              }),
            },
          );

        const result =
          await response
            .json()
            .catch(() => ({}));

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              'Failed to reject funding',
          );
        }

        showNotice(
          'Funding request rejected',
          'success',
        );

        await loadAll();
      } catch (error: any) {
        showNotice(
          error?.message ||
            'Failed to reject funding',
          'error',
        );
      }
    };

  const goTo = (
    value: Section,
  ) => {
    setSection(value);
    setMobileMenu(false);
  };

  const navItems: Array<{
    key: Section;
    label: string;
    Icon: typeof Wallet;
  }> = [
    {
      key: 'overview',
      label: 'Overview',
      Icon: BarChart3,
    },
    {
      key: 'users',
      label: 'Customers',
      Icon: Users,
    },
    {
      key: 'wallet',
      label: 'Wallet',
      Icon: Wallet,
    },
    {
      key: 'transactions',
      label: 'Transactions',
      Icon: CreditCard,
    },
    {
      key: 'revenue',
      label: 'Revenue',
      Icon: Activity,
    },
    {
      key: 'funding',
      label: 'Funding Requests',
      Icon: Database,
    },
    {
      key: 'services',
      label: 'Products & Services',
      Icon: Package,
    },
    {
      key: 'admins',
      label: 'Admins',
      Icon: ShieldCheck,
    },
    {
      key: 'security',
      label: 'Security',
      Icon: ShieldCheck,
    },
    {
      key: 'notifications',
      label: 'Notifications',
      Icon: Bell,
    },
    {
      key: 'settings',
      label: 'Settings',
      Icon: Settings,
    },
  ];

  const overviewView = (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
          SUPER ADMIN
        </p>

        <h1 className="mt-1 text-2xl font-black text-slate-900">
          Dashboard Overview
        </h1>

        <p className="mt-1 text-xs text-slate-500">
          Complete control centre for GY Data.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Customers"
          value={String(
            users.length,
          )}
          subtitle={`${activeUsers.length} active`}
          Icon={Users}
          onClick={() =>
            goTo('users')
          }
        />

        <StatCard
          title="Wallet Balance"
          value={money(
            totalWallet,
          )}
          subtitle="All customer wallets"
          Icon={Wallet}
          onClick={() =>
            goTo('wallet')
          }
        />

        <StatCard
          title="Revenue"
          value={money(
            totalRevenue,
          )}
          subtitle="Successful transactions"
          Icon={BarChart3}
          onClick={() =>
            goTo('revenue')
          }
        />

        <StatCard
          title="Pending Funding"
          value={String(
            fundingRequests.length,
          )}
          subtitle="Requests awaiting review"
          Icon={CreditCard}
          onClick={() =>
            goTo('funding')
          }
        />
      </div>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Frequently used Super Admin controls.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() =>
              goTo('wallet')
            }
            className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-left hover:bg-blue-100"
          >
            <Wallet
              size={20}
              className="text-blue-700"
            />

            <p className="mt-3 text-xs font-black text-slate-900">
              Wallet Adjustment
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              Directly fund or refund a customer.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              goTo('services')
            }
            className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-left hover:bg-emerald-100"
          >
            <Package
              size={20}
              className="text-emerald-700"
            />

            <p className="mt-3 text-xs font-black text-slate-900">
              Products & Services
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              Manage products and prices.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              goTo('users')
            }
            className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-left hover:bg-violet-100"
          >
            <Users
              size={20}
              className="text-violet-700"
            />

            <p className="mt-3 text-xs font-black text-slate-900">
              Customers
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              Manage customer accounts.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              goTo('admins')
            }
            className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-left hover:bg-amber-100"
          >
            <ShieldCheck
              size={20}
              className="text-amber-700"
            />

            <p className="mt-3 text-xs font-black text-slate-900">
              Admin Management
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              Manage Admin accounts and access.
            </p>
          </button>
        </div>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black">
              Recent Transactions
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Latest activity.
            </p>
          </div>

          <Button
            kind="light"
            onClick={() =>
              goTo('transactions')
            }
          >
            View all
            <ChevronRight
              size={13}
            />
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Customer
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Product
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Amount
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Status
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {transactions
                .slice(0, 10)
                .map(
                  (
                    transaction,
                  ) => (
                    <tr
                      key={
                        transaction.id
                      }
                      className="border-b border-slate-50"
                    >
                      <td className="px-3 py-3 text-[10px] font-bold text-slate-700">
                        {transaction.phone ||
                          '-'}
                      </td>

                      <td className="px-3 py-3 text-[10px] text-slate-600">
                        {transaction.product ||
                          transaction.service ||
                          '-'}
                      </td>

                      <td className="px-3 py-3 text-[10px] font-black text-slate-900">
                        {money(
                          transaction.amount,
                        )}
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusClass(
                            transaction.status,
                          )}`}
                        >
                          {transaction.status ||
                            '-'}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-[9px] text-slate-400">
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
      </Panel>
    </div>
  );

  const walletView = (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
          WALLET
        </p>

        <h1 className="mt-1 text-2xl font-black text-slate-900">
          Wallet Management
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Wallet"
          value={money(
            totalWallet,
          )}
          subtitle="Customer balances"
          Icon={Wallet}
        />

        <StatCard
          title="Customers"
          value={String(
            users.length,
          )}
          subtitle="Registered accounts"
          Icon={Users}
        />

        <StatCard
          title="Pending Funding"
          value={String(
            fundingRequests.length,
          )}
          subtitle="Awaiting approval"
          Icon={CreditCard}
          onClick={() =>
            goTo('funding')
          }
        />
      </div>

      <Panel>
        <div className="relative overflow-hidden rounded-2xl bg-[#071a41] p-5 text-white">
          <div className="gy-section-accent absolute inset-x-0 top-0 h-1" />

          <div className="relative">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-blue-200">
              SUPER ADMIN
            </p>

            <h2 className="mt-1 text-lg font-black">
              Wallet Adjustment
            </h2>

            <p className="mt-1 max-w-2xl text-[10px] leading-5 text-blue-100">
              Fund or refund a customer wallet directly.
              Direct Super Admin funding does not create
              a pending customer funding request.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-500">
              Customer Phone
            </label>

            <Input
              type="text"
              inputMode="numeric"
              value={
                adjustmentPhone
              }
              onChange={(value) =>
                setAdjustmentPhone(
                  cleanPhone(
                    value,
                  ),
                )
              }
              placeholder="08012345678"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-500">
              Amount (#)
            </label>

            <Input
              type="text"
              inputMode="decimal"
              value={
                adjustmentAmount
              }
              onChange={(value) =>
                setAdjustmentAmount(
                  cleanAmount(
                    value,
                  ),
                )
              }
              placeholder="5000"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-500">
              Adjustment Type
            </label>

            <Select
              value={
                adjustmentType
              }
              onChange={(value) =>
                setAdjustmentType(
                  value as
                    | 'fund'
                    | 'refund',
                )
              }
            >
              <option value="fund">
                Fund Wallet
              </option>

              <option value="refund">
                Refund / Deduct Wallet
              </option>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-500">
              Reason
            </label>

            <Input
              value={
                adjustmentReason
              }
              onChange={
                setAdjustmentReason
              }
              placeholder="Manual funding"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            kind="green"
            disabled={
              adjustingWallet ||
              adjustmentType !==
                'fund'
            }
            onClick={() =>
              void adminAdjustWallet()
            }
          >
            <Plus size={13} />

            {adjustingWallet &&
            adjustmentType ===
              'fund'
              ? 'Processing...'
              : 'Fund Wallet Directly'}
          </Button>

          <Button
            kind="red"
            disabled={
              adjustingWallet ||
              adjustmentType !==
                'refund'
            }
            onClick={() =>
              void adminAdjustWallet()
            }
          >
            <RefreshCw
              size={13}
            />

            {adjustingWallet &&
            adjustmentType ===
              'refund'
              ? 'Processing...'
              : 'Refund / Deduct'}
          </Button>
        </div>

        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
          <p className="text-[10px] font-bold text-blue-800">
            Direct adjustment
          </p>

          <p className="mt-1 text-[9px] leading-4 text-blue-700">
            Super Admin direct funding goes straight to
            the customer wallet. It does not wait for approval.
          </p>
        </div>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black">
              Customer Wallets
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Current customer wallet balances.
            </p>
          </div>

          <Button
            kind="light"
            onClick={() =>
              void loadUsers()
            }
          >
            <RefreshCw
              size={13}
            />
            Refresh
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Customer
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Name
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Wallet
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {users.map(
                (user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-50"
                  >
                    <td className="px-3 py-3 text-[10px] font-bold text-slate-700">
                      {user.phone}
                    </td>

                    <td className="px-3 py-3 text-[10px] text-slate-600">
                      {user.name ||
                        '-'}
                    </td>

                    <td className="px-3 py-3 text-[10px] font-black text-slate-900">
                      {money(
                        user.wallet_balance,
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusClass(
                          user.is_active
                            ? 'active'
                            : 'inactive',
                        )}`}
                      >
                        {user.is_active
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );

  const usersView = (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
            CUSTOMERS
          </p>

          <h1 className="mt-1 text-2xl font-black text-slate-900">
            Customers
          </h1>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value,
              )
            }
            placeholder="Search phone, name or email"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Phone
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Name
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Email
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Wallet
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Role
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
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
                    <td className="px-3 py-3 text-[10px] font-bold text-slate-700">
                      {user.phone}
                    </td>

                    <td className="px-3 py-3 text-[10px] text-slate-600">
                      {user.name ||
                        '-'}
                    </td>

                    <td className="px-3 py-3 text-[10px] text-slate-500">
                      {user.email ||
                        '-'}
                    </td>

                    <td className="px-3 py-3 text-[10px] font-black text-slate-900">
                      {money(
                        user.wallet_balance,
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-bold ${
                          user.is_admin
                            ? 'bg-violet-50 text-violet-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {user.is_admin
                          ? 'Admin'
                          : 'Customer'}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <Button
                          kind="light"
                          onClick={() => {
                            setSelectedUser(
                              user,
                            );

                            setUserEditForm({
                              name:
                                user.name ||
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
                          }}
                        >
                          <Edit3
                            size={12}
                          />
                          Edit
                        </Button>

                        <Button
                          kind="red"
                          onClick={() =>
                            void deleteUser(
                              user,
                            )
                          }
                        >
                          <Trash2
                            size={12}
                          />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );

  const servicesView = (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
            PRODUCTS
          </p>

          <h1 className="mt-1 text-2xl font-black text-slate-900">
            Products & Services
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Manage GY Data products, prices and availability.
          </p>
        </div>

        <Button
          kind="blue"
          onClick={() => {
            setSelectedProduct(
              null,
            );

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
          }}
        >
          <Plus size={13} />
          New Product
        </Button>
      </div>

      <Panel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(
            (service) => (
              <button
                type="button"
                key={service}
                onClick={() => {
                  setSearchTerm(
                    service,
                  );
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-blue-200 hover:bg-blue-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-slate-900">
                      {
                        SERVICE_LABEL[
                          service
                        ]
                      }
                    </p>

                    <p className="mt-1 text-[9px] text-slate-500">
                      {
                        products.filter(
                          (product) =>
                            product.service ===
                            service,
                        ).length
                      }{' '}
                      products
                    </p>
                  </div>

                  <Package
                    size={18}
                    className="text-blue-600"
                  />
                </div>
              </button>
            ),
          )}
        </div>
      </Panel>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Product
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Service
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Network
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Price
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Status
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {products.map(
                (product) => (
                  <tr
                    key={product.id}
                    className="border-b border-slate-50"
                  >
                    <td className="px-3 py-3 text-[10px] font-bold text-slate-700">
                      {product.name}
                    </td>

                    <td className="px-3 py-3 text-[10px] text-slate-600">
                      {SERVICE_LABEL[
                        product.service
                      ] ||
                        product.service}
                    </td>

                    <td className="px-3 py-3 text-[10px] text-slate-600">
                      {product.network ||
                        '-'}
                    </td>

                    <td className="px-3 py-3 text-[10px] font-black text-slate-900">
                      {money(
                        product.price,
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusClass(
                          product.is_active
                            ? 'active'
                            : 'inactive',
                        )}`}
                      >
                        {product.is_active
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <Button
                          kind="light"
                          onClick={() => {
                            setSelectedProduct(
                              product,
                            );

                            setProductForm({
                              name:
                                product.name,
                              service:
                                product.service,
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
                          }}
                        >
                          <Edit3
                            size={12}
                          />
                          Edit
                        </Button>

                        <Button
                          kind="red"
                          onClick={() =>
                            void deleteProduct(
                              product,
                            )
                          }
                        >
                          <Trash2
                            size={12}
                          />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {(selectedProduct ||
        productForm.name === '') && (
        <Panel>
          <h2 className="text-sm font-black text-slate-900">
            {selectedProduct
              ? 'Edit Product'
              : 'Product Form'}
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Input
              value={
                productForm.name
              }
              onChange={(value) =>
                setProductForm(
                  (current) => ({
                    ...current,
                    name: value,
                  }),
                )
              }
              placeholder="Product name"
            />

            <Select
              value={
                productForm.service
              }
              onChange={(value) =>
                setProductForm(
                  (current) => ({
                    ...current,
                    service: value,
                  }),
                )
              }
            >
              {SERVICES.map(
                (service) => (
                  <option
                    key={service}
                    value={service}
                  >
                    {
                      SERVICE_LABEL[
                        service
                      ]
                    }
                  </option>
                ),
              )}
            </Select>

            <Input
              value={
                productForm.network
              }
              onChange={(value) =>
                setProductForm(
                  (current) => ({
                    ...current,
                    network: value,
                  }),
                )
              }
              placeholder="Network"
            />

            <Input
              type="text"
              inputMode="decimal"
              value={
                productForm.price
              }
              onChange={(value) =>
                setProductForm(
                  (current) => ({
                    ...current,
                    price:
                      cleanAmount(
                        value,
                      ),
                  }),
                )
              }
              placeholder="Price (#)"
            />

            <Input
              value={
                productForm.category
              }
              onChange={(value) =>
                setProductForm(
                  (current) => ({
                    ...current,
                    category: value,
                  }),
                )
              }
              placeholder="Category"
            />

            <Input
              type="text"
              inputMode="decimal"
              value={
                productForm.cashback_percent
              }
              onChange={(value) =>
                setProductForm(
                  (current) => ({
                    ...current,
                    cashback_percent:
                      cleanAmount(
                        value,
                      ),
                  }),
                )
              }
              placeholder="Cashback %"
            />

            <div className="md:col-span-2">
              <Input
                value={
                  productForm.description
                }
                onChange={(value) =>
                  setProductForm(
                    (current) => ({
                      ...current,
                      description:
                        value,
                    }),
                  )
                }
                placeholder="Description"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              kind="green"
              onClick={() =>
                void saveProduct()
              }
            >
              <Check size={13} />
              Save Product
            </Button>

            {selectedProduct && (
              <Button
                kind="light"
                onClick={() => {
                  setSelectedProduct(
                    null,
                  );

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
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </Panel>
      )}
    </div>
  );

  const transactionsView = (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
          TRANSACTIONS
        </p>

        <h1 className="mt-1 text-2xl font-black text-slate-900">
          Transactions
        </h1>
      </div>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Reference
                </th>
                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Phone
                </th>
                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Service
                </th>
                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Amount
                </th>
                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Status
                </th>
                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {transactions.map(
                (transaction) => (
                  <tr
                    key={
                      transaction.id
                    }
                    className="border-b border-slate-50"
                  >
                    <td className="px-3 py-3 text-[10px] font-bold text-slate-700">
                      {transaction.reference ||
                        transaction.id}
                    </td>

                    <td className="px-3 py-3 text-[10px] text-slate-600">
                      {transaction.phone ||
                        '-'}
                    </td>

                    <td className="px-3 py-3 text-[10px] text-slate-600">
                      {transaction.product ||
                        transaction.service ||
                        '-'}
                    </td>

                    <td className="px-3 py-3 text-[10px] font-black text-slate-900">
                      {money(
                        transaction.amount,
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusClass(
                          transaction.status,
                        )}`}
                      >
                        {transaction.status ||
                          '-'}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-[9px] text-slate-400">
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
      </Panel>
    </div>
  );

  const fundingView = (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
          FUNDING
        </p>

        <h1 className="mt-1 text-2xl font-black text-slate-900">
          Funding Requests
        </h1>

        <p className="mt-1 text-xs text-slate-500">
          Customer requests awaiting Super Admin review.
        </p>
      </div>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Phone
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Amount
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Status
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Date
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {fundingRequests.map(
                (request) => (
                  <tr
                    key={
                      request.id
                    }
                    className="border-b border-slate-50"
                  >
                    <td className="px-3 py-3 text-[10px] font-bold">
                      {request.phone ||
                        '-'}
                    </td>

                    <td className="px-3 py-3 text-[10px] font-black">
                      {money(
                        request.amount,
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusClass(
                          request.status,
                        )}`}
                      >
                        {request.status ||
                          'pending'}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-[9px] text-slate-400">
                      {formatDate(
                        request.created_at,
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <Button
                          kind="green"
                          onClick={() =>
                            void approveFunding(
                              request.id,
                            )
                          }
                        >
                          <Check
                            size={12}
                          />
                          Approve
                        </Button>

                        <Button
                          kind="red"
                          onClick={() =>
                            void rejectFunding(
                              request.id,
                            )
                          }
                        >
                          <X
                            size={12}
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
      </Panel>
    </div>
  );

  const adminsView = (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
          ACCESS CONTROL
        </p>

        <h1 className="mt-1 text-2xl font-black text-slate-900">
          Admin Management
        </h1>

        <p className="mt-1 text-xs text-slate-500">
          Super Admin can manage Admin accounts.
        </p>
      </div>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Phone
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Name
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Email
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Status
                </th>

                <th className="px-3 py-3 text-[9px] font-bold uppercase text-slate-400">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {users
                .filter(
                  (user) =>
                    user.is_admin,
                )
                .map(
                  (admin) => (
                    <tr
                      key={
                        admin.id
                      }
                      className="border-b border-slate-50"
                    >
                      <td className="px-3 py-3 text-[10px] font-bold">
                        {admin.phone}
                      </td>

                      <td className="px-3 py-3 text-[10px]">
                        {admin.name ||
                          '-'}
                      </td>

                      <td className="px-3 py-3 text-[10px]">
                        {admin.email ||
                          '-'}
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusClass(
                            admin.is_active
                              ? 'active'
                              : 'inactive',
                          )}`}
                        >
                          {admin.is_active
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <Button
                          kind="light"
                          onClick={() => {
                            setSelectedUser(
                              admin,
                            );

                            setUserEditForm({
                              name:
                                admin.name ||
                                '',
                              email:
                                admin.email ||
                                '',
                              is_active:
                                admin.is_active !==
                                false,
                              is_admin:
                                true,
                            });
                          }}
                        >
                          <Edit3
                            size={12}
                          />
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ),
                )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex gap-3">
            <ShieldCheck
              size={20}
              className="shrink-0 text-blue-700"
            />

            <div>
              <p className="text-xs font-black text-blue-900">
                Super Admin protection
              </p>

              <p className="mt-1 text-[10px] leading-5 text-blue-700">
                Admin accounts are separate from the Super Admin.
                An Admin cannot promote itself to Super Admin.
              </p>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );

  const revenueView = (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
          REVENUE
        </p>

        <h1 className="mt-1 text-2xl font-black text-slate-900">
          Revenue
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Revenue"
          value={money(
            totalRevenue,
          )}
          subtitle="Successful transactions"
          Icon={BarChart3}
        />

        <StatCard
          title="Successful"
          value={String(
            successfulTransactions.length,
          )}
          subtitle="Completed transactions"
          Icon={Check}
        />

        <StatCard
          title="Transactions"
          value={String(
            transactions.length,
          )}
          subtitle="Recent transaction records"
          Icon={CreditCard}
        />
      </div>
    </div>
  );

  const notificationsView = (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
          COMMUNICATION
        </p>

        <h1 className="mt-1 text-2xl font-black text-slate-900">
          Notifications
        </h1>
      </div>

      <Panel>
        <div className="grid gap-4">
          <Input
            value={
              notifyForm.title
            }
            onChange={(value) =>
              setNotifyForm(
                (current) => ({
                  ...current,
                  title: value,
                }),
              )
            }
            placeholder="Notification title"
          />

          <Input
            value={
              notifyForm.message
            }
            onChange={(value) =>
              setNotifyForm(
                (current) => ({
                  ...current,
                  message: value,
                }),
              )
            }
            placeholder="Notification message"
          />

          <Select
            value={
              notifyForm.type
            }
            onChange={(value) =>
              setNotifyForm(
                (current) => ({
                  ...current,
                  type: value,
                }),
              )
            }
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
          </Select>

          <Button
            kind="blue"
            onClick={() =>
              void updateNotification()
            }
          >
            <Bell size={13} />
            Send Notification
          </Button>
        </div>
      </Panel>

      <Panel>
        <div className="space-y-3">
          {notifications.map(
            (notification) => (
              <div
                key={
                  notification.id
                }
                className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3"
              >
                <div>
                  <p className="text-xs font-black text-slate-900">
                    {
                      notification.title
                    }
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    {
                      notification.message
                    }
                  </p>
                </div>

                <Button
                  kind="red"
                  onClick={() =>
                    void deleteNotification(
                      notification.id,
                    )
                  }
                >
                  <Trash2
                    size={12}
                  />
                </Button>
              </div>
            ),
          )}
        </div>
      </Panel>
    </div>
  );

  const securityView = (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
          SECURITY
        </p>

        <h1 className="mt-1 text-2xl font-black text-slate-900">
          Security
        </h1>
      </div>

      <Panel>
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={22}
            className="text-blue-700"
          />

          <div>
            <h2 className="text-sm font-black">
              Super Admin Protection
            </h2>

            <p className="mt-1 text-[10px] leading-5 text-slate-500">
              Super Admin permissions remain separate from
              normal Admin permissions.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );

  const settingsView = (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
          SYSTEM
        </p>

        <h1 className="mt-1 text-2xl font-black text-slate-900">
          Settings
        </h1>
      </div>

      <Panel>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-black">
              Maintenance Mode
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Control system maintenance state.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setMaintenance(
                (current) =>
                  !current,
              )
            }
            className={`relative h-6 w-11 rounded-full ${
              maintenance
                ? 'bg-blue-700'
                : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                maintenance
                  ? 'left-6'
                  : 'left-1'
              }`}
            />
          </button>
        </div>
      </Panel>

      <Panel>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-black text-emerald-800">
            Currency
          </p>

          <p className="mt-1 text-[10px] text-emerald-700">
            GY Data uses # as the dashboard currency symbol.
          </p>
        </div>
      </Panel>
    </div>
  );

  let content: ReactNode =
    overviewView;

  if (section === 'users') {
    content = usersView;
  }

  if (section === 'wallet') {
    content = walletView;
  }

  if (
    section ===
    'transactions'
  ) {
    content =
      transactionsView;
  }

  if (section === 'revenue') {
    content = revenueView;
  }

  if (section === 'funding') {
    content = fundingView;
  }

  if (section === 'services') {
    content = servicesView;
  }

  if (section === 'admins') {
    content = adminsView;
  }

  if (section === 'security') {
    content = securityView;
  }

  if (
    section ===
    'notifications'
  ) {
    content =
      notificationsView;
  }

  if (section === 'settings') {
    content = settingsView;
  }

  return (
    <div className="gy-super-admin min-h-screen bg-slate-50">
      <style>
        {superAdminStyles}
      </style>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#071a41] text-white transition-transform lg:translate-x-0 ${
          mobileMenu
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-600 p-2">
                <Zap size={18} />
              </div>

              <div>
                <p className="text-sm font-black">
                  GY DATA
                </p>

                <p className="text-[9px] font-bold uppercase tracking-widest text-blue-300">
                  Super Admin
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {navItems.map(
              ({
                key,
                label,
                Icon,
              }) => (
                <button
                  type="button"
                  key={key}
                  onClick={() =>
                    goTo(key)
                  }
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold ${
                    section === key
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-100 hover:bg-white/10'
                  }`}
                >
                  <Icon
                    size={15}
                  />
                  <span>
                    {label}
                  </span>

                  {key ===
                    'funding' &&
                    fundingRequests.length >
                      0 && (
                      <span className="ml-auto rounded-full bg-orange-500 px-1.5 py-0.5 text-[8px] text-white">
                        {
                          fundingRequests.length
                        }
                      </span>
                    )}
                </button>
              ),
            )}
          </nav>

          <div className="border-t border-white/10 p-3">
            <button
              type="button"
              onClick={() =>
                navigate('/')
              }
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-blue-100 hover:bg-white/10"
            >
              <LogOut
                size={15}
              />
              Exit Dashboard
            </button>
          </div>
        </div>
      </aside>

      {mobileMenu && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() =>
            setMobileMenu(false)
          }
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setMobileMenu(
                    true,
                  )
                }
                className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden"
              >
                <Menu size={17} />
              </button>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-blue-600">
                  SUPER ADMIN
                </p>

                <p className="text-sm font-black text-slate-900">
                  GY Data Control Centre
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  void loadAll()
                }
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw
                  size={15}
                  className={
                    loading
                      ? 'animate-spin'
                      : ''
                  }
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  goTo(
                    'notifications',
                  )
                }
                className="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
              >
                <Bell size={15} />

                {notifications.length >
                  0 && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white" />
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6">
          {notice && (
            <div
              className={`fixed right-4 top-20 z-[100] max-w-sm rounded-xl border bg-white p-4 shadow-2xl ${
                notice.type ===
                'success'
                  ? 'border-emerald-200'
                  : notice.type ===
                      'pending'
                    ? 'border-amber-200'
                    : 'border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-full p-2 ${
                    notice.type ===
                    'success'
                      ? 'bg-emerald-50 text-emerald-700'
                      : notice.type ===
                          'pending'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                  }`}
                >
                  {notice.type ===
                    'success' && (
                    <Check
                      size={14}
                    />
                  )}

                  {notice.type ===
                    'pending' && (
                    <RefreshCw
                      size={14}
                    />
                  )}

                  {notice.type ===
                    'error' && (
                    <X
                      size={14}
                    />
                  )}
                </div>

                <div>
                  <p className="text-xs font-black text-slate-900">
                    GY Data
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    {
                      notice.message
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {content}
        </main>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black">
                  Edit User
                </h2>

                <p className="mt-1 text-[10px] text-slate-400">
                  {selectedUser.phone}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedUser(
                    null,
                  )
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={15} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <Input
                value={
                  userEditForm.name
                }
                onChange={(value) =>
                  setUserEditForm(
                    (current) => ({
                      ...current,
                      name: value,
                    }),
                  )
                }
                placeholder="Name"
              />

              <Input
                value={
                  userEditForm.email
                }
                onChange={(value) =>
                  setUserEditForm(
                    (current) => ({
                      ...current,
                      email: value,
                    }),
                  )
                }
                placeholder="Email"
              />

              <label className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                <span className="text-xs font-bold text-slate-700">
                  Active Account
                </span>

                <input
                  type="checkbox"
                  checked={
                    userEditForm.is_active
                  }
                  onChange={(event) =>
                    setUserEditForm(
                      (current) => ({
                        ...current,
                        is_active:
                          event.target
                            .checked,
                      }),
                    )
                  }
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                <span className="text-xs font-bold text-slate-700">
                  Admin Access
                </span>

                <input
                  type="checkbox"
                  checked={
                    userEditForm.is_admin
                  }
                  onChange={(event) =>
                    setUserEditForm(
                      (current) => ({
                        ...current,
                        is_admin:
                          event.target
                            .checked,
                      }),
                    )
                  }
                />
              </label>

              <div className="flex gap-2">
                <Button
                  kind="blue"
                  onClick={() =>
                    void saveUser()
                  }
                >
                  <Check
                    size={13}
                  />
                  Save Changes
                </Button>

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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
