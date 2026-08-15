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
  DollarSign,
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
      radial-gradient(circle at 8% 10%, rgba(37, 99, 235, .18), transparent 28%),
      radial-gradient(circle at 92% 12%, rgba(168, 85, 247, .16), transparent 28%),
      radial-gradient(circle at 52% 92%, rgba(6, 182, 212, .14), transparent 30%),
      radial-gradient(circle at 18% 78%, rgba(236, 72, 153, .10), transparent 25%);
  }

  .gy-super-admin::after {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background: linear-gradient(
      120deg,
      rgba(37, 99, 235, .025),
      rgba(168, 85, 247, .035),
      rgba(6, 182, 212, .025),
      rgba(236, 72, 153, .03)
    );
    background-size: 300% 300%;
    animation: gyRainbowMove 16s ease infinite;
  }

  @keyframes gyRainbowMove {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  .gy-super-admin .gy-colorful-title {
    background: linear-gradient(
      90deg,
      #2563eb,
      #7c3aed,
      #06b6d4,
      #ec4899,
      #f59e0b,
      #22c55e,
      #2563eb
    );
    background-size: 400% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gyTitleRainbow 9s linear infinite;
  }

  @keyframes gyTitleRainbow {
    0% { background-position: 0% 50%; }
    100% { background-position: 400% 50%; }
  }

  .gy-super-admin .gy-rainbow-money {
    background: linear-gradient(
      90deg,
      #ef4444,
      #f97316,
      #eab308,
      #22c55e,
      #06b6d4,
      #3b82f6,
      #8b5cf6,
      #ec4899,
      #ef4444
    );
    background-size: 500% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gyMoneyRainbow 7s linear infinite;
    font-weight: 900;
  }

  @keyframes gyMoneyRainbow {
    0% { background-position: 0% 50%; }
    100% { background-position: 500% 50%; }
  }

  .gy-super-admin .gy-dashboard-card {
    transition:
      transform .2s ease,
      box-shadow .2s ease,
      border-color .2s ease;
  }

  .gy-super-admin .gy-dashboard-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 36px rgba(37, 99, 235, .12);
    border-color: rgba(59, 130, 246, .35);
  }

  .gy-super-admin .gy-gradient-bar {
    background: linear-gradient(
      90deg,
      #2563eb,
      #7c3aed,
      #06b6d4,
      #ec4899,
      #f59e0b,
      #22c55e,
      #2563eb
    );
    background-size: 400% 100%;
    animation: gyGradientBar 10s linear infinite;
  }

  @keyframes gyGradientBar {
    0% { background-position: 0% 50%; }
    100% { background-position: 400% 50%; }
  }

  .gy-super-admin button {
    transition:
      transform .18s ease,
      box-shadow .18s ease,
      border-color .18s ease;
  }

  .gy-super-admin button:hover {
    box-shadow: 0 8px 25px rgba(37, 99, 235, .10);
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
    blue: 'bg-blue-700 text-white hover:bg-blue-800',
    dark: 'bg-[#071a41] text-white hover:bg-[#0b2456]',
    red: 'bg-red-50 text-red-700 hover:bg-red-100',
    light: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    green: 'bg-emerald-600 text-white hover:bg-emerald-700',
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
}: {
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <input
    type={type}
    value={value ?? ''}
    onChange={(event) => onChange(event.target.value)}
    placeholder={placeholder}
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
    onChange={(event) => onChange(event.target.value)}
    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
  >
    {children}
  </select>
);

