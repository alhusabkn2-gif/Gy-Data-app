import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Receipt as ReceiptIcon, Search, Smartphone, Plus, ArrowDownLeft,
  Zap, Tv, GraduationCap, BookOpen, Trophy, Wifi, X, Filter,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Input from '../components/ui/Input';
import { AnimatedCard } from '../components/ui/NetworkLogo';
import { CashbackEarned } from '../components/ui/Cashback';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDateTime } from '../lib/utils';

const STATUS_TABS = ['all', 'success', 'pending', 'failed'] as const;
const SERVICES = ['all', 'data', 'airtime', 'electricity', 'cable', 'waec', 'jamb', 'betting', 'smile', 'internet', 'wallet_funding'];
const DATE_FILTERS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
];

const SERVICE_ICONS: Record<string, typeof Smartphone> = {
  data: Smartphone, airtime: Smartphone, electricity: Zap, cable: Tv,
  waec: GraduationCap, jamb: BookOpen, betting: Trophy, smile: Wifi, internet: Wifi,
  wallet_funding: Plus,
};

export default function Transactions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchTransactions(); }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;
    const { data } = await supabase.from('transactions').select('*').eq('phone', user.phone).order('created_at', { ascending: false });
    setTransactions(data || []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
      if (serviceFilter !== 'all' && tx.service !== serviceFilter) return false;
      if (dateFilter !== 'all') {
        const txDate = new Date(tx.created_at);
        const now = new Date();
        if (dateFilter === 'today' && txDate.toDateString() !== now.toDateString()) return false;
        if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (txDate < weekAgo) return false;
        }
        if (dateFilter === 'month') {
          if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) return false;
        }
      }
      if (search) {
        const q = search.toLowerCase();
        return tx.product?.toLowerCase().includes(q) || tx.service?.toLowerCase().includes(q) || tx.recipient?.toLowerCase().includes(q) || tx.reference?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [transactions, statusFilter, serviceFilter, dateFilter, search]);

  const activeFilters = (statusFilter !== 'all' ? 1 : 0) + (serviceFilter !== 'all' ? 1 : 0) + (dateFilter !== 'all' ? 1 : 0);

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 px-5 pt-12">
      <PageHeader title="Transactions" subtitle="Your transaction history" back={false} />

      {/* Search */}
      <div className="mb-3">
        <Input placeholder="Search transactions..." icon={<Search className="w-5 h-5" />} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {STATUS_TABS.map(f => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition-all ${statusFilter === f ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
            {f}
          </button>
        ))}
        <button onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${showFilters || activeFilters > 0 ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-500/30' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
          <Filter className="w-3.5 h-3.5" /> Filters {activeFilters > 0 && <span className="px-1.5 py-0.5 rounded-full bg-primary-600 text-white text-[10px] font-bold">{activeFilters}</span>}
        </button>
      </div>

      {/* Expandable Filters */}
      <motion.div initial={false} animate={{ height: showFilters ? 'auto' : 0, opacity: showFilters ? 1 : 0 }} className="overflow-hidden mb-3">
        <div className="card-premium p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Service</p>
            <div className="flex gap-2 flex-wrap">
              {SERVICES.map(s => (
                <button key={s} onClick={() => setServiceFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${serviceFilter === s ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  {s === 'all' ? 'All Services' : s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Date</p>
            <div className="flex gap-2 flex-wrap">
              {DATE_FILTERS.map(d => (
                <button key={d.id} onClick={() => setDateFilter(d.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${dateFilter === d.id ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          {activeFilters > 0 && (
            <button onClick={() => { setStatusFilter('all'); setServiceFilter('all'); setDateFilter('all'); }}
              className="flex items-center gap-1.5 text-xs font-medium text-error-500 hover:text-error-600 transition-colors">
              <X className="w-3.5 h-3.5" /> Clear all filters
            </button>
          )}
        </div>
      </motion.div>

      {/* List */}
      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-premium p-10 text-center">
          <ReceiptIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 dark:text-slate-500 font-medium">No transactions found</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((tx, i) => {
            const Icon = SERVICE_ICONS[tx.service] || Smartphone;
            const isFunding = tx.type === 'funding';
            const cashback = tx.metadata?.cashback_amount;
            return (
              <AnimatedCard key={tx.id} delay={i * 0.03}>
                <button onClick={() => navigate(`/transactions/${tx.id}`)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${isFunding ? 'bg-success-100 dark:bg-success-500/20' : 'bg-primary-100 dark:bg-primary-500/20'}`}>
                    {isFunding ? <ArrowDownLeft className="w-5 h-5 text-success-600 dark:text-success-400" /> : <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{tx.product || tx.service}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{tx.recipient ? `${tx.recipient} · ` : ''}{formatDateTime(tx.created_at)}</p>
                    {cashback && <div className="mt-1"><CashbackEarned amount={cashback} /></div>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${isFunding ? 'text-success-600 dark:text-success-400' : 'text-slate-800 dark:text-slate-100'}`}>
                      {isFunding ? '+' : '-'}{formatCurrency(parseFloat(tx.amount))}
                    </p>
                    <p className={`text-xs font-medium capitalize ${tx.status === 'success' ? 'text-success-600 dark:text-success-400' : tx.status === 'failed' ? 'text-error-500' : 'text-warning-500'}`}>{tx.status}</p>
                  </div>
                </button>
              </AnimatedCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
