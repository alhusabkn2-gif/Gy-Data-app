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
  `₦${Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

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
    className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
  >
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </p>
        <p className="mt-1 text-xl font-black text-slate-900">
          {value}
        </p>
        <p className="truncate text-[10px] text-slate-500">
          {subtitle}
        </p>
      </div>
      <span className="shrink-0 rounded-xl bg-blue-50 p-2.5 text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
        <Icon size={18} />
      </span>
    </div>
  </button>
);

const Panel = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
  >
    {children}
  </div>
);

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const [section, setSection] = useState<Section>('overview');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const [adjustmentType, setAdjustmentType] =
    useState<'fund' | 'refund'>('fund');
  const [adjustmentPhone, setAdjustmentPhone] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustingWallet, setAdjustingWallet] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [funding, setFunding] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [cashback, setCashback] = useState<any>(null);

  const [productService, setProductService] = useState('data');
  const [editing, setEditing] = useState<Product | null>(null);

  const [productForm, setProductForm] = useState({
    service: 'data',
    name: '',
    price: '0',
    network: '',
    description: '',
    category: '',
    cashback: '0',
  });

  const [notifyForm, setNotifyForm] = useState({
    title: '',
    message: '',
    type: 'info',
  });

  const [cashbackForm, setCashbackForm] = useState<any>({});
  const [maintenance, setMaintenance] = useState(false);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => {
      setNotice('');
    }, 2500);
  };

  const loadAll = async () => {
    setLoading(true);

    const [
      usersResult,
      transactionsResult,
      fundingResult,
      productsResult,
      notificationsResult,
      cashbackResult,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false }),

      supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500),

      supabase
        .from('funding_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),

      supabase
        .from('products')
        .select('*')
        .order('service')
        .order('name'),

      supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),

      supabase
        .from('cashback_settings')
        .select('*')
        .limit(1)
        .maybeSingle(),
    ]);

    if (usersResult.error) {
      console.error(usersResult.error);
      showNotice('Unable to load users');
    } else {
      setUsers(usersResult.data || []);
    }

    if (transactionsResult.error) {
      console.error(transactionsResult.error);
      showNotice('Unable to load transactions');
    } else {
      setTransactions(transactionsResult.data || []);
    }

    if (fundingResult.error) {
      console.error(fundingResult.error);
      showNotice('Unable to load funding requests');
    } else {
      setFunding(fundingResult.data || []);
    }

    if (productsResult.error) {
      console.error(productsResult.error);
      showNotice('Unable to load products');
    } else {
      setProducts((productsResult.data || []) as Product[]);
    }

    if (notificationsResult.error) {
      console.error(notificationsResult.error);
      showNotice('Unable to load notifications');
    } else {
      setNotifications(notificationsResult.data || []);
    }

    if (!cashbackResult.error && cashbackResult.data) {
      setCashback(cashbackResult.data);
      setCashbackForm(cashbackResult.data);
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const goTo = (next: Section) => {
    setSection(next);
    setMobileMenu(false);
    setSearch('');
  };

  const logout = () => {
    localStorage.removeItem('gydata_super_admin');
    localStorage.removeItem('gydata_super_admin_session');

    navigate('/super-admin-login', {
      replace: true,
    });
  };

  const activeUsers = users.filter(
    (user) => user.is_active !== false,
  );

  const totalWallet = users.reduce(
    (total, user) =>
      total + Number(user.wallet_balance || 0),
    0,
  );

  const successfulTransactions = transactions.filter(
    (transaction) =>
      ['success', 'successful', 'completed'].includes(
        String(transaction.status || '').toLowerCase(),
      ),
  );

  const revenue = successfulTransactions.reduce(
    (total, transaction) =>
      total + Number(transaction.amount || 0),
    0,
  );

  const pendingFunding = funding.filter(
    (request) => request.status === 'pending',
  );

  const activeProducts = products.filter(
    (product) => product.is_active,
  );

  const serviceCount = new Set(
    activeProducts.map((product) => product.service),
  ).size;

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) =>
      [
        user.full_name,
        user.phone,
        user.email,
        user.referral_code,
      ].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [users, search]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return transactions;
    }

    return transactions.filter((transaction) =>
      [
        transaction.phone,
        transaction.reference,
        transaction.service,
        transaction.product,
        transaction.status,
      ].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [transactions, search]);

  const saveProduct = async () => {
    const payload = {
      service: productForm.service,
      name: productForm.name.trim(),
      price: Number(productForm.price || 0),
      network: productForm.network || null,
      description: productForm.description || null,
      category: productForm.category || null,
      cashback_percent: Number(
        productForm.cashback || 0,
      ),
      is_active: true,
    };

    if (!payload.name) {
      showNotice('Product name is required');
      return;
    }

    setLoading(true);

    const query = editing
      ? supabase
          .from('products')
          .update(payload)
          .eq('id', editing.id)
      : supabase
          .from('products')
          .insert(payload);

    const { error } = await query;

    setLoading(false);

    if (error) {
      console.error(error);
      showNotice(error.message);
      return;
    }

    showNotice(
      editing
        ? 'Product updated'
        : 'Product created',
    );

    setEditing(null);

    setProductForm({
      service: productService,
      name: '',
      price: '0',
      network: '',
      description: '',
      category: '',
      cashback: '0',
    });

    await loadAll();
  };

  const toggleProduct = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({
        is_active: !product.is_active,
      })
      .eq('id', product.id);

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

    await loadAll();
  };

  const deleteProduct = async (product: Product) => {
    const confirmed = window.confirm(
      `Delete "${product.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);

    if (error) {
      console.error(error);
      showNotice(error.message);
      return;
    }

    showNotice('Product deleted');
    await loadAll();
  };

  const processFunding = async (
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
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestId,
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

  const saveCashback = async () => {
    if (!cashback?.id) {
      showNotice(
        'Cashback settings not found',
      );
      return;
    }

    const { error } = await supabase
      .from('cashback_settings')
      .update(cashbackForm)
      .eq('id', cashback.id);

    if (error) {
      console.error(error);
      showNotice(error.message);
      return;
    }

    showNotice(
      'Cashback settings updated',
    );

    await loadAll();
  };

  const menuItems: {
    id: Section;
    label: string;
    icon: any;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
    },
    {
      id: 'users',
      label: 'Customers',
      icon: Users,
    },
    {
      id: 'wallet',
      label: 'Wallet / Funding',
      icon: Wallet,
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: CreditCard,
    },
    {
      id: 'revenue',
      label: 'Revenue / Statistics',
      icon: DollarSign,
    },
    {
      id: 'funding',
      label: 'Funding Accounts',
      icon: Database,
    },
    {
      id: 'services',
      label: 'Services & Pricing',
      icon: Package,
    },
    {
      id: 'admins',
      label: 'Admin Management',
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

  const overviewView = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card
          title="Customers"
          value={String(users.length)}
          subtitle={`${activeUsers.length} active`}
          icon={Users}
          onClick={() => goTo('users')}
        />

        <Card
          title="Wallet Balance"
          value={money(totalWallet)}
          subtitle="Customer wallet total"
          icon={Wallet}
          onClick={() => goTo('wallet')}
        />

        <Card
          title="Revenue"
          value={money(revenue)}
          subtitle="Successful transaction volume"
          icon={DollarSign}
          onClick={() => goTo('revenue')}
        />

        <Card
          title="Pending Funding"
          value={String(
            pendingFunding.length,
          )}
          subtitle="Awaiting approval"
          icon={Database}
          onClick={() => goTo('funding')}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black">
                Recent Customers
              </h2>
              <p className="text-[10px] text-slate-500">
                Latest registered accounts
              </p>
            </div>

            <Button
              kind="light"
              onClick={() => goTo('users')}
            >
              View all
              <ChevronRight size={13} />
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {users
              .slice(0, 6)
              .map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                >
                  <div>
                    <p className="text-xs font-bold">
                      {user.full_name ||
                        'Customer'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {user.phone}
                    </p>
                  </div>

                  <span className="text-xs font-black">
                    {money(
                      user.wallet_balance,
                    )}
                  </span>
                </div>
              ))}

            {!users.length && (
              <p className="py-6 text-center text-xs text-slate-500">
                No customers found.
              </p>
            )}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black">
                Recent Transactions
              </h2>
              <p className="text-[10px] text-slate-500">
                Latest wallet activity
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
              .slice(0, 6)
              .map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                >
                  <div>
                    <p className="text-xs font-bold">
                      {transaction.service ||
                        transaction.product ||
                        'Transaction'}
                    </p>

                    <p className="text-[10px] text-slate-500">
                      {transaction.phone}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-black">
                      {money(
                        transaction.amount,
                      )}
                    </p>

                    <p className="text-[10px] text-slate-500">
                      {transaction.status}
                    </p>
                  </div>
                </div>
              ))}

            {!transactions.length && (
              <p className="py-6 text-center text-xs text-slate-500">
                No transactions found.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );

  const usersView = (
    <Panel>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-black">
            Customers
          </h2>

          <p className="text-[10px] text-slate-500">
            {users.length} registered customers
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search customer..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400">
              <th className="px-2 py-3">
                Customer
              </th>
              <th className="px-2 py-3">
                Phone
              </th>
              <th className="px-2 py-3">
                Wallet
              </th>
              <th className="px-2 py-3">
                Status
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
                  <td className="px-2 py-3 text-xs font-bold">
                    {user.full_name ||
                      'Customer'}
                  </td>

                  <td className="px-2 py-3 text-xs text-slate-500">
                    {user.phone}
                  </td>

                  <td className="px-2 py-3 text-xs font-black">
                    {money(
                      user.wallet_balance,
                    )}
                  </td>

                  <td className="px-2 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-[9px] font-bold ${
                        user.is_active === false
                          ? 'bg-red-50 text-red-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {user.is_active === false
                        ? 'Inactive'
                        : 'Active'}
                    </span>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {!filteredUsers.length && (
        <p className="py-8 text-center text-xs text-slate-500">
          No customers found.
        </p>
      )}
    </Panel>
  );

  const walletView = (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          title="Customer Wallets"
          value={money(totalWallet)}
          subtitle={`${users.length} registered users`}
          icon={Wallet}
          onClick={() => goTo('users')}
        />

        <Card
          title="Pending Funding"
          value={String(
            pendingFunding.length,
          )}
          subtitle="Requests awaiting approval"
          icon={Database}
          onClick={() => goTo('funding')}
        />

        <Card
          title="Funding Volume"
          value={money(
            funding.reduce(
              (total, item) =>
                total +
                Number(item.amount || 0),
              0,
            ),
          )}
          subtitle="All funding requests"
          icon={Wallet}
          onClick={() => goTo('funding')}
        />
      </div>

      <Panel className="border-blue-100 bg-gradient-to-br from-white to-blue-50/50">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-blue-700 p-2 text-white">
              <Wallet size={17} />
            </span>

            <div>
              <h2 className="text-sm font-black text-slate-900">
                Wallet Adjustment
              </h2>

              <p className="text-[10px] text-slate-500">
                Super Admin manual customer wallet control
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Customer Phone
            </label>

            <Input
              value={adjustmentPhone}
              onChange={setAdjustmentPhone}
              placeholder="08012345678"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Amount (₦)
            </label>

            <Input
              type="number"
              value={adjustmentAmount}
              onChange={setAdjustmentAmount}
              placeholder="1000"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Action
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
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Reason
            </label>

            <Input
              value={adjustmentReason}
              onChange={setAdjustmentReason}
              placeholder="Manual funding / refund"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            kind={
              adjustmentType === 'fund'
                ? 'green'
                : 'light'
            }
            disabled={adjustingWallet}
            onClick={() => {
              setAdjustmentType(
                'fund',
              );
              void adminAdjustWallet();
            }}
          >
            <Plus size={14} />

            {adjustingWallet &&
            adjustmentType === 'fund'
              ? 'Processing...'
              : 'Fund Wallet'}
          </Button>

          <Button
            kind={
              adjustmentType ===
              'refund'
                ? 'red'
                : 'light'
            }
            disabled={adjustingWallet}
            onClick={() => {
              setAdjustmentType(
                'refund',
              );
              void adminAdjustWallet();
            }}
          >
            <RefreshCw size={14} />

            {adjustingWallet &&
            adjustmentType ===
              'refund'
              ? 'Processing...'
              : 'Refund Wallet'}
          </Button>
        </div>

        <p className="mt-3 text-[10px] text-slate-400">
          Fund adds money to the customer's
          wallet. Refund removes money from the
          wallet and cannot make the balance
          negative.
        </p>
      </Panel>
    </div>
  );

  const transactionsView = (
    <Panel>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-black">
            Transactions
          </h2>

          <p className="text-[10px] text-slate-500">
            {transactions.length} records
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search transactions..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filteredTransactions
          .slice(0, 100)
          .map((transaction) => (
            <div
              key={transaction.id}
              className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-xs font-black">
                  {transaction.product ||
                    transaction.service ||
                    'Transaction'}
                </p>

                <p className="text-[10px] text-slate-500">
                  {transaction.phone}
                </p>

                <p className="text-[10px] text-slate-400">
                  {transaction.reference ||
                    'No reference'}
                </p>
              </div>

              <div className="text-left md:text-right">
                <p className="text-xs font-black">
                  {money(
                    transaction.amount,
                  )}
                </p>

                <span
                  className={`text-[10px] font-bold ${
                    ['success',
                      'successful',
                      'completed'].includes(
                      String(
                        transaction.status ||
                          '',
                      ).toLowerCase(),
                    )
                      ? 'text-emerald-600'
                      : 'text-slate-500'
                  }`}
                >
                  {transaction.status}
                </span>
              </div>
            </div>
          ))}
      </div>

      {!filteredTransactions.length && (
        <p className="py-8 text-center text-xs text-slate-500">
          No transactions found.
        </p>
      )}
    </Panel>
  );

  const revenueView = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card
          title="Gross Volume"
          value={money(revenue)}
          subtitle="Successful transactions"
          icon={DollarSign}
          onClick={() =>
            goTo('transactions')
          }
        />

        <Card
          title="Successful"
          value={String(
            successfulTransactions.length,
          )}
          subtitle="Completed transactions"
          icon={Check}
          onClick={() =>
            goTo('transactions')
          }
        />

        <Card
          title="Pending"
          value={String(
            transactions.filter(
              (item) =>
                item.status ===
                'pending',
            ).length,
          )}
          subtitle="Pending transactions"
          icon={Activity}
          onClick={() =>
            goTo('transactions')
          }
        />

        <Card
          title="Failed"
          value={String(
            transactions.filter(
              (item) =>
                ['failed', 'error'].includes(
                  String(
                    item.status ||
                      '',
                  ).toLowerCase(),
                ),
            ).length,
          )}
          subtitle="Failed transactions"
          icon={Zap}
          onClick={() =>
            goTo('transactions')
          }
        />
      </div>

      <Panel>
        <h2 className="text-sm font-black">
          Service Volume
        </h2>

        <div className="mt-4 space-y-3">
          {SERVICES.map(
            (service) => {
              const rows =
                successfulTransactions.filter(
                  (transaction) =>
                    String(
                      transaction.service ||
                        '',
                    ).toLowerCase() ===
                    service,
                );

              const amount =
                rows.reduce(
                  (
                    total,
                    transaction,
                  ) =>
                    total +
                    Number(
                      transaction.amount ||
                        0,
                    ),
                  0,
                );

              const percentage =
                successfulTransactions.length >
                0
                  ? Math.min(
                      100,
                      (rows.length /
                        successfulTransactions.length) *
                        100,
                    )
                  : 0;

              return (
                <div
                  key={service}
                  className="flex items-center gap-3"
                >
                  <span className="w-24 text-xs font-bold">
                    {
                      SERVICE_LABEL[
                        service
                      ]
                    }
                  </span>

                  <div className="h-2 flex-1 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-blue-700"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <span className="w-24 text-right text-xs font-bold">
                    {money(amount)}
                  </span>
                </div>
              );
            },
          )}
        </div>
      </Panel>
    </div>
  );

  const fundingView = (
    <Panel>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black">
            Funding Requests
          </h2>

          <p className="text-[10px] text-slate-500">
            {pendingFunding.length} pending requests
          </p>
        </div>

        <Button
          kind="light"
          onClick={() =>
            void loadAll()
          }
        >
          <RefreshCw size={13} />
          Refresh
        </Button>
      </div>

      <div className="space-y-2">
        {pendingFunding.map(
          (request) => (
            <div
              key={request.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 md:flex-row md:items-center"
            >
              <div className="flex-1">
                <p className="text-xs font-black">
                  {request.phone} •{' '}
                  {money(
                    request.amount,
                  )}
                </p>

                <p className="text-[10px] text-slate-500">
                  {request.payment_method ||
                    'manual'}{' '}
                  •{' '}
                  {request.payment_reference ||
                    'No reference'}
                </p>

                <p className="text-[10px] text-slate-400">
                  {request.created_at
                    ? new Date(
                        request.created_at,
                      ).toLocaleString(
                        'en-NG',
                      )
                    : ''}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  kind="green"
                  disabled={loading}
                  onClick={() =>
                    void processFunding(
                      request.id,
                      'approve',
                    )
                  }
                >
                  <Check size={13} />
                  Approve
                </Button>

                <Button
                  kind="red"
                  disabled={loading}
                  onClick={() =>
                    void processFunding(
                      request.id,
                      'reject',
                    )
                  }
                >
                  <X size={13} />
                  Reject
                </Button>
              </div>
            </div>
          ),
        )}
      </div>

      {!pendingFunding.length && (
        <p className="py-8 text-center text-xs text-slate-500">
          No pending funding requests.
        </p>
      )}
    </Panel>
  );

  const servicesView = (
    <div className="space-y-4">
      <Panel>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-black">
              Services & Pricing
            </h2>

            <p className="text-[10px] text-slate-500">
              Manage products and customer prices.
            </p>
          </div>

          <div className="flex gap-2">
            <Select
              value={productService}
              onChange={(value) => {
                setProductService(value);

                setProductForm(
                  (current) => ({
                    ...current,
                    service: value,
                  }),
                );
              }}
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

            <Button
              kind="blue"
              onClick={() => {
                setEditing(null);
                setProductForm({
                  service:
                    productService,
                  name: '',
                  price: '0',
                  network: '',
                  description: '',
                  category: '',
                  cashback: '0',
                });
              }}
            >
              <Plus size={13} />
              New
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-500">
              Product name
            </label>

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
              placeholder="1GB Data"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold text-slate-500">
              Price (₦)
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
              placeholder="500"
            />
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
              placeholder="MTN"
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
              placeholder="Data"
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
                    description: value,
                  }),
                )
              }
              placeholder="Product description"
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            kind="blue"
            disabled={loading}
            onClick={() =>
              void saveProduct()
            }
          >
            <Check size={13} />
            Save Product
          </Button>

          {editing && (
            <Button
              kind="light"
              onClick={() => {
                setEditing(null);

                setProductForm({
                  service:
                    productService,
                  name: '',
                  price: '0',
                  network: '',
                  description: '',
                  category: '',
                  cashback: '0',
                });
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </Panel>

      <Panel>
        <div className="space-y-2">
          {products
            .filter(
              (product) =>
                product.service ===
                productService,
            )
            .map((product) => (
              <div
                key={product.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 md:flex-row md:items-center"
              >
                <div className="flex-1">
                  <p className="text-xs font-black">
                    {product.name}
                  </p>

                  <p className="text-[10px] text-slate-500">
                    {product.network ||
                      'All networks'}{' '}
                    •{' '}
                    {money(
                      product.price,
                    )}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    kind="light"
                    onClick={() => {
                      setEditing(
                        product,
                      );

                      setProductService(
                        product.service,
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
                        cashback:
                          String(
                            product.cashback_percent ||
                              0,
                          ),
                      });
                    }}
                  >
                    <Edit3 size={13} />
                    Edit
                  </Button>

                  <Button
                    kind={
                      product.is_active
                        ? 'red'
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
                        product,
                      )
                    }
                  >
                    <Trash2 size={13} />
                    Delete
                  </Button>
                </div>
              </div>
            ))}

          {!products.filter(
            (product) =>
              product.service ===
              productService,
          ).length && (
            <p className="py-8 text-center text-xs text-slate-500">
              No products found.
            </p>
          )}
        </div>
      </Panel>
    </div>
  );

  const adminsView = (
    <Panel>
      <h2 className="text-sm font-black">
        Admin Management
      </h2>

      <p className="mt-1 text-[10px] text-slate-500">
        Administrators are profiles with{' '}
        <b>is_admin</b> enabled.
      </p>

      <div className="mt-4 space-y-2">
        {users
          .filter(
            (user) => user.is_admin,
          )
          .map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
            >
              <div>
                <p className="text-xs font-bold">
                  {user.full_name}
                </p>

                <p className="text-[10px] text-slate-500">
                  {user.phone}
                </p>
              </div>

              <ShieldCheck
                size={17}
                className="text-blue-700"
              />
            </div>
          ))}

        {!users.some(
          (user) => user.is_admin,
        ) && (
          <p className="py-6 text-center text-xs text-slate-500">
            No admin profiles found.
          </p>
        )}
      </div>
    </Panel>
  );

  const securityView = (
    <Panel>
      <div className="flex items-center gap-2">
        <ShieldCheck
          size={18}
          className="text-blue-700"
        />

        <div>
          <h2 className="text-sm font-black">
            Security
          </h2>

          <p className="text-[10px] text-slate-500">
            Super Admin control and platform status.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Admin accounts
          </p>

          <p className="mt-1 text-xl font-black">
            {
              users.filter(
                (user) =>
                  user.is_admin,
              ).length
            }
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Active customers
          </p>

          <p className="mt-1 text-xl font-black">
            {activeUsers.length}
          </p>
        </div>
      </div>
    </Panel>
  );

  const notificationsView = (
    <div className="space-y-4">
      <Panel>
        <h2 className="text-sm font-black">
          Create Notification
        </h2>

        <div className="mt-4 space-y-3">
          <Input
            value={notifyForm.title}
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
            value={notifyForm.type}
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
        <h2 className="text-sm font-black">
          Recent Notifications
        </h2>

        <div className="mt-4 space-y-2">
          {notifications
            .slice(0, 20)
            .map((notification) => (
              <div
                key={notification.id}
                className="rounded-xl bg-slate-50 p-3"
              >
                <p className="text-xs font-black">
                  {notification.title}
                </p>

                <p className="mt-1 text-[10px] text-slate-500">
                  {notification.message}
                </p>
              </div>
            ))}

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

            <p className="text-[10px] text-slate-500">
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
              void saveCashback()
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
    <div className="min-h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#071a41] text-white transition-transform lg:translate-x-0 ${
          mobileMenu
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-black">
                  GY Data
                </p>

                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-200">
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
                        goTo(item.id)
                      }
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${
                        active
                          ? 'bg-white text-[#071a41]'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon
                        size={16}
                      />

                      <span>
                        {item.label}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </nav>

          <div className="border-t border-white/10 p-3">
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {mobileMenu && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() =>
            setMobileMenu(false)
          }
        />
      )}

      <main className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setMobileMenu(
                    true,
                  )
                }
                className="rounded-lg bg-slate-100 p-2 lg:hidden"
              >
                <Menu size={18} />
              </button>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Super Admin
                </p>

                <h1 className="text-base font-black text-slate-900">
                  {currentLabel}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {loading && (
                <RefreshCw
                  size={15}
                  className="animate-spin text-blue-700"
                />
              )}

              <button
                type="button"
                onClick={() =>
                  void loadAll()
                }
                className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {notice && (
            <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-800">
              {notice}
            </div>
          )}

          {content}
        </div>
      </main>
    </div>
  );
}
