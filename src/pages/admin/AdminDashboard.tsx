import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Wallet, Receipt, Package, FileText,
  Gift, BarChart3, Bell, Settings, LogOut, Menu, TrendingUp,
  TrendingDown, Smartphone, Plus, ShieldCheck, X, Search,
  ArrowUpRight, UserPlus, Zap, Activity, DollarSign,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency, formatDateTime, getInitials } from '../../lib/utils';
import Logo from '../../components/Logo';
import NetworkLogo from '../../components/ui/NetworkLogo';

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'wallets', label: 'Wallet Management', icon: Wallet },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'bills', label: 'Bills', icon: FileText },
  { id: 'referrals', label: 'Referrals', icon: Gift },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [active, setActive] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ users: 0, transactions: 0, revenue: 0, pendingTx: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.is_admin) { navigate('/login'); return; }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    const [{ data: u }, { data: t }, { data: p }, { data: r }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('referrals').select('*').order('created_at', { ascending: false }),
    ]);
    setUsers(u || []);
    setTransactions(t || []);
    setProducts(p || []);
    setReferrals(r || []);
    const txns = t || [];
    setStats({
      users: (u || []).length,
      transactions: txns.length,
      revenue: txns.filter(tx => tx.type === 'purchase' && tx.status === 'success').reduce((s, tx) => s + parseFloat(tx.amount), 0),
      pendingTx: txns.filter(tx => tx.status === 'pending').length,
    });
  };

  const renderSection = () => {
    switch (active) {
      case 'dashboard': return <DashboardSection stats={stats} transactions={transactions} users={users} onNavigate={setActive} />;
      case 'users': return <UsersSection users={users} />;
      case 'wallets': return <WalletsSection users={users} onUpdate={fetchAll} />;
      case 'transactions': return <TransactionsSection transactions={transactions} />;
      case 'products': return <ProductsSection products={products} onUpdate={fetchAll} />;
      case 'bills': return <BillsSection transactions={transactions} />;
      case 'referrals': return <ReferralsSection referrals={referrals} />;
      case 'reports': return <ReportsSection stats={stats} transactions={transactions} users={users} />;
      case 'notifications': return <NotificationsSection />;
      case 'settings': return <SettingsSection />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Dark Navy */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-navy-900 z-50 transition-transform duration-300 flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo area */}
        <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <span className="relative font-bold text-white font-display tracking-tighter">G</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold font-display tracking-tight text-white">GY DATA</span>
              <span className="text-[9px] font-medium text-blue-400 tracking-widest uppercase mt-0.5">Admin Console</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Menu</p>
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => { setActive(s.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-1 relative group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] transition-transform ${isActive ? '' : 'group-hover:scale-110'}`} />
                {s.label}
                {isActive && <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white" />}
              </button>
            );
          })}
        </nav>

        {/* Admin profile + logout */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {user ? getInitials(user.full_name) : 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name || 'Admin'}</p>
              <p className="text-xs text-white/40 truncate">Super Admin</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-[18px] h-[18px]" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar - White */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-5 sm:px-7 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-navy-900">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-display text-navy-900 capitalize">
                {SECTIONS.find(s => s.id === active)?.label}
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Welcome back, {user?.full_name?.split(' ')[0] || 'Admin'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                placeholder="Search..."
                className="bg-transparent text-sm text-navy-900 placeholder-slate-400 focus:outline-none w-32 lg:w-48"
              />
            </div>
            <button className="relative w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <Bell className="w-5 h-5 text-navy-900" />
              {stats.pendingTx > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {stats.pendingTx}
                </span>
              )}
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 flex items-center justify-center text-white font-bold text-xs">
              {user ? getInitials(user.full_name) : 'A'}
            </div>
          </div>
        </header>

        {/* Section content */}
        <div className="flex-1 p-5 sm:p-7 overflow-x-hidden">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}

/* ====================== Dashboard Home ====================== */

function DashboardSection({ stats, transactions, users, onNavigate }: {
  stats: any; transactions: any[]; users: any[]; onNavigate: (id: string) => void;
}) {
  const statCards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'from-blue-500 to-blue-700', bg: 'bg-blue-50', trend: '+12%', up: true },
    { label: 'Transactions', value: stats.transactions, icon: Receipt, color: 'from-cyan-500 to-cyan-700', bg: 'bg-cyan-50', trend: '+8%', up: true },
    { label: 'Revenue', value: formatCurrency(stats.revenue), icon: TrendingUp, color: 'from-emerald-500 to-green-700', bg: 'bg-emerald-50', trend: '+15%', up: true },
    { label: 'Pending TX', value: stats.pendingTx, icon: TrendingDown, color: 'from-amber-500 to-orange-700', bg: 'bg-amber-50', trend: '-3%', up: false },
  ];

  const quickActions = [
    { label: 'Add User', icon: UserPlus, color: 'bg-blue-600', section: 'users' },
    { label: 'Fund Wallet', icon: Wallet, color: 'bg-emerald-600', section: 'wallets' },
    { label: 'Add Product', icon: Plus, color: 'bg-cyan-600', section: 'products' },
    { label: 'Broadcast', icon: Bell, color: 'bg-amber-600', section: 'notifications' },
  ];

  const chartData = useMemo(() => {
    const last7 = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    return last7.map(date => {
      const dayTx = transactions.filter(tx => {
        const txDate = new Date(tx.created_at);
        return txDate.toDateString() === date.toDateString();
      });
      return {
        label: date.toLocaleDateString('en', { weekday: 'short' }),
        revenue: dayTx.filter(tx => tx.status === 'success').reduce((s, tx) => s + parseFloat(tx.amount || '0'), 0),
        count: dayTx.length,
      };
    });
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`flex items-center gap-0.5 text-xs font-bold ${s.up ? 'text-emerald-600' : 'text-red-500'}`}>
                  {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {s.trend}
                </span>
              </div>
              <p className="text-2xl font-bold text-navy-900 font-display leading-tight">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Revenue chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-navy-900 font-display">Revenue Overview</h3>
              <p className="text-xs text-slate-400 mt-0.5">Last 7 days performance</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
              <Activity className="w-3.5 h-3.5" /> Live
            </div>
          </div>
          <RevenueChart data={chartData} />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
        >
          <h3 className="font-bold text-navy-900 font-display mb-5">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.label}
                  onClick={() => onNavigate(a.section)}
                  className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                >
                  <div className={`w-11 h-11 rounded-xl ${a.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-navy-900 text-center">{a.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Service distribution + Recent activity */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Service distribution donut */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
        >
          <h3 className="font-bold text-navy-900 font-display mb-5">Service Distribution</h3>
          <ServiceDonut transactions={transactions} />
        </motion.div>

        {/* Recent activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-navy-900 font-display">Recent Activity</h3>
            <button onClick={() => onNavigate('transactions')} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1 max-h-[340px] overflow-y-auto -mr-2 pr-2">
            {transactions.slice(0, 8).map(tx => (
              <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                <NetworkLogo network={tx.network || tx.service} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-900 truncate">{tx.product || tx.service}</p>
                  <p className="text-xs text-slate-400">{tx.phone}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-navy-900">{formatCurrency(tx.amount)}</p>
                  <p className={`text-xs capitalize ${tx.status === 'success' ? 'text-emerald-600' : tx.status === 'failed' ? 'text-red-500' : 'text-amber-500'}`}>{tx.status}</p>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">No recent transactions</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* New users strip */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-navy-900 font-display">New Users</h3>
          <button onClick={() => onNavigate('users')} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
            View all <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {users.filter(u => !u.is_admin).slice(0, 4).map(u => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {getInitials(u.full_name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy-900 truncate">{u.full_name}</p>
                <p className="text-xs text-slate-400">{u.phone}</p>
              </div>
            </div>
          ))}
          {users.filter(u => !u.is_admin).length === 0 && (
            <p className="text-sm text-slate-400 col-span-full text-center py-4">No users yet</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ====================== Charts ====================== */

function RevenueChart({ data }: { data: { label: string; revenue: number; count: number }[] }) {
  const max = Math.max(...data.map(d => d.revenue), 1);
  const width = 100;
  const barWidth = width / data.length;
  const points = data.map((d, i) => {
    const x = i * barWidth + barWidth / 2;
    const y = 100 - (d.revenue / max) * 85 - 5;
    return { x, y, ...d };
  });
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1]?.x ?? 0} 100 L ${points[0]?.x ?? 0} 100 Z`;

  return (
    <div>
      <div className="relative">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-44 sm:h-52 overflow-visible">
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[20, 40, 60, 80].map(y => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f1f5f9" strokeWidth="0.3" />
          ))}
          <motion.path
            d={areaD}
            fill="url(#revGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
          <motion.path
            d={pathD}
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          />
          {points.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="0.9"
              fill="#1d4ed8"
              stroke="white"
              strokeWidth="0.4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
            />
          ))}
        </svg>
      </div>
      <div className="flex justify-between mt-3">
        {data.map(d => (
          <div key={d.label} className="text-center">
            <p className="text-xs font-semibold text-navy-900">{Math.round(d.revenue / 1000)}k</p>
            <p className="text-[10px] text-slate-400">{d.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceDonut({ transactions }: { transactions: any[] }) {
  const serviceData = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach(tx => {
      const svc = tx.service || 'other';
      counts[svc] = (counts[svc] || 0) + 1;
    });
    const total = Object.values(counts).reduce((s, n) => s + n, 0) || 1;
    const colors: Record<string, string> = {
      data: '#3b82f6', airtime: '#06b6d4', electricity: '#f59e0b',
      cable: '#8b5cf6', waec: '#ec4899', jamb: '#ef4444', betting: '#10b981',
    };
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([service, count]) => ({
        service, count, percent: count / total,
        color: colors[service] || '#64748b',
      }));
  }, [transactions]);

  if (serviceData.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">No transaction data</p>;
  }

  let offset = 0;
  const radius = 30;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-36 h-36 flex-shrink-0">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          {serviceData.map((d, i) => {
            const dash = d.percent * circumference;
            const seg = (
              <motion.circle
                key={d.service}
                cx="40" cy="40" r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth="9"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              />
            );
            offset += dash;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-navy-900 font-display">{transactions.length}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total TX</p>
        </div>
      </div>
      <div className="flex-1 space-y-2.5 w-full">
        {serviceData.map(d => (
          <div key={d.service} className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-sm font-medium text-navy-900 capitalize flex-1">{d.service}</span>
            <span className="text-sm font-bold text-navy-900">{d.count}</span>
            <span className="text-xs text-slate-400 w-10 text-right">{Math.round(d.percent * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ====================== Users ====================== */

function UsersSection({ users }: { users: any[] }) {
  const [search, setSearch] = useState('');
  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-slate-200 shadow-sm max-w-md">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          placeholder="Search users by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm text-navy-900 placeholder-slate-400 focus:outline-none flex-1"
        />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Phone</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Balance</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide hidden sm:table-cell">KYC</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {getInitials(u.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy-900 truncate">{u.full_name}</p>
                        <p className="text-xs text-slate-400 sm:hidden">{u.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 hidden sm:table-cell">{u.phone}</td>
                  <td className="px-5 py-3.5 text-sm font-bold text-navy-900">{formatCurrency(u.wallet_balance)}</td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      u.kyc_status === 'verified' ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                    }`}>{u.kyc_status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">{formatDateTime(u.created_at)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ====================== Wallets ====================== */

function WalletsSection({ users, onUpdate }: { users: any[]; onUpdate: () => void }) {
  const [selected, setSelected] = useState<any>(null);
  const [amount, setAmount] = useState('');

  const fundWallet = async () => {
    if (!selected || !amount) return;
    const newBalance = parseFloat(selected.wallet_balance) + parseFloat(amount);
    await supabase.from('profiles').update({ wallet_balance: newBalance, updated_at: new Date().toISOString() }).eq('id', selected.id);
    await supabase.from('transactions').insert({
      phone: selected.phone, type: 'funding', service: 'admin_funding', product: 'Admin Wallet Funding',
      amount: parseFloat(amount), status: 'success',
    });
    setSelected(null); setAmount(''); onUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.filter(u => !u.is_admin).map((u, i) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 flex items-center justify-center text-white font-bold text-xs">
                {getInitials(u.full_name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy-900 truncate">{u.full_name}</p>
                <p className="text-xs text-slate-400">{u.phone}</p>
              </div>
            </div>
            <p className="text-xl font-bold text-navy-900 font-display">{formatCurrency(u.wallet_balance)}</p>
            <button
              onClick={() => setSelected(u)}
              className="w-full mt-4 px-3 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Fund Wallet
            </button>
          </motion.div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold font-display text-navy-900 mb-1">Fund Wallet</h3>
            <p className="text-sm text-slate-400 mb-4">{selected.full_name} · {selected.phone}</p>
            <input
              type="number"
              placeholder="Amount (NGN)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={fundWallet} className="flex-1 px-4 py-3 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 transition-colors">Fund</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ====================== Transactions ====================== */

function TransactionsSection({ transactions }: { transactions: any[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Reference</th>
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide hidden sm:table-cell">User</th>
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Product</th>
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Amount</th>
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5 text-xs font-mono text-slate-500">{tx.reference}</td>
                <td className="px-5 py-3.5 text-sm text-slate-600 hidden sm:table-cell">{tx.phone}</td>
                <td className="px-5 py-3.5 text-sm font-semibold text-navy-900">{tx.product || tx.service}</td>
                <td className="px-5 py-3.5 text-sm font-bold text-navy-900">{formatCurrency(tx.amount)}</td>
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    tx.status === 'success' ? 'bg-emerald-100 text-emerald-700'
                    : tx.status === 'failed' ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                  }`}>{tx.status}</span>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">{formatDateTime(tx.created_at)}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">No transactions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ====================== Products ====================== */

function ProductsSection({ products, onUpdate }: { products: any[]; onUpdate: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ service: 'data', name: '', price: '', network: '', description: '' });

  const addProduct = async () => {
    if (!form.name || !form.price) return;
    await supabase.from('products').insert({
      service: form.service, name: form.name, price: parseFloat(form.price),
      network: form.network || null, description: form.description,
    });
    setForm({ service: 'data', name: '', price: '', network: '', description: '' });
    setShowAdd(false); onUpdate();
  };

  const toggleProduct = async (p: any) => {
    await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id);
    onUpdate();
  };

  return (
    <div className="space-y-4">
      <button onClick={() => setShowAdd(true)} className="px-5 py-3 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 transition-colors flex items-center gap-2 shadow-lg shadow-navy-900/20">
        <Plus className="w-4 h-4" /> Add Product
      </button>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.02 }}
            className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)] ${!p.is_active ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start justify-between mb-3">
              <NetworkLogo network={p.network || p.service} size="sm" />
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-500">{p.service}</span>
            </div>
            <p className="font-bold text-navy-900">{p.name}</p>
            <p className="text-xs text-slate-400 mb-3">{p.description}</p>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-blue-600">{formatCurrency(p.price)}</p>
              <button
                onClick={() => toggleProduct(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${p.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {p.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
          </motion.div>
        ))}
        {products.length === 0 && (
          <p className="text-sm text-slate-400 col-span-full text-center py-10">No products yet</p>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold font-display text-navy-900 mb-4">Add Product</h3>
            <div className="space-y-3">
              <select value={form.service} onChange={(e) => setForm({...form, service: e.target.value})} className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="data">Data</option>
                <option value="airtime">Airtime</option>
                <option value="electricity">Electricity</option>
                <option value="cable">Cable TV</option>
                <option value="waec">WAEC</option>
                <option value="jamb">JAMB</option>
                <option value="betting">Betting</option>
                <option value="smile">Smile Data</option>
              </select>
              <input placeholder="Product Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <input placeholder="Network (optional)" value={form.network} onChange={(e) => setForm({...form, network: e.target.value})} className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={addProduct} className="flex-1 px-4 py-3 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 transition-colors">Add</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ====================== Bills ====================== */

function BillsSection({ transactions }: { transactions: any[] }) {
  const bills = transactions.filter(t => ['electricity', 'cable', 'waec', 'jamb'].includes(t.service));
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-bold text-navy-900 font-display">Bill Payments</h3>
        <p className="text-sm text-slate-400">Electricity, Cable, WAEC, JAMB transactions</p>
      </div>
      <div className="divide-y divide-slate-100">
        {bills.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-400">No bill payments yet</p>
        ) : bills.map(tx => (
          <div key={tx.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
            <NetworkLogo network={tx.network || tx.service} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy-900 truncate">{tx.product || tx.service}</p>
              <p className="text-xs text-slate-400">{tx.recipient} · {formatDateTime(tx.created_at)}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-navy-900">{formatCurrency(tx.amount)}</p>
              <p className={`text-xs capitalize ${tx.status === 'success' ? 'text-emerald-600' : 'text-amber-500'}`}>{tx.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ====================== Referrals ====================== */

function ReferralsSection({ referrals }: { referrals: any[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-bold text-navy-900 font-display">Referral History</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {referrals.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-400">No referrals yet</p>
        ) : referrals.map(r => (
          <div key={r.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Gift className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy-900">{r.referred_phone}</p>
              <p className="text-xs text-slate-400">Referred by {r.referrer_phone}</p>
            </div>
            <p className="text-sm font-bold text-emerald-600">{formatCurrency(r.reward_amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ====================== Reports ====================== */

function ReportsSection({ stats, transactions, users }: { stats: any; transactions: any[]; users: any[] }) {
  const serviceStats = transactions.reduce((acc: Record<string, number>, tx: any) => {
    acc[tx.service] = (acc[tx.service] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const reportCards = [
    { label: 'Total Revenue', value: formatCurrency(stats.revenue), icon: DollarSign },
    { label: 'Total Users', value: stats.users, icon: Users },
    { label: 'Verified Users', value: users.filter(u => u.kyc_status === 'verified').length, icon: ShieldCheck },
    { label: 'Total TX', value: stats.transactions, icon: Receipt },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
            >
              <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-slate-400">{c.label}</p>
              <p className="text-2xl font-bold text-navy-900 font-display">{c.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
        <h3 className="font-bold text-navy-900 font-display mb-5">Service Distribution</h3>
        <div className="space-y-3">
          {Object.entries(serviceStats).sort((a, b) => b[1] - a[1]).map(([service, count]) => {
            const max = Math.max(...Object.values(serviceStats));
            return (
              <div key={service}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-navy-900 capitalize">{service}</span>
                  <span className="text-sm font-bold text-navy-900">{count}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / max) * 100}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-700"
                  />
                </div>
              </div>
            );
          })}
          {Object.keys(serviceStats).length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ====================== Notifications ====================== */

function NotificationsSection() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!title || !message) return;
    const { data: users } = await supabase.from('profiles').select('phone');
    if (users && users.length > 0) {
      await supabase.from('notifications').insert(
        users.map((u: any) => ({ phone: u.phone, title, message, type: 'broadcast' }))
      );
    }
    setTitle(''); setMessage(''); setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <div className="max-w-lg">
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
        <h3 className="font-bold text-navy-900 font-display mb-5">Broadcast Notification</h3>
        <div className="space-y-3">
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <textarea placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
          <button onClick={send} className="w-full px-5 py-3.5 rounded-xl bg-navy-900 text-white font-semibold hover:bg-navy-800 transition-colors flex items-center justify-center gap-2">
            {sent ? <><Zap className="w-4 h-4" /> Sent!</> : 'Send to All Users'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ====================== Settings ====================== */

function SettingsSection() {
  const [maintenance, setMaintenance] = useState(false);
  const [autoFund, setAutoFund] = useState(true);

  return (
    <div className="max-w-lg space-y-4">
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
        <h3 className="font-bold text-navy-900 font-display mb-5">App Settings</h3>
        <div className="space-y-3">
          <ToggleRow
            icon={<ShieldCheck className="w-5 h-5 text-blue-600" />}
            label="Maintenance Mode"
            enabled={maintenance}
            onToggle={() => setMaintenance(!maintenance)}
          />
          <ToggleRow
            icon={<Smartphone className="w-5 h-5 text-blue-600" />}
            label="Auto-fund on Low Balance"
            enabled={autoFund}
            onToggle={() => setAutoFund(!autoFund)}
          />
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ icon, label, enabled, onToggle }: { icon: React.ReactNode; label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-semibold text-navy-900">{label}</span>
      </div>
      <button
        onClick={onToggle}
        className={`w-11 h-6 rounded-full p-1 transition-colors ${enabled ? 'bg-navy-900' : 'bg-slate-300'}`}
      >
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`w-4 h-4 rounded-full bg-white ${enabled ? 'translate-x-5' : ''}`}
        />
      </button>
    </div>
  );
}