const Card = ({
  title,
  value,
  subtitle,
  icon: Icon,
  onClick,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="gy-dashboard-card group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
  >
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </p>

        <p
          className={`mt-1 truncate text-xl font-black ${
            value.startsWith('#')
              ? 'gy-rainbow-money'
              : 'text-slate-900'
          }`}
        >
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

const formatDate = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  try {
    return new Date(value).toLocaleString('en-NG');
  } catch {
    return value;
  }
};

const statusClass = (status?: string | null) => {
  const normalized = String(status || '').toLowerCase();

  if (
    normalized === 'success' ||
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

const normalizeUser = (row: any): User => ({
  id: String(row?.id || ''),
  phone: String(row?.phone || ''),
  name: row?.name ?? null,
  email: row?.email ?? null,
  wallet_balance: Number(row?.wallet_balance || 0),
  is_admin: Boolean(row?.is_admin),
  is_active:
    row?.is_active === undefined
      ? true
      : Boolean(row?.is_active),
  created_at: row?.created_at ?? null,
});

const normalizeTransaction = (
  row: any,
): Transaction => ({
  id: String(row?.id || ''),
  phone: row?.phone ?? null,
  type: row?.type ?? null,
  service: row?.service ?? null,
  product: row?.product ?? null,
  amount: Number(row?.amount || 0),
  status: row?.status ?? null,
  recipient: row?.recipient ?? null,
  network: row?.network ?? null,
  created_at: row?.created_at ?? null,
  reference: row?.reference ?? null,
});

const normalizeFundingRequest = (
  row: any,
): FundingRequest => ({
  id: String(row?.id || ''),
  phone: row?.phone ?? null,
  amount: Number(row?.amount || 0),
  status: row?.status ?? null,
  reason: row?.reason ?? null,
  created_at: row?.created_at ?? null,
});

const normalizeNotification = (
  row: any,
): Notification => ({
  id: String(row?.id || ''),
  title: String(row?.title || ''),
  message: String(row?.message || ''),
  type: row?.type ?? null,
  created_at: row?.created_at ?? null,
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
    useState('');

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
  ) => {
    setNotice(message);

    window.setTimeout(() => {
      setNotice('');
    }, 3500);
  };

  const loadUsers = async () => {
    const { data, error } =
      await supabase
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
      (data || []).map(normalizeUser),
    );
  };

  const loadTransactions = async () => {
    const { data, error } =
      await supabase
        .from('transactions')
        .select('*')
        .order('created_at', {
          ascending: false,
        })
        .limit(500);

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

  const loadFundingRequests = async () => {
    const { data, error } =
      await supabase
        .from('funding_requests')
        .select('*')
        .order('created_at', {
          ascending: false,
        })
        .limit(300);

    if (error) {
      console.error(error);
      return;
    }

    setFundingRequests(
      (data || []).map(
        normalizeFundingRequest,
      ),
    );
  };

  const loadProducts = async () => {
    const { data, error } =
      await supabase
        .from('products')
        .select('*')
        .order('service', {
          ascending: true,
        })
        .order('name', {
          ascending: true,
        });

    if (error) {
      console.error(error);
      return;
    }

    setProducts(
      (data || []).map(
        (row: any) => ({
          id: String(row?.id || ''),
          service: String(
            row?.service || '',
          ),
          name: String(
            row?.name || '',
          ),
          price: Number(
            row?.price || 0,
          ),
          network:
            row?.network ?? null,
          description:
            row?.description ?? null,
          is_active:
            row?.is_active === undefined
              ? true
              : Boolean(row?.is_active),
          category:
            row?.category ?? null,
          cashback_percent:
            row?.cashback_percent == null
              ? null
              : Number(
                  row.cashback_percent,
                ),
        }),
      ),
    );
  };

  const loadNotifications = async () => {
    const { data, error } =
      await supabase
        .from('notifications')
        .select('*')
        .order('created_at', {
          ascending: false,
        })
        .limit(100);

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

  const loadAll = async () => {
    setLoading(true);

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
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const goTo = (
    nextSection: Section,
  ) => {
    setSection(nextSection);
    setMobileMenu(false);
  };

  const totalWallet = useMemo(
    () =>
      users.reduce(
        (total, user) =>
          total +
          Number(
            user.wallet_balance || 0,
          ),
        0,
      ),
    [users],
  );

  const activeUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.is_active !== false,
      ),
    [users],
  );

  const revenue = useMemo(
    () =>
      transactions
        .filter(
          (transaction) =>
            String(
              transaction.status || '',
            ).toLowerCase() ===
            'success',
        )
        .reduce(
          (total, transaction) =>
            total +
            Number(
              transaction.amount || 0,
            ),
          0,
        ),
    [transactions],
  );

  const pendingFunding = useMemo(
    () =>
      fundingRequests.filter(
        (request) =>
          String(
            request.status || '',
          ).toLowerCase() ===
          'pending',
      ),
    [fundingRequests],
  );

  const filteredUsers = useMemo(() => {
    const query =
      searchTerm.trim().toLowerCase();

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
  }, [users, searchTerm]);

  const adminAdjustWallet = async () => {
    const phone = adjustmentPhone.trim();
    const amount = Number(
      adjustmentAmount,
    );

    if (!phone) {
      showNotice(
        'Enter customer phone number',
      );
      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      showNotice(
        'Enter a valid amount',
      );
      return;
    }

    const adminPhone =
      users.find(
        (user) => user.is_admin,
      )?.phone ||
      'sadmin@gyd.com';

    setAdjustingWallet(true);

    try {
      const response = await fetch(
        '/api/funding/admin-adjust',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
            'x-admin-phone': adminPhone,
          },
          body: JSON.stringify({
            phone,
            amount,
            type: adjustmentType,
            reason:
              adjustmentReason.trim() ||
              'Super Admin wallet adjustment',
            adminPhone,
          }),
        },
      );

      const result = await response
        .json()
        .catch(() => ({}));

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            'Wallet adjustment failed',
        );
      }

      showNotice(
        adjustmentType === 'fund'
          ? 'Customer wallet funded successfully'
          : 'Customer wallet refunded successfully',
      );

      setAdjustmentAmount('');
      setAdjustmentReason('');

      await loadAll();
    } catch (error: any) {
      console.error(error);

      showNotice(
        error?.message ||
          'Wallet adjustment failed',
      );
    } finally {
      setAdjustingWallet(false);
    }
  };

  const updateNotification = async () => {
    if (
      !notifyForm.title.trim() ||
      !notifyForm.message.trim()
    ) {
      showNotice(
        'Notification title and message are required',
      );
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .insert({
        title: notifyForm.title.trim(),
        message:
          notifyForm.message.trim(),
        type: notifyForm.type,
      });

    if (error) {
      console.error(error);
      showNotice(error.message);
      return;
    }

    setNotifyForm({
      title: '',
      message: '',
      type: 'info',
    });

    showNotice(
      'Notification created',
    );

    await loadAll();
  };

  const approveFunding = async (
    requestId: string,
    action: 'approve' | 'reject',
  ) => {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/funding/${action}`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            requestId,
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
            'Funding action failed',
        );
      }

      showNotice(
        action === 'approve'
          ? 'Funding approved'
          : 'Funding rejected',
      );

      await loadAll();
    } catch (error: any) {
      console.error(error);

      showNotice(
        error?.message ||
          'Funding action failed',
      );
    } finally {
      setLoading(false);
    }
  };

  const saveProduct = async () => {
    if (
      !productForm.name.trim()
    ) {
      showNotice(
        'Product name is required',
      );
      return;
    }

    const price = Number(
      productForm.price,
    );

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      showNotice(
        'Enter a valid product price',
      );
      return;
    }

    setLoading(true);

    try {
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
          productForm.cashback_percent
            ? Number(
                productForm.cashback_percent,
              )
            : null,
        is_active:
          productForm.is_active,
      };

      let result;

      if (selectedProduct?.id) {
        result = await supabase
          .from('products')
          .update(payload)
          .eq(
            'id',
            selectedProduct.id,
          );
      } else {
        result = await supabase
          .from('products')
          .insert(payload);
      }

      if (result.error) {
        throw result.error;
      }

      showNotice(
        selectedProduct?.id
          ? 'Product updated'
          : 'Product created',
      );

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

      await loadProducts();
    } catch (error: any) {
      console.error(error);

      showNotice(
        error?.message ||
          'Unable to save product',
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (
    id: string,
  ) => {
    if (
      !window.confirm(
        'Delete this product?',
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase
          .from('products')
          .delete()
          .eq('id', id);

      if (error) {
        throw error;
      }

      showNotice(
        'Product deleted',
      );

      await loadProducts();
    } catch (error: any) {
      console.error(error);

      showNotice(
        error?.message ||
          'Unable to delete product',
      );
    } finally {
      setLoading(false);
    }
  };

  const editProduct = (
    product: Product,
  ) => {
    setSelectedProduct(product);

    setProductForm({
      name: product.name,
      service: product.service,
      network:
        product.network || '',
      price: String(
        product.price ?? '',
      ),
      description:
        product.description || '',
      category:
        product.category || '',
      cashback_percent:
        product.cashback_percent ==
        null
          ? ''
          : String(
              product.cashback_percent,
            ),
      is_active:
        product.is_active,
    });
  };

  const editUser = (
    user: User,
  ) => {
    setSelectedUser(user);

    setUserEditForm({
      name: user.name || '',
      email: user.email || '',
      is_active:
        user.is_active !== false,
      is_admin:
        Boolean(user.is_admin),
    });
  };

  const saveUser = async () => {
    if (!selectedUser?.id) {
      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase
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
          })
          .eq(
            'id',
            selectedUser.id,
          );

      if (error) {
        throw error;
      }

      showNotice(
        'Customer updated successfully',
      );

      setSelectedUser(null);

      await loadUsers();
    } catch (error: any) {
      console.error(error);

      showNotice(
        error?.message ||
          'Unable to update customer',
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (
    user: User,
  ) => {
    if (
      !window.confirm(
        `Delete "${user.phone}"?`,
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);

      if (error) {
        throw error;
      }

      showNotice(
        'Customer deleted',
      );

      await loadUsers();
    } catch (error: any) {
      console.error(error);

      showNotice(
        error?.message ||
          'Unable to delete customer',
      );
    } finally {
      setLoading(false);
    }
  };

  const saveCashback = async () => {
    if (!cashback?.id) {
      return;
    }

    const value = Number(
      cashback.cashback_percent || 0,
    );

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      showNotice(
        'Enter a valid cashback percentage',
      );
      return;
    }

    const { error } =
      await supabase
        .from('products')
        .update({
          cashback_percent:
            value,
        })
        .eq(
          'id',
          cashback.id,
        );

    if (error) {
      console.error(error);
      showNotice(error.message);
      return;
    }

    showNotice(
      'Cashback updated',
    );

    setCashback(null);

    await loadProducts();
  };

  const saveSettingsCashback =
    async () => {
      const value = Number(
        cashbackForm.default_percent ||
          0,
      );

      if (
        !Number.isFinite(value) ||
        value < 0
      ) {
        showNotice(
          'Enter a valid cashback percentage',
        );
        return;
      }

      setCashbackForm(
        (current: any) => ({
          ...current,
          default_percent:
            String(value),
        }),
      );

      showNotice(
        'Cashback settings updated',
      );
    };

  const toggleProduct = async (
    product: Product,
  ) => {
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
      console.error(error);
      showNotice(error.message);
      return;
    }

    showNotice(
      `${product.name} ${
        product.is_active
          ? 'disabled'
          : 'enabled'
      }`,
    );

    await loadProducts();
  };

  const menuItems: Array<{
    id: Section;
    label: string;
    icon: any;
  }> = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Activity,
    },
    {
      id: 'users',
      label: 'Customers',
      icon: Users,
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: Wallet,
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: CreditCard,
    },
    {
      id: 'revenue',
      label: 'Revenue',
      icon: BarChart3,
    },
    {
      id: 'funding',
      label: 'Funding',
      icon: Plus,
    },
    {
      id: 'services',
      label: 'Services',
      icon: Package,
    },
    {
      id: 'admins',
      label: 'Admins',
      icon: ShieldCheck,
    },
    {
      id: 'security',
      label: 'Security',
      icon: ShieldCheck,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const Panel = ({
    children,
    className = '',
  }: {
    children: ReactNode;
    className?: string;
  }) => (
    <div
      className={`gy-dashboard-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );

  const overviewView = (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl bg-[#071a41] p-6 text-white shadow-lg">
        <div className="gy-gradient-bar absolute inset-x-0 top-0 h-1" />

        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-purple-500/20 blur-2xl" />
        <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-cyan-400/10 blur-2xl" />

        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-200">
            GY DATA • SUPER ADMIN
          </p>

          <h1 className="mt-2 text-2xl font-black">
            Dashboard Overview
          </h1>

          <p className="mt-1 max-w-xl text-xs leading-5 text-blue-100">
            Manage customers, wallets, transactions,
            services and platform activity from one place.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Customers"
          value={String(users.length)}
          subtitle={`${activeUsers.length} active`}
          icon={Users}
          onClick={() =>
            goTo('users')
          }
        />

        <Card
          title="Customer Wallets"
          value={money(totalWallet)}
          subtitle="Total customer wallet balance"
          icon={Wallet}
          onClick={() =>
            goTo('wallet')
          }
        />

        <Card
          title="Revenue"
          value={money(revenue)}
          subtitle="Successful transaction volume"
          icon={DollarSign}
          onClick={() =>
            goTo('revenue')
          }
        />

        <Card
          title="Pending Funding"
          value={String(
            pendingFunding.length,
          )}
          subtitle="Requests awaiting approval"
          icon={Bell}
          onClick={() =>
            goTo('funding')
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black">
                Recent Transactions
              </h2>

              <p className="mt-1 text-[10px] text-slate-500">
                Latest activity across the platform.
              </p>
            </div>

            <Button
              kind="light"
              onClick={() =>
                goTo('transactions')
              }
            >
              View all
              <ChevronRight size={13} />
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {transactions
              .slice(0, 7)
              .map(
                (transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black">
                        {transaction.phone ||
                          transaction.recipient ||
                          '-'}
                      </p>

                      <p className="mt-1 truncate text-[10px] text-slate-500">
                        {transaction.product ||
                          transaction.service ||
                          transaction.type ||
                          'Transaction'}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-black">
                        {money(
                          transaction.amount,
                        )}
                      </p>

                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-1 text-[9px] font-bold ${statusClass(
                          transaction.status,
                        )}`}
                      >
                        {transaction.status ||
                          'unknown'}
                      </span>
                    </div>
                  </div>
                ),
              )}

            {!transactions.length && (
              <p className="py-8 text-center text-xs text-slate-500">
                No transactions found.
              </p>
            )}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black">
                Pending Funding
              </h2>

              <p className="mt-1 text-[10px] text-slate-500">
                Customer funding requests awaiting review.
              </p>
            </div>

            <Button
              kind="light"
              onClick={() =>
                goTo('funding')
              }
            >
              Open
              <ChevronRight size={13} />
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {pendingFunding
              .slice(0, 7)
              .map(
                (request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div>
                      <p className="text-xs font-black">
                        {request.phone ||
                          '-'}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-500">
                        {formatDate(
                          request.created_at,
                        )}
                      </p>
                    </div>

                    <p className="text-xs font-black">
                      {money(
                        request.amount,
                      )}
                    </p>
                  </div>
                ),
              )}

            {!pendingFunding.length && (
              <p className="py-8 text-center text-xs text-slate-500">
                No pending funding requests.
              </p>
            )}
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black">
              Services
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Current service/product availability.
            </p>
          </div>

          <Button
            kind="light"
            onClick={() =>
              goTo('services')
            }
          >
            Manage
            <ChevronRight size={13} />
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {SERVICES.map(
            (service) => {
              const count =
                products.filter(
                  (product) =>
                    product.service ===
                    service,
                ).length;

              const active =
                products.filter(
                  (product) =>
                    product.service ===
                      service &&
                    product.is_active,
                ).length;

              return (
                <button
                  key={service}
                  type="button"
                  onClick={() =>
                    goTo('services')
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white"
                >
                  <p className="text-xs font-black">
                    {SERVICE_LABEL[
                      service
                    ] ||
                      service}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-500">
                    {active}/{count} active
                  </p>
                </button>
              );
            },
          )}
        </div>
      </Panel>
    </div>
  );

  const usersView = (
    <div className="space-y-4">
      <Panel>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-black">
              Customers
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Search and manage customer accounts.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search
              size={14}
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
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </Panel>

      <Panel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-500">
                  Customer
                </th>

                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-500">
                  Wallet
                </th>

                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-500">
                  Status
                </th>

                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-500">
                  Joined
                </th>

                <th className="px-4 py-3 text-right text-[9px] font-black uppercase tracking-wider text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map(
                (user) => (
                  <tr
                    key={user.id}
                    className="border-t border-slate-100 hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3">
                      <p className="text-xs font-black">
                        {user.name ||
                          'Customer'}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-500">
                        {user.phone}
                      </p>

                      {user.email && (
                        <p className="mt-0.5 text-[9px] text-slate-400">
                          {user.email}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-xs font-black">
                        {money(
                          user.wallet_balance,
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusClass(
                          user.is_active ===
                            false
                            ? 'inactive'
                            : 'active',
                        )}`}
                      >
                        {user.is_active ===
                        false
                          ? 'Inactive'
                          : 'Active'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-[10px] text-slate-500">
                      {formatDate(
                        user.created_at,
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          kind="light"
                          onClick={() =>
                            editUser(
                              user,
                            )
                          }
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

        {!filteredUsers.length && (
          <p className="py-10 text-center text-xs text-slate-500">
            No customers found.
          </p>
        )}
      </Panel>
    </div>
  );

  const walletView = (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Card
          title="Total Wallet Balance"
          value={money(totalWallet)}
          subtitle={`${users.length} registered users`}
          icon={Wallet}
          onClick={() =>
            goTo('users')
          }
        />

        <Card
          title="Active Users"
          value={String(
            activeUsers.length,
          )}
          subtitle="Currently active accounts"
          icon={Users}
          onClick={() =>
            goTo('users')
          }
        />
      </div>

      <Panel>
        <div className="relative overflow-hidden rounded-2xl bg-[#071a41] p-5 text-white">
          <div className="gy-gradient-bar absolute inset-x-0 top-0 h-1" />

          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-500/20 blur-2xl" />

          <div className="relative">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-blue-200">
              SUPER ADMIN
            </p>

            <h2 className="mt-1 text-lg font-black">
              Wallet Adjustment
            </h2>

            <p className="mt-1 max-w-2xl text-[10px] leading-5 text-blue-100">
              Fund or refund a customer wallet directly.
              Direct Super Admin funding is separate from
              customer funding requests and does not wait
              for customer approval.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-500">
              Customer Phone
            </label>

            <Input
              value={adjustmentPhone}
              onChange={setAdjustmentPhone}
              placeholder="08012345678"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-500">
              Amount (#)
            </label>

            <Input
              type="number"
              value={adjustmentAmount}
              onChange={setAdjustmentAmount}
              placeholder="5000"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-500">
              Adjustment Type
            </label>

            <Select
              value={adjustmentType}
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
              value={adjustmentReason}
              onChange={setAdjustmentReason}
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
            This action calls the Super Admin wallet
            adjustment endpoint directly. It should not
            create a pending funding request.
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
              Current balances.
            </p>
          </div>

          <Button
            kind="light"
            onClick={() =>
              void loadUsers()
            }
          >
            <RefreshCw
              size={12}
            />
            Refresh
          </Button>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {users
            .slice(0, 20)
            .map(
              (user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div>
                    <p className="text-xs font-black">
                      {user.name ||
                        'Customer'}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-500">
                      {user.phone}
                    </p>
                  </div>

                  <p className="text-xs font-black">
                    {money(
                      user.wallet_balance,
                    )}
                  </p>
                </div>
              ),
            )}
        </div>
      </Panel>
    </div>
  );

  const transactionsView = (
    <div className="space-y-4">
      <Panel>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black">
              Transactions
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Latest platform transactions.
            </p>
          </div>

          <Button
            kind="light"
            onClick={() =>
              void loadTransactions()
            }
          >
            <RefreshCw
              size={12}
            />
            Refresh
          </Button>
        </div>
      </Panel>

      <Panel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-500">
                  Customer
                </th>

                <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-500">
                  Service
                </th>

                <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-500">
                  Amount
                </th>

                <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-500">
                  Status
                </th>

                <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-500">
                  Reference
                </th>

                <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-500">
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {transactions.map(
                (transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-t border-slate-100"
                  >
                    <td className="px-4 py-3 text-xs font-bold">
                      {transaction.phone ||
                        '-'}
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-xs font-bold">
                        {transaction.product ||
                          transaction.service ||
                          transaction.type ||
                          '-'}
                      </p>

                      {transaction.network && (
                        <p className="mt-1 text-[9px] text-slate-400">
                          {transaction.network}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3 text-xs font-black">
                      {money(
                        transaction.amount,
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusClass(
                          transaction.status,
                        )}`}
                      >
                        {transaction.status ||
                          '-'}
                      </span>
                    </td>

                    <td className="max-w-[180px] truncate px-4 py-3 text-[9px] text-slate-500">
                      {transaction.reference ||
                        '-'}
                    </td>

                    <td className="px-4 py-3 text-[9px] text-slate-500">
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
          <p className="py-10 text-center text-xs text-slate-500">
            No transactions found.
          </p>
        )}
      </Panel>
    </div>
  );

  const revenueView = (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          title="Gross Volume"
          value={money(revenue)}
          subtitle="Successful transactions"
          icon={BarChart3}
          onClick={() =>
            goTo('transactions')
          }
        />

        <Card
          title="Transactions"
          value={String(
            transactions.length,
          )}
          subtitle="Recorded transactions"
          icon={CreditCard}
          onClick={() =>
            goTo('transactions')
          }
        />

        <Card
          title="Customers"
          value={String(
            users.length,
          )}
          subtitle="Registered users"
          icon={Users}
          onClick={() =>
            goTo('users')
          }
        />

        <Card
          title="Wallet"
          value={money(totalWallet)}
          subtitle="Customer wallet balance"
          icon={Wallet}
          onClick={() =>
            goTo('wallet')
          }
        />
      </div>

      <Panel>
        <h2 className="text-sm font-black">
          Revenue Breakdown
        </h2>

        <div className="mt-4 space-y-3">
          {SERVICES.map(
            (service) => {
              const total =
                transactions
                  .filter(
                    (transaction) =>
                      String(
                        transaction.service ||
                          '',
                      ).toLowerCase() ===
                      service,
                  )
                  .reduce(
                    (sum, transaction) =>
                      sum +
                      Number(
                        transaction.amount ||
                          0,
                      ),
                    0,
                  );

              const percentage =
                revenue > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (total /
                          revenue) *
                          100,
                      ),
                    )
                  : 0;

              return (
                <div
                  key={service}
                  className="rounded-xl border border-slate-100 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black">
                      {SERVICE_LABEL[
                        service
                      ] ||
                        service}
                    </p>

                    <p className="text-xs font-black">
                      {money(total)}
                    </p>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="gy-gradient-bar h-full rounded-full"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-[9px] text-slate-400">
                    {percentage}% of successful volume
                  </p>
                </div>
              );
            },
          )}
        </div>
      </Panel>
    </div>
  );

  const fundingView = (
    <div className="space-y-4">
      <Panel>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black">
              Funding Requests
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Customer-initiated wallet funding requests.
            </p>
          </div>

          <Button
            kind="light"
            onClick={() =>
              void loadFundingRequests()
            }
          >
            <RefreshCw
              size={12}
            />
            Refresh
          </Button>
        </div>
      </Panel>

      <Panel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-500">
                  Customer
                </th>

                <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-500">
                  Amount
                </th>

                <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-500">
                  Reason
                </th>

                <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-500">
                  Status
                </th>

                <th className="px-4 py-3 text-right text-[9px] font-black uppercase text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {fundingRequests.map(
                (request) => {
                  const pending =
                    String(
                      request.status ||
                        '',
                    ).toLowerCase() ===
                    'pending';

                  return (
                    <tr
                      key={request.id}
                      className="border-t border-slate-100"
                    >
                      <td className="px-4 py-3">
                        <p className="text-xs font-black">
                          {request.phone ||
                            '-'}
                        </p>

                        <p className="mt-1 text-[9px] text-slate-400">
                          {formatDate(
                            request.created_at,
                          )}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-xs font-black">
                        {money(
                          request.amount,
                        )}
                      </td>

                      <td className="px-4 py-3 text-[10px] text-slate-500">
                        {request.reason ||
                          '-'}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusClass(
                            request.status,
                          )}`}
                        >
                          {request.status ||
                            '-'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {pending ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              kind="green"
                              onClick={() =>
                                void approveFunding(
                                  request.id,
                                  'approve',
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
                                void approveFunding(
                                  request.id,
                                  'reject',
                                )
                              }
                            >
                              <X
                                size={12}
                              />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <p className="text-right text-[9px] text-slate-400">
                            Completed
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>

        {!fundingRequests.length && (
          <p className="py-10 text-center text-xs text-slate-500">
            No funding requests found.
          </p>
        )}
      </Panel>
    </div>
  );

  const servicesView = (
    <div className="space-y-4">
      <Panel>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-black">
              Services & Products
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Manage service products and prices.
            </p>
          </div>

          <Button
            kind="blue"
            onClick={() => {
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
            }}
          >
            <Plus size={13} />
            New Product
          </Button>
        </div>
      </Panel>

      <Panel>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-500">
              Product Name
            </label>

            <Input
              value={productForm.name}
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
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-500">
              Service
            </label>

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
                    {SERVICE_LABEL[
                      service
                    ] ||
                      service}
                  </option>
                ),
              )}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-500">
              Network
            </label>

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
              placeholder="MTN, Airtel, Glo..."
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-500">
              Price (#)
            </label>

            <Input
              type="number"
              value={
                productForm.price
              }
              onChange={(value) =>
                setProductForm(
                  (current) => ({
                    ...current,
                    price: value,
                  }),
                )
              }
              placeholder="0"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-500">
              Category
            </label>

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
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-500">
              Cashback %
            </label>

            <Input
              type="number"
              value={
                productForm.cashback_percent
              }
              onChange={(value) =>
                setProductForm(
                  (current) => ({
                    ...current,
                    cashback_percent:
                      value,
                  }),
                )
              }
              placeholder="0"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-[10px] font-bold text-slate-500">
              Description
            </label>

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
              placeholder="Product description"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            kind="blue"
            disabled={loading}
            onClick={() =>
              void saveProduct()
            }
          >
            <Check size={13} />
            {selectedProduct
              ? 'Update Product'
              : 'Create Product'}
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

      <Panel className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-500">
                  Product
                </th>

                <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-500">
                  Service
                </th>

                <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-500">
                  Network
                </th>

                <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-500">
                  Price
                </th>

                <th className="px-4 py-3 text-[9px] font-black uppercase text-slate-500">
                  Cashback
                </th>

                <th className="px-4 py-3 text-right text-[9px] font-black uppercase text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {products.map(
                (product) => (
                  <tr
                    key={product.id}
                    className="border-t border-slate-100"
                  >
                    <td className="px-4 py-3">
                      <p className="text-xs font-black">
                        {product.name}
                      </p>

                      {product.description && (
                        <p className="mt-1 max-w-[220px] truncate text-[9px] text-slate-400">
                          {
                            product.description
                          }
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3 text-[10px] font-bold">
                      {SERVICE_LABEL[
                        product.service
                      ] ||
                        product.service}
                    </td>

                    <td className="px-4 py-3 text-[10px] text-slate-500">
                      {product.network ||
                        'All networks'}
                    </td>

                    <td className="px-4 py-3 text-xs font-black">
                      {money(
                        product.price,
                      )}
                    </td>

                    <td className="px-4 py-3 text-[10px] font-bold">
                      {product.cashback_percent ??
                        0}
                      %
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          kind="light"
                          onClick={() =>
                            editProduct(
                              product,
                            )
                          }
                        >
                          <Edit3
                            size={12}
                          />
                        </Button>

                        <Button
                          kind={
                            product.is_active
                              ? 'light'
                              : 'green'
                          }
                          onClick={() =>
                            void toggleProduct(
                              product,
                            )
                          }
                        >
                          {product.is_active
                            ? 'Disable'
                            : 'Enable'}
                        </Button>

                        <Button
                          kind="red"
                          onClick={() =>
                            void deleteProduct(
                              product.id,
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

        {!products.length && (
          <p className="py-10 text-center text-xs text-slate-500">
            No products found.
          </p>
        )}
      </Panel>
    </div>
  );

  const adminsView = (
    <div className="space-y-4">
      <Panel>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-purple-50 p-3 text-purple-700">
            <ShieldCheck
              size={20}
            />
          </div>

          <div>
            <h2 className="text-sm font-black">
              Administrators
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Accounts with administrative access.
            </p>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="space-y-2">
          {users
            .filter(
              (user) =>
                user.is_admin,
            )
            .map(
              (user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <div>
                    <p className="text-xs font-black">
                      {user.name ||
                        'Administrator'}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-500">
                      {user.phone}
                    </p>
                  </div>

                  <span className="rounded-full bg-purple-50 px-2 py-1 text-[9px] font-bold text-purple-700">
                    ADMIN
                  </span>
                </div>
              ),
            )}
        </div>

        {!users.some(
          (user) =>
            user.is_admin,
        ) && (
          <p className="py-8 text-center text-xs text-slate-500">
            No administrators found.
          </p>
        )}
      </Panel>
    </div>
  );

  const securityView = (
    <div className="space-y-4">
      <Panel>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
            <ShieldCheck
              size={20}
            />
          </div>

          <div>
            <h2 className="text-sm font-black">
              Security
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              Administrative security controls.
            </p>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-xs font-bold">
                Supabase Authentication
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Authentication is handled through Supabase.
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
              ACTIVE
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-xs font-bold">
                Admin Wallet Endpoint
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Used only for Super Admin wallet adjustments.
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-700">
              PROTECTED
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-xs font-bold">
                Customer Funding Approval
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Customer requests remain approval-based.
              </p>
            </div>

            <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-700">
              APPROVAL
            </span>
          </div>
        </div>
      </Panel>
    </div>
  );

  const notificationsView = (
    <div className="space-y-4">
      <Panel>
        <h2 className="text-sm font-black">
          Create Notification
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-500">
              Title
            </label>

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
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-500">
              Type
            </label>

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
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-[10px] font-bold text-slate-500">
              Message
            </label>

            <textarea
              value={
                notifyForm.message
              }
              onChange={(event) =>
                setNotifyForm(
                  (current) => ({
                    ...current,
                    message:
                      event.target
                        .value,
                  }),
                )
              }
              placeholder="Notification message"
              className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <Button
            kind="blue"
            onClick={() =>
              void updateNotification()
            }
          >
            <Bell size={13} />
            Publish Notification
          </Button>
        </div>
      </Panel>

      <Panel>
        <h2 className="text-sm font-black">
          Recent Notifications
        </h2>

        <div className="mt-4 space-y-2">
          {notifications
            .slice(0, 20)
            .map(
              (notification) => (
                <div
                  key={notification.id}
                  className="rounded-xl bg-slate-50 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black">
                      {
                        notification.title
                      }
                    </p>

                    <span
                      className={`rounded-full px-2 py-1 text-[8px] font-bold ${statusClass(
                        notification.type,
                      )}`}
                    >
                      {notification.type ||
                        'info'}
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] text-slate-500">
                    {
                      notification.message
                    }
                  </p>

                  <p className="mt-2 text-[9px] text-slate-400">
                    {formatDate(
                      notification.created_at,
                    )}
                  </p>
                </div>
              ),
            )}

          {!notifications.length && (
            <p className="py-6 text-center text-xs text-slate-500">
              No notifications found.
            </p>
          )}
        </div>
      </Panel>
    </div>
  );

  const settingsView = (
    <div className="space-y-4">
      <Panel>
        <h2 className="text-sm font-black">
          Platform Settings
        </h2>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-4">
          <div>
            <p className="text-xs font-bold">
              Maintenance Mode
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              Temporarily disable normal customer access.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setMaintenance(
                (value) => !value,
              )
            }
            className={`relative h-6 w-11 rounded-full transition ${
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
        <h2 className="text-sm font-black">
          Cashback Settings
        </h2>

        <div className="mt-4">
          <Input
            value={
              cashbackForm.default_percent ??
              ''
            }
            onChange={(value) =>
              setCashbackForm(
                (current: any) => ({
                  ...current,
                  default_percent:
                    value,
                }),
              )
            }
            placeholder="Default cashback percentage"
            type="number"
          />
        </div>

        <div className="mt-3">
          <Button
            kind="blue"
            onClick={() =>
              void saveSettingsCashback()
            }
          >
            <Check size={13} />
            Save Settings
          </Button>
        </div>
      </Panel>
    </div>
  );

  let content = overviewView;

  if (section === 'users') {
    content = usersView;
  }

  if (section === 'wallet') {
    content = walletView;
  }

  if (section === 'transactions') {
    content = transactionsView;
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

  if (section === 'notifications') {
    content = notificationsView;
  }

  if (section === 'settings') {
    content = settingsView;
  }

  const currentLabel =
    menuItems.find(
      (item) => item.id === section,
    )?.label || 'Overview';

  return (
    <div className="gy-super-admin min-h-screen bg-slate-50">
      <style>{superAdminStyles}</style>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#071a41] text-white transition-transform lg:translate-x-0 ${
          mobileMenu
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
      >
        <div className="absolute inset-x-0 top-0 h-1 gy-gradient-bar" />

        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-black">
                  GY Data
                </p>

                <p className="gy-colorful-title text-[9px] font-bold uppercase tracking-[0.2em]">
                  Super Admin
                </p>
              </div>

              <button
                type="button"
                className="lg:hidden"
                onClick={() =>
                  setMobileMenu(false)
                }
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            <div className="space-y-1">
              {menuItems.map(
                (item) => {
                  const Icon =
                    item.icon;

                  const active =
                    section ===
                    item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        goTo(
                          item.id,
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${
                        active
                          ? 'bg-white text-[#071a41] shadow-lg'
                          : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon
                        size={15}
                      />

                      <span>
                        {item.label}
                      </span>

                      {item.id ===
                        'funding' &&
                        pendingFunding.length >
                          0 && (
                          <span className="ml-auto rounded-full bg-amber-400 px-1.5 py-0.5 text-[8px] font-black text-amber-950">
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
          </nav>

          <div className="border-t border-white/10 p-3">
            <button
              type="button"
              onClick={() =>
                void logout()
              }
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-red-200 transition hover:bg-red-500/10 hover:text-red-100"
            >
              <LogOut
                size={15}
              />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {mobileMenu && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() =>
            setMobileMenu(false)
          }
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
          <div className="gy-gradient-bar h-0.5" />

          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-200 p-2 lg:hidden"
                onClick={() =>
                  setMobileMenu(true)
                }
              >
                <Menu
                  size={17}
                />
              </button>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Super Admin
                </p>

                <h1 className="text-sm font-black text-slate-900">
                  {currentLabel}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {loading && (
                <span className="hidden items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[9px] font-bold text-blue-700 sm:flex">
                  <RefreshCw
                    size={11}
                    className="animate-spin"
                  />
                  Updating
                </span>
              )}

              <button
                type="button"
                onClick={() =>
                  void loadAll()
                }
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw
                  size={15}
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
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-pink-500 ring-2 ring-white" />
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6">
          {notice && (
            <div className="fixed right-4 top-20 z-[100] max-w-sm rounded-xl border border-emerald-200 bg-white p-4 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-emerald-50 p-2 text-emerald-700">
                  <Check
                    size={14}
                  />
                </div>

                <div>
                  <p className="text-xs font-black text-slate-900">
                    GY Data
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    {notice}
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
                  Edit Customer
                </h2>

                <p className="mt-1 text-[10px] text-slate-500">
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
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-[10px] font-bold text-slate-500">
                  Name
                </label>

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
                  placeholder="Customer name"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold text-slate-500">
                  Email
                </label>

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
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="text-xs font-bold">
                    Active account
                  </p>

                  <p className="mt-1 text-[9px] text-slate-500">
                    Allow normal customer access.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setUserEditForm(
                      (current) => ({
                        ...current,
                        is_active:
                          !current.is_active,
                      }),
                    )
                  }
                  className={`relative h-6 w-11 rounded-full ${
                    userEditForm.is_active
                      ? 'bg-emerald-500'
                      : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                      userEditForm.is_active
                        ? 'left-6'
                        : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="text-xs font-bold">
                    Administrator
                  </p>

                  <p className="mt-1 text-[9px] text-slate-500">
                    Give this account admin privileges.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setUserEditForm(
                      (current) => ({
                        ...current,
                        is_admin:
                          !current.is_admin,
                      }),
                    )
                  }
                  className={`relative h-6 w-11 rounded-full ${
                    userEditForm.is_admin
                      ? 'bg-purple-600'
                      : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                      userEditForm.is_admin
                        ? 'left-6'
                        : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
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
                disabled={loading}
                onClick={() =>
                  void saveUser()
                }
              >
                <Check size={13} />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {cashback && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black">
                  Cashback
                </h2>

                <p className="mt-1 text-[10px] text-slate-500">
                  {cashback.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCashback(null)
                }
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5">
              <label className="mb-1 block text-[10px] font-bold text-slate-500">
                Cashback percentage
              </label>

              <Input
                type="number"
                value={
                  cashback.cashback_percent ??
                  0
                }
                onChange={(value) =>
                  setCashback(
                    (current) =>
                      current
                        ? {
                            ...current,
                            cashback_percent:
                              Number(
                                value,
                              ),
                          }
                        : current,
                  )
                }
                placeholder="0"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                kind="light"
                onClick={() =>
                  setCashback(null)
                }
              >
                Cancel
              </Button>

              <Button
                kind="blue"
                onClick={() =>
                  void saveCashback()
                }
              >
                <Check size={13} />
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
