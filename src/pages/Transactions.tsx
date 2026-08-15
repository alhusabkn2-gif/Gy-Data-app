import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Filter,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';

type Transaction = {
  id: string;
  reference?: string;
  type?: string;
  service?: string;
  product?: string;
  amount: number;
  status?: string;
  recipient?: string;
  network?: string;
  created_at: string;
};

const FILTERS = [
  'All',
  'Airtime',
  'Data',
  'Wallet',
  'Electricity',
  'Cable',
] as const;

type FilterType = (typeof FILTERS)[number];

export default function Transactions() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] =
    useState<FilterType>('All');
  const [showFilters, setShowFilters] =
    useState(false);

  useEffect(() => {
    loadTransactions();
  }, [user?.phone]);

  const loadTransactions = async () => {
    if (!user?.phone) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('phone', user.phone)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        console.error(
          'Failed to load transactions:',
          error,
        );
        setTransactions([]);
        return;
      }

      setTransactions(
        (data || []) as Transaction[],
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return transactions.filter((tx) => {
      const service =
        tx.service?.toLowerCase() || '';

      const product =
        tx.product?.toLowerCase() || '';

      const reference =
        tx.reference?.toLowerCase() || '';

      const recipient =
        tx.recipient?.toLowerCase() || '';

      let matchesFilter = true;

      if (filter !== 'All') {
        if (filter === 'Wallet') {
          matchesFilter =
            service.includes('wallet') ||
            tx.type === 'funding' ||
            tx.type === 'deposit';
        } else {
          matchesFilter =
            service.includes(
              filter.toLowerCase(),
            );
        }
      }

      const matchesSearch =
        !query ||
        service.includes(query) ||
        product.includes(query) ||
        reference.includes(query) ||
        recipient.includes(query) ||
        tx.network
          ?.toLowerCase()
          .includes(query);

      return (
        matchesFilter && matchesSearch
      );
    });
  }, [
    transactions,
    filter,
    search,
  ]);

  const getTitle = (tx: Transaction) => {
    if (tx.product) return tx.product;

    if (tx.service) {
      return tx.service
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) =>
          char.toUpperCase(),
        );
    }

    return 'Transaction';
  };

  const isCredit = (tx: Transaction) => {
    const service =
      tx.service?.toLowerCase() || '';

    return (
      tx.type === 'funding' ||
      tx.type === 'deposit' ||
      service.includes('wallet') &&
        !service.includes('purchase')
    );
  };

  const getStatusClass = (
    status?: string,
  ) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'successful':
        return 'bg-emerald-50 text-emerald-600';

      case 'pending':
        return 'bg-amber-50 text-amber-600';

      case 'failed':
      case 'cancelled':
        return 'bg-red-50 text-red-500';

      default:
        return 'bg-slate-100 text-slate-500';
    }
  };

  const getStatusText = (
    status?: string,
  ) => {
    if (!status) return 'Completed';

    return status
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) =>
        char.toUpperCase(),
      );
  };

  const formatDate = (
    value: string,
  ) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString(
      'en-NG',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      },
    );
  };

  const formatTime = (
    value: string,
  ) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleTimeString(
      'en-NG',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    );
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-24 dark:bg-slate-950">

      {/* HEADER */}

      <div className="bg-[#0D1B3D] px-5 pb-7 pt-10">

        <div className="flex items-center gap-3">

          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 active:scale-95"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>

          <div className="flex-1">

            <h1 className="text-xl font-bold text-white">
              Transactions
            </h1>

            <p className="mt-0.5 text-xs text-white/60">
              Your transaction history
            </p>

          </div>

          <button
            onClick={() =>
              setShowFilters(
                !showFilters,
              )
            }
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
              showFilters
                ? 'bg-[#F28C28]'
                : 'bg-white/10'
            }`}
          >
            <Filter className="h-4 w-4 text-white" />
          </button>

        </div>

      </div>

      <main className="-mt-1 px-5 pt-5">

        {/* SEARCH */}

        <div className="relative">

          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search transactions..."
            className="w-full rounded-[14px] border border-[#E4E8EF] bg-white py-3.5 pl-11 pr-10 text-sm text-slate-800 outline-none transition focus:border-[#0D1B3D] focus:ring-2 focus:ring-[#0D1B3D]/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />

          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}

        </div>

        {/* FILTERS */}

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: 'auto',
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 overflow-x-auto py-4">

                {FILTERS.map((item) => (
                  <button
                    key={item}
                    onClick={() =>
                      setFilter(item)
                    }
                    className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-semibold transition ${
                      filter === item
                        ? 'bg-[#0D1B3D] text-white'
                        : 'border border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    {item}
                  </button>
                ))}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showFilters && (
          <div className="flex gap-2 overflow-x-auto py-4">

            {FILTERS.slice(0, 4).map(
              (item) => (
                <button
                  key={item}
                  onClick={() =>
                    setFilter(item)
                  }
                  className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-semibold transition ${
                    filter === item
                      ? 'bg-[#0D1B3D] text-white'
                      : 'border border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  {item}
                </button>
              ),
            )}

          </div>
        )}

        {/* LIST HEADER */}

        <div className="mb-3 flex items-center justify-between">

          <h2 className="text-sm font-bold text-[#0F172A] dark:text-white">
            Recent Transactions
          </h2>

          <span className="text-[10px] text-slate-400">
            {filteredTransactions.length}{' '}
            transaction
            {filteredTransactions.length !==
            1
              ? 's'
              : ''}
          </span>

        </div>

        {/* TRANSACTIONS */}

        <div className="space-y-2.5">

          {loading ? (
            <>
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="h-[78px] animate-pulse rounded-[15px] bg-white dark:bg-slate-900"
                  />
                ),
              )}
            </>
          ) : filteredTransactions.length ===
            0 ? (
            <div className="rounded-[16px] border border-[#E5E9F0] bg-white px-5 py-12 text-center dark:border-slate-800 dark:bg-slate-900">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF2F8]">
                <Receipt className="h-5 w-5 text-[#0D1B3D]" />
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-white">
                No transactions found
              </h3>

              <p className="mt-1 text-[11px] text-slate-400">
                Your transactions will appear here.
              </p>

            </div>
          ) : (
            filteredTransactions.map(
              (tx, index) => {
                const credit =
                  isCredit(tx);

                return (
                  <motion.button
                    key={
                      tx.id ||
                      tx.reference ||
                      index
                    }
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        index * 0.025,
                    }}
                    onClick={() =>
                      navigate(
                        `/transactions/${tx.id}`,
                      )
                    }
                    className="flex w-full items-center gap-3 rounded-[15px] border border-[#E5E9F0] bg-white p-3 text-left shadow-sm transition active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
                  >

                    {/* ICON */}

                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        credit
                          ? 'bg-emerald-50'
                          : 'bg-[#EEF2F8]'
                      }`}
                    >
                      {credit ? (
                        <ArrowDownLeft className="h-[18px] w-[18px] text-emerald-600" />
                      ) : (
                        <ArrowUpRight className="h-[18px] w-[18px] text-[#0D1B3D]" />
                      )}
                    </div>

                    {/* DETAILS */}

                    <div className="min-w-0 flex-1">

                      <div className="flex items-center gap-2">

                        <p className="truncate text-xs font-bold text-slate-800 dark:text-white">
                          {getTitle(tx)}
                        </p>

                      </div>

                      <p className="mt-1 truncate text-[9px] text-slate-400">
                        {tx.recipient ||
                          tx.network ||
                          tx.reference ||
                          'Transaction'}
                      </p>

                      <p className="mt-0.5 text-[9px] text-slate-400">
                        {formatDate(
                          tx.created_at,
                        )}{' '}
                        •{' '}
                        {formatTime(
                          tx.created_at,
                        )}
                      </p>

                    </div>

                    {/* AMOUNT */}

                    <div className="shrink-0 text-right">

                      <p
                        className={`text-sm font-bold ${
                          credit
                            ? 'text-emerald-600'
                            : 'text-[#0D1B3D] dark:text-white'
                        }`}
                      >
                        {credit
                          ? '+'
                          : '-'}
                        {formatCurrency(
                          Math.abs(
                            Number(
                              tx.amount ||
                                0,
                            ),
                          ),
                        )}
                      </p>

                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[8px] font-semibold ${getStatusClass(
                          tx.status,
                        )}`}
                      >
                        {getStatusText(
                          tx.status,
                        )}
                      </span>

                    </div>

                  </motion.button>
                );
              },
            )
          )}

        </div>

      </main>

    </div>
  );
}
