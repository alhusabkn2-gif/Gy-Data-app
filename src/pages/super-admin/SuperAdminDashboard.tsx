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

  const showNotice = (text: string) => {
    setNotice(text);

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
    (total, user) => total + Number(user.wallet_balance || 0),
    0,
  );

  const successfulTransactions = transactions.filter((transaction) =>
    ['success', 'successful', 'completed'].includes(
      String(transaction.status || '').toLowerCase(),
    ),
  );

  const revenue = successfulTransactions.reduce(
    (total, transaction) => total + Number(transaction.amount || 0),
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
        String(value || '').toLowerCase().includes(query),
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
        transaction.network,
      ].some((value) =>
        String(value || '').toLowerCase().includes(query),
      ),
    );
  }, [transactions, search]);

  const saveProduct = async () => {
    const payload = {
      service: productForm.service,
      name: productForm.name.trim(),
      price: Number(productForm.price) || 0,
      network: productForm.network.trim() || null,
      description: productForm.description.trim() || null,
      category: productForm.category.trim() || null,
      cashback_percent: Number(productForm.cashback) || 0,
    };

    if (!payload.name) {
      showNotice('Product name is required');
      return;
    }

    const result = editing
      ? await supabase
          .from('products')
          .update(payload)
          .eq('id', editing.id)
          .select()
          .single()
      : await supabase
          .from('products')
          .insert(payload)
          .select()
          .single();

    if (result.error) {
      console.error(result.error);
      showNotice(result.error.message);
      return;
    }

    showNotice(
      editing
        ? 'Product updated successfully'
        : 'Product added successfully',
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

  const editProduct = (product: Product) => {
    setEditing(product);
    setProductService(product.service);

    setProductForm({
      service: product.service,
      name: product.name,
      price: String(product.price ?? 0),
      network: product.network || '',
      description: product.description || '',
      category: product.category || '',
      cashback: String(product.cashback_percent ?? 0),
    });
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
        product.is_active ? 'disabled' : 'enabled'
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

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Funding action failed',
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
        error?.message || 'Funding action failed',
      );
    } finally {
      setLoading(false);
    }
  };

  const saveCashback = async () => {
    if (!cashback?.id) {
      showNotice('Cashback settings not found');
      return;
    }

    const fields = { ...cashbackForm };

    delete fields.id;
    delete fields.updated_at;

    const { error } = await supabase
      .from('cashback_settings')
      .update(fields)
      .eq('id', cashback.id);

    if (error) {
      console.error(error);
      showNotice(error.message);
      return;
    }

    showNotice('Cashback settings saved');
    await loadAll();
  };

  const broadcastNotification = async () => {
    if (
      !notifyForm.title.trim() ||
      !notifyForm.message.trim()
    ) {
      showNotice('Title and message are required');
      return;
    }

    if (!users.length) {
      showNotice('No users found');
      return;
    }

    const rows = users.map((user) => ({
      phone: user.phone,
      title: notifyForm.title.trim(),
      message: notifyForm.message.trim(),
      type: notifyForm.type,
      is_read: false,
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(rows);

    if (error) {
      console.error(error);
      showNotice(error.message);
      return;
    }

    showNotice(
      `Notification sent to ${users.length} users`,
    );

    setNotifyForm({
      title: '',
      message: '',
      type: 'info',
    });

    await loadAll();
  };

  const navItems: {
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
      label: 'Users Management',
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
      label: 'Security / Logs',
      icon: Activity,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: Settings,
    },
  ];

  const overviewView = (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Card
          title="Users"
          value={String(users.length)}
          subtitle={`${activeUsers.length} active accounts`}
          icon={Users}
          onClick={() => goTo('users')}
        />

        <Card
          title="Wallet"
          value={money(totalWallet)}
          subtitle="Customer wallet balances"
          icon={Wallet}
          onClick={() => goTo('wallet')}
        />

        <Card
          title="Transactions"
          value={String(transactions.length)}
          subtitle={`${successfulTransactions.length} successful`}
          icon={CreditCard}
          onClick={() => goTo('transactions')}
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
          value={String(pendingFunding.length)}
          subtitle="Awaiting approval"
          icon={Database}
          onClick={() => goTo('funding')}
        />
      </div>

      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Services Control Center
            </h2>

            <p className="mt-1 text-[10px] text-slate-500">
              {serviceCount}/{SERVICES.length} services currently have active products.
            </p>
          </div>

          <Button onClick={() => goTo('services')}>
            <Package size={14} />
            Manage Services
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {SERVICES.map((service) => {
            const count = products.filter(
              (product) => product.service === service,
            ).length;

            const active = products.some(
              (product) =>
                product.service === service &&
                product.is_active,
            );

            return (
              <button
                key={service}
                type="button"
                onClick={() => {
                  setProductService(service);
                  goTo('services');
                }}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">
                    {SERVICE_LABEL[service]}
                  </span>

                  <span
                    className={`h-2 w-2 rounded-full ${
                      active
                        ? 'bg-emerald-500'
                        : 'bg-red-400'
                    }`}
                  />
                </div>

                <p className="mt-1 text-[10px] text-slate-500">
                  {count} products
                </p>
              </button>
            );
          })}
        </div>
      </Panel>
    </div>
  );

  const usersView = (
    <Panel>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-black">
            Users Management
          </h2>

          <p className="text-[10px] text-slate-500">
            {users.length} registered accounts
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />

          <Input
            value={search}
            onChange={setSearch}
            placeholder="Search name, phone or email"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead>
            <tr className="border-b text-[10px] uppercase text-slate-400">
              <th className="p-2">User</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Wallet</th>
              <th className="p-2">KYC</th>
              <th className="p-2">Admin</th>
              <th className="p-2">Created</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b last:border-0"
              >
                <td className="p-2 font-bold">
                  {user.full_name || '—'}

                  <div className="text-[10px] font-normal text-slate-400">
                    {user.email || 'No email'}
                  </div>
                </td>

                <td className="p-2">
                  {user.phone}
                </td>

                <td className="p-2 font-bold">
                  {money(user.wallet_balance)}
                </td>

                <td className="p-2">
                  {user.kyc_status || 'unverified'}
                </td>

                <td className="p-2">
                  {user.is_admin ? (
                    <span className="font-bold text-blue-700">
                      Admin
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      User
                    </span>
                  )}
                </td>

                <td className="p-2 text-slate-500">
                  {user.created_at
                    ? new Date(
                        user.created_at,
                      ).toLocaleDateString('en-NG')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!filteredUsers.length && (
        <p className="py-8 text-center text-xs text-slate-500">
          No users found.
        </p>
      )}
    </Panel>
  );

  const transactionsView = (
    <Panel>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-black">
            Transactions
          </h2>

          <p className="text-[10px] text-slate-500">
            {transactions.length} transaction records
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />

          <Input
            value={search}
            onChange={setSearch}
            placeholder="Reference, phone, service..."
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead>
            <tr className="border-b text-[10px] uppercase text-slate-400">
              <th className="p-2">Reference</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Service</th>
              <th className="p-2">Product</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Status</th>
              <th className="p-2">Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="border-b last:border-0"
              >
                <td className="p-2 font-bold">
                  {transaction.reference}
                </td>

                <td className="p-2">
                  {transaction.phone}
                </td>

                <td className="p-2">
                  {transaction.service}
                </td>

                <td className="p-2">
                  {transaction.product || '—'}
                </td>

                <td className="p-2 font-black">
                  {money(transaction.amount)}
                </td>

                <td className="p-2">
                  {transaction.status}
                </td>

                <td className="p-2 text-slate-500">
                  {transaction.created_at
                    ? new Date(
                        transaction.created_at,
                      ).toLocaleString('en-NG')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!filteredTransactions.length && (
        <p className="py-8 text-center text-xs text-slate-500">
          No transactions found.
        </p>
      )}
    </Panel>
  );

  const servicesView = (
    <div className="space-y-4">
      <Panel>
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-[10px] font-bold text-slate-500">
                Service
              </label>

              <Select
                value={productService}
                onChange={(value) => {
                  setProductService(value);

                  setEditing(null);

                  setProductForm({
                    ...productForm,
                    service: value,
                  });
                }}
              >
                {SERVICES.map((service) => (
                  <option
                    key={service}
                    value={service}
                  >
                    {SERVICE_LABEL[service]}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold text-slate-500">
                Product Name
              </label>

              <Input
                value={productForm.name}
                onChange={(value) =>
                  setProductForm({
                    ...productForm,
                    name: value,
                  })
                }
                placeholder="e.g. MTN 1GB"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold text-slate-500">
                Selling Price
              </label>

              <Input
                type="number"
                value={productForm.price}
                onChange={(value) =>
                  setProductForm({
                    ...productForm,
                    price: value,
                  })
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold text-slate-500">
                Network / Provider
              </label>

              <Input
                value={productForm.network}
                onChange={(value) =>
                  setProductForm({
                    ...productForm,
                    network: value,
                  })
                }
                placeholder="MTN"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={() => void saveProduct()}>
                {editing ? (
                  <Check size={14} />
                ) : (
                  <Plus size={14} />
                )}

                {editing
                  ? 'Save Changes'
                  : 'Add Product'}
              </Button>

              {editing && (
                <Button
                  kind="light"
                  onClick={() => {
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
                  }}
                >
                  <X size={14} />
                  Cancel
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-[10px] font-bold text-slate-500">
                Description
              </label>

              <Input
                value={productForm.description}
                onChange={(value) =>
                  setProductForm({
                    ...productForm,
                    description: value,
                  })
                }
                placeholder="Product description"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold text-slate-500">
                Category
              </label>

              <Input
                value={productForm.category}
                onChange={(value) =>
                  setProductForm({
                    ...productForm,
                    category: value,
                  })
                }
                placeholder="SME / Corporate / Gifting"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold text-slate-500">
                Product Cashback %
              </label>

              <Input
                type="number"
                value={productForm.cashback}
                onChange={(value) =>
                  setProductForm({
                    ...productForm,
                    cashback: value,
                  })
                }
              />
            </div>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-black">
              {SERVICE_LABEL[productService]} Products
            </h2>

            <p className="text-[10px] text-slate-500">
              {
                products.filter(
                  (product) =>
                    product.service === productService,
                ).length
              }{' '}
              products
            </p>
          </div>

          <Button
            kind="light"
            onClick={() => void loadAll()}
          >
            <RefreshCw size={13} />
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead>
              <tr className="border-b text-[10px] uppercase text-slate-400">
                <th className="p-2">Product</th>
                <th className="p-2">Network</th>
                <th className="p-2">Category</th>
                <th className="p-2">Price</th>
                <th className="p-2">Cashback</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {products
                .filter(
                  (product) =>
                    product.service === productService,
                )
                .map((product) => (
                  <tr
                    key={product.id}
                    className="border-b last:border-0"
                  >
                    <td className="p-2 font-bold">
                      {product.name}

                      <div className="text-[10px] font-normal text-slate-400">
                        {product.description || ''}
                      </div>
                    </td>

                    <td className="p-2">
                      {product.network || '—'}
                    </td>

                    <td className="p-2">
                      {product.category || '—'}
                    </td>

                    <td className="p-2 font-black">
                      {money(product.price)}
                    </td>

                    <td className="p-2">
                      {Number(
                        product.cashback_percent || 0,
                      )}
                      %
                    </td>

                    <td className="p-2">
                      {product.is_active ? (
                        <span className="font-bold text-emerald-600">
                          Active
                        </span>
                      ) : (
                        <span className="font-bold text-red-600">
                          Disabled
                        </span>
                      )}
                    </td>

                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button
                          kind="light"
                          onClick={() =>
                            editProduct(product)
                          }
                        >
                          <Edit3 size={13} />
                        </Button>

                        <Button
                          kind={
                            product.is_active
                              ? 'red'
                              : 'green'
                          }
                          onClick={() =>
                            void toggleProduct(product)
                          }
                        >
                          {product.is_active ? (
                            <X size={13} />
                          ) : (
                            <Check size={13} />
                          )}
                        </Button>

                        <Button
                          kind="red"
                          onClick={() =>
                            void deleteProduct(product)
                          }
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!products.some(
          (product) =>
            product.service === productService,
        ) && (
          <p className="py-8 text-center text-xs text-slate-500">
            No products found for this service.
          </p>
        )}
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
          onClick={() => void loadAll()}
        >
          <RefreshCw size={13} />
          Refresh
        </Button>
      </div>

      <div className="space-y-2">
        {pendingFunding.map((request) => (
          <div
            key={request.id}
            className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 md:flex-row md:items-center"
          >
            <div className="flex-1">
              <p className="text-xs font-black">
                {request.phone} •{' '}
                {money(request.amount)}
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
                    ).toLocaleString('en-NG')
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
        ))}
      </div>

      {!pendingFunding.length && (
        <p className="py-8 text-center text-xs text-slate-500">
          No pending funding requests.
        </p>
      )}
    </Panel>
  );

  const walletView = (
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
        value={String(pendingFunding.length)}
        subtitle="Requests awaiting approval"
        icon={Database}
        onClick={() => goTo('funding')}
      />

      <Card
        title="Funding Volume"
        value={money(
          funding.reduce(
            (total, item) =>
              total + Number(item.amount || 0),
            0,
          ),
        )}
        subtitle="All funding requests"
        icon={DollarSign}
        onClick={() => goTo('funding')}
      />
    </div>
  );

  const revenueView = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card
          title="Gross Volume"
          value={money(revenue)}
          subtitle="Successful transactions"
          icon={DollarSign}
          onClick={() => goTo('transactions')}
        />

        <Card
          title="Successful"
          value={String(
            successfulTransactions.length,
          )}
          subtitle="Completed transactions"
          icon={Check}
          onClick={() => goTo('transactions')}
        />

        <Card
          title="Pending"
          value={String(
            transactions.filter(
              (item) => item.status === 'pending',
            ).length,
          )}
          subtitle="Pending transactions"
          icon={Activity}
          onClick={() => goTo('transactions')}
        />

        <Card
          title="Failed"
          value={String(
            transactions.filter((item) =>
              ['failed', 'error'].includes(
                String(
                  item.status || '',
                ).toLowerCase(),
              ),
            ).length,
          )}
          subtitle="Failed transactions"
          icon={Zap}
          onClick={() => goTo('transactions')}
        />
      </div>

      <Panel>
        <h2 className="text-sm font-black">
          Service Volume
        </h2>

        <div className="mt-4 space-y-3">
          {SERVICES.map((service) => {
            const rows =
              successfulTransactions.filter(
                (transaction) =>
                  String(
                    transaction.service || '',
                  ).toLowerCase() === service,
              );

            const amount = rows.reduce(
              (total, transaction) =>
                total +
                Number(transaction.amount || 0),
              0,
            );

            const percentage =
              successfulTransactions.length > 0
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
                  {SERVICE_LABEL[service]}
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
          })}
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
          .filter((user) => user.is_admin)
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black">
            Security / Activity
          </h2>

          <p className="text-[10px] text-slate-500">
            Latest platform activity.
          </p>
        </div>

        <Button
          kind="light"
          onClick={() => void loadAll()}
        >
          <RefreshCw size={13} />
          Refresh
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {transactions
          .slice(0, 30)
          .map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
            >
              <Activity
                size={14}
                className="text-blue-700"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">
                  {transaction.phone} •{' '}
                  {transaction.service}
                </p>

                <p className="text-[10px] text-slate-500">
                  {transaction.reference} •{' '}
                  {transaction.status}
                </p>
              </div>

              <span className="text-xs font-bold">
                {money(transaction.amount)}
              </span>
            </div>
          ))}
      </div>

      {!transactions.length && (
        <p className="py-8 text-center text-xs text-slate-500">
          No activity records.
        </p>
      )}
    </Panel>
  );

  const cashbackView = (
    <Panel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-black">
            Cashback Settings
          </h2>

          <p className="text-[10px] text-slate-500">
            Configure service-level cashback.
          </p>
        </div>

        <Button
          onClick={() => void saveCashback()}
        >
          <Check size={13} />
          Save Settings
        </Button>
      </div>

      {cashback && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            'is_enabled',
            'allow_transfer_to_wallet',
            'data_percent',
            'airtime_percent',
            'electricity_percent',
            'cable_percent',
            'betting_percent',
            'waec_percent',
            'jamb_percent',
            'smile_percent',
            'internet_percent',
          ].map((key) => (
            <div
              key={key}
              className="rounded-xl bg-slate-50 p-3"
            >
              <label className="text-[10px] font-bold capitalize text-slate-500">
                {key.replaceAll('_', ' ')}
              </label>

              {key === 'is_enabled' ||
              key ===
                'allow_transfer_to_wallet' ? (
                <input
                  type="checkbox"
                  checked={Boolean(
                    cashbackForm[key],
                  )}
                  onChange={(event) =>
                    setCashbackForm({
                      ...cashbackForm,
                      [key]:
                        event.target.checked,
                    })
                  }
                  className="mt-2 h-4 w-4 accent-blue-700"
                />
              ) : (
                <div className="mt-1">
                  <Input
                    type="number"
                    value={cashbackForm[key]}
                    onChange={(value) =>
                      setCashbackForm({
                        ...cashbackForm,
                        [key]: Number(value),
                      })
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!cashback && (
        <p className="py-8 text-center text-xs text-slate-500">
          Cashback settings are not available.
        </p>
      )}
    </Panel>
  );

  const notificationsView = (
    <div className="space-y-4">
      <Panel>
        <h2 className="text-sm font-black">
          Broadcast Notification
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Input
            value={notifyForm.title}
            onChange={(value) =>
              setNotifyForm({
                ...notifyForm,
                title: value,
              })
            }
            placeholder="Notification title"
          />

          <Input
            value={notifyForm.message}
            onChange={(value) =>
              setNotifyForm({
                ...notifyForm,
                message: value,
              })
            }
            placeholder="Notification message"
          />

          <Select
            value={notifyForm.type}
            onChange={(value) =>
              setNotifyForm({
                ...notifyForm,
                type: value,
              })
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

        <div className="mt-3">
          <Button
            onClick={() =>
              void broadcastNotification()
            }
          >
            <Bell size={13} />
            Send To All Users
          </Button>
        </div>
      </Panel>

      <Panel>
        <h2 className="text-sm font-black">
          Recent Notifications
        </h2>

        <div className="mt-4 space-y-2">
          {notifications
            .slice(0, 30)
            .map((notification) => (
              <div
                key={notification.id}
                className="rounded-xl bg-slate-50 p-3"
              >
                <p className="text-xs font-bold">
                  {notification.title}
                </p>

                <p className="text-[10px] text-slate-500">
                  {notification.phone} •{' '}
                  {notification.message}
                </p>
              </div>
            ))}
        </div>

        {!notifications.length && (
          <p className="py-8 text-center text-xs text-slate-500">
            No notifications.
          </p>
        )}
      </Panel>
    </div>
  );

  const settingsView = (
    <div className="space-y-4">
      {cashbackView}

      <Panel>
        <h2 className="text-sm font-black">
          System Settings
        </h2>

        <label className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3">
          <div>
            <p className="text-xs font-bold">
              Maintenance Mode
            </p>

            <p className="text-[10px] text-slate-500">
              Local dashboard preference. It does not alter
              backend access or purchase flow.
            </p>
          </div>

          <input
            type="checkbox"
            checked={maintenance}
            onChange={(event) =>
              setMaintenance(
                event.target.checked,
              )
            }
            className="h-4 w-4 accent-blue-700"
          />
        </label>
      </Panel>
    </div>
  );

  const renderContent = () => {
    switch (section) {
      case 'overview':
        return overviewView;

      case 'users':
        return usersView;

      case 'wallet':
        return walletView;

      case 'transactions':
        return transactionsView;

      case 'revenue':
        return revenueView;

      case 'funding':
        return fundingView;

      case 'services':
        return servicesView;

      case 'admins':
        return adminsView;

      case 'security':
        return securityView;

      case 'notifications':
        return notificationsView;

      case 'settings':
        return settingsView;

      default:
        return overviewView;
    }
  };

  const currentNav = navItems.find(
    (item) => item.id === section,
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {mobileMenu && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileMenu(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[250px] bg-[#06183d] text-white transition-transform lg:translate-x-0 ${
          mobileMenu
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-white/10 p-4">
            <div className="rounded-xl bg-blue-600 p-2">
              <ShieldCheck size={19} />
            </div>

            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-blue-300">
                GY DATA
              </p>

              <p className="truncate text-sm font-black">
                Super Admin
              </p>
            </div>

            <button
              type="button"
              className="ml-auto lg:hidden"
              onClick={() =>
                setMobileMenu(false)
              }
            >
              <X size={17} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                section === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    goTo(item.id)
                  }
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={15} />

                  <span className="flex-1">
                    {item.label}
                  </span>

                  {active && (
                    <ChevronRight size={13} />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-2">
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold text-red-300 hover:bg-red-500/10"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[250px]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4">
            <button
              type="button"
              className="rounded-lg bg-slate-100 p-2 lg:hidden"
              onClick={() =>
                setMobileMenu(true)
              }
            >
              <Menu size={16} />
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-blue-700">
                Executive Control Center
              </p>

              <h1 className="truncate text-base font-black">
                {currentNav?.label}
              </h1>
            </div>

            <button
              type="button"
              onClick={() => void loadAll()}
              className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              title="Refresh"
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
                goTo('notifications')
              }
              className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              title="Notifications"
            >
              <Bell size={15} />
            </button>

            <button
              type="button"
              onClick={() =>
                goTo('settings')
              }
              className="hidden items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 sm:flex"
            >
              <Settings size={14} />
              Settings
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1450px] p-4 sm:p-5">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] text-slate-400">
                GY Data
              </p>

              <h2 className="text-xl font-black">
                {currentNav?.label}
              </h2>
            </div>

            {section !== 'overview' && (
              <Button
                kind="light"
                onClick={() =>
                  goTo('overview')
                }
              >
                Overview
              </Button>
            )}
          </div>

          {renderContent()}
        </main>
      </div>

      {notice && (
        <div className="fixed bottom-5 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl bg-[#06183d] px-4 py-3 text-xs font-bold text-white shadow-2xl">
          {notice}
        </div>
      )}
    </div>
  );
}
