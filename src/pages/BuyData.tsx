BuyData.tsx

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Smartphone,
  Search,
  Check,
  Wallet,
  Sparkles,
  ArrowRight,
  Wifi,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';
import NetworkLogo from '../components/ui/NetworkLogo';
import Button from '../components/ui/Button';
import ReceiptScreen, {
  PurchasePinModal,
  type ReceiptData,
} from '../components/ReceiptScreen';

const NETWORKS = [
  { id: 'MTN', name: 'MTN' },
  { id: 'AIRTEL', name: 'Airtel' },
  { id: 'GLO', name: 'Glo' },
  { id: '9MOBILE', name: '9mobile' },
];

const CATEGORIES = ['SME', 'Corporate', 'Gifting', 'Direct'] as const;

type Category = (typeof CATEGORIES)[number];

interface DataPlan {
  id: string;
  name: string;
  price: number;
  network: string;
  category: string;
  description: string;
  cashback_percent?: number;
}

interface PurchaseResponse {
  success?: boolean;
  message?: string;
  transaction?: {
    reference?: string;
    created_at?: string;
  };
  prevBalance?: number;
  newBalance?: number;
  cashbackEarned?: number;
}

export default function BuyData() {
  const navigate = useNavigate();
  const { user, updateWalletBalance } = useAuth();

  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [category, setCategory] = useState<Category>('SME');

  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');

  const [selectedPlan, setSelectedPlan] =
    useState<DataPlan | null>(null);

  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const [stage, setStage] =
    useState<'pin' | 'processing' | 'error'>('pin');

  const [receipt, setReceipt] =
    useState<ReceiptData | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('service', 'data')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        console.error('Failed to load data plans:', error);
        setPlans([]);
        return;
      }

      setPlans((data || []) as DataPlan[]);
    } catch (error) {
      console.error('Unexpected error loading plans:', error);
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  /*
   * Important:
   * If a network is selected, plans are filtered by network.
   * Category is also applied when the database has a category.
   */
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const networkMatches =
        !selectedNetwork ||
        String(plan.network || '').toUpperCase() ===
          selectedNetwork.toUpperCase();

      const categoryMatches =
        !category ||
        !plan.category ||
        String(plan.category).toLowerCase() ===
          category.toLowerCase();

      const searchMatches =
        !search ||
        String(plan.name || '')
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        String(plan.description || '')
          .toLowerCase()
          .includes(search.toLowerCase());

      return networkMatches && categoryMatches && searchMatches;
    });
  }, [plans, selectedNetwork, category, search]);

  /*
   * When category filtering would hide all plans,
   * show all plans for the selected network instead.
   *
   * This prevents the customer from seeing "No plans"
   * simply because the database category is different.
   */
  const visiblePlans = useMemo(() => {
    if (!selectedNetwork) return [];

    if (filteredPlans.length > 0) {
      return filteredPlans;
    }

    return plans.filter((plan) => {
      const networkMatches =
        String(plan.network || '').toUpperCase() ===
        selectedNetwork.toUpperCase();

      const searchMatches =
        !search ||
        String(plan.name || '')
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        String(plan.description || '')
          .toLowerCase()
          .includes(search.toLowerCase());

      return networkMatches && searchMatches;
    });
  }, [filteredPlans, plans, selectedNetwork, search]);

  const canProceed =
    !!selectedNetwork &&
    phone.replace(/\D/g, '').length >= 10 &&
    !!selectedPlan;

  const handleNetworkSelect = (network: string) => {
    setSelectedNetwork(network);
    setSelectedPlan(null);
    setSearch('');
  };

  const handleUseMyNumber = () => {
    if (!user?.phone) return;

    const digits = user.phone.replace(/\D/g, '');

    if (digits.startsWith('234') && digits.length >= 12) {
      setPhone(digits.slice(3, 13));
    } else {
      setPhone(digits.slice(-10));
    }
  };

  const normalizeRecipient = (value: string) => {
    const digits = value.replace(/\D/g, '');

    if (digits.startsWith('234') && digits.length === 13) {
      return `0${digits.slice(3)}`;
    }

    if (digits.length === 10) {
      return `0${digits}`;
    }

    if (digits.length === 11 && digits.startsWith('0')) {
      return digits;
    }

    return digits;
  };

  const handleProceed = () => {
    if (!canProceed) return;

    if (!user) {
      setPinError('Please login before purchasing data.');
      return;
    }

    setPin('');
    setPinError('');
    setStage('pin');
    setShowPinModal(true);
  };

  const handlePinComplete = async (value: string) => {
    if (!user || !selectedPlan) {
      setPinError('Please login and select a data plan.');
      setStage('error');
      return;
    }

    const purchasePin = String(value || '').trim();

    if (!purchasePin) {
      setPinError('Enter your purchase PIN.');
      setStage('error');
      return;
    }

    setPinError('');
    setStage('processing');

    const amount = Number(selectedPlan.price);
    const recipient = normalizeRecipient(phone);

    if (recipient.length !== 11) {
      setStage('error');
      setPinError('Please enter a valid Nigerian phone number.');
      return;
    }

    const currentBalance = Number(user.wallet_balance || 0);

    if (amount > currentBalance) {
      setStage('error');
      setPinError(
        'Insufficient wallet balance. Please fund your wallet.'
      );
      return;
    }

    try {
      const apiBaseUrl = String(
        import.meta.env.VITE_API_URL || ''
      ).replace(/\/$/, '');

      const endpoint = `${apiBaseUrl}/api/purchase`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          phone: user.phone,
          service: 'data',
          product: selectedPlan.name,
          product_id: selectedPlan.id,
          amount,
          recipient,
          network: selectedNetwork,
          category: selectedPlan.category,
          purchase_pin: purchasePin,
          metadata: {
            product_id: selectedPlan.id,
            product_name: selectedPlan.name,
            category: selectedPlan.category,
            network: selectedNetwork,
            description: selectedPlan.description || '',
          },
        }),
      });

      let result: PurchaseResponse | null = null;

      try {
        result = (await response.json()) as PurchaseResponse;
      } catch {
        result = null;
      }

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ||
            `Data purchase failed (${response.status}). Please try again.`
        );
      }

      const transaction = result.transaction;

      if (!transaction?.reference) {
        throw new Error(
          'Purchase completed without a transaction reference.'
        );
      }

      const previousBalance = Number(
        result.prevBalance ?? currentBalance
      );

      const newBalance = Number(
        result.newBalance ?? previousBalance - amount
      );

      const cashbackEarned = Number(
        result.cashbackEarned || 0
      );

      updateWalletBalance(newBalance);

      setReceipt({
        reference: transaction.reference,
        network: selectedNetwork,
        phone: recipient,
        productName: selectedPlan.name,
        amount,
        prevBalance: previousBalance,
        newBalance,
        date:
          transaction.created_at ||
          new Date().toISOString(),
        title: 'Data Purchase Complete',
        subtitle: `${selectedPlan.name} delivered to ${recipient}`,
        cashbackEarned,
      });

      setTimeout(() => {
        setShowPinModal(false);
        setStage('pin');
        setPin('');
        setPinError('');
      }, 700);
    } catch (error) {
      console.error(
        'Data purchase request failed:',
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Data purchase failed. Please try again.';

      setStage('error');
      setPinError(message);
    }
  };

  const closePinModal = () => {
    setShowPinModal(false);
    setStage('pin');
    setPin('');
    setPinError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-36">

      {/* TOP HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 px-5 pt-8 pb-20 dark:from-primary-800 dark:via-primary-900 dark:to-slate-950">

        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-accent-500/10 blur-3xl" />

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 backdrop-blur-md transition active:scale-90"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>

            <div className="flex-1">
              <h1 className="font-display text-xl font-bold text-white">
                Buy Data
              </h1>

              <p className="mt-0.5 text-xs text-white/60">
                Choose a network and data plan
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
              <Wifi className="h-5 w-5 text-white" />
            </div>
          </motion.div>

          {/* WALLET */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 backdrop-blur-md"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Wallet className="h-4 w-4 text-white" />
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">
                Wallet Balance
              </p>

              <p className="font-display text-base font-bold text-white">
                {formatCurrency(user?.wallet_balance || 0)}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <main className="-mt-10 relative z-10 space-y-5 px-5">

        {/* STEP 1 — NETWORK */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="card-premium p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary-500">
                Step 1
              </p>

              <h2 className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                Choose Network
              </h2>
            </div>

            {selectedNetwork && (
              <span className="rounded-full bg-primary-50 px-3 py-1 text-[10px] font-bold text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
                {selectedNetwork}
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {NETWORKS.map((net) => {
              const active = selectedNetwork === net.id;

              return (
                <motion.button
                  key={net.id}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleNetworkSelect(net.id)}
                  className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all ${
                    active
                      ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-500/10 dark:bg-primary-500/10'
                      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                  }`}
                >
                  {active && (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500">
                      <Check className="h-3 w-3 text-white" />
                    </span>
                  )}

                  <NetworkLogo
                    network={net.id}
                    size="sm"
                  />

                  <span
                    className={`text-[10px] font-bold ${
                      active
                        ? 'text-primary-600 dark:text-primary-300'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {net.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* EVERYTHING BELOW NETWORK */}
        <AnimatePresence mode="wait">
          {selectedNetwork && (
            <motion.div
              key={selectedNetwork}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >

              {/* PHONE */}
              <section className="card-premium p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary-500">
                      Step 2
                    </p>

                    <h2 className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                      Recipient Number
                    </h2>
                  </div>

                  <button
                    onClick={handleUseMyNumber}
                    className="flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1.5 text-[10px] font-bold text-primary-600 dark:bg-primary-500/10 dark:text-primary-300"
                  >
                    <Sparkles className="h-3 w-3" />
                    My Number
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    +234
                  </span>

                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    placeholder="801 234 5678"
                    onChange={(e) =>
                      setPhone(
                        e.target.value
                          .replace(/[^0-9]/g, '')
                          .slice(0, 11)
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-14 pr-4 text-base font-semibold text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                  />
                </div>
              </section>

              {/* PLANS */}
              <section className="card-premium p-4">
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary-500">
                    Step 3
                  </p>

                  <div className="mt-0.5 flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Choose Data Plan
                    </h2>

                    {!loadingPlans && (
                      <span className="text-[10px] font-semibold text-slate-400">
                        {visiblePlans.length} plans
                      </span>
                    )}
                  </div>
                </div>

                {/* CATEGORY */}
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                  {CATEGORIES.map((cat) => {
                    const active = category === cat;

                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setCategory(cat);
                          setSelectedPlan(null);
                        }}
                        className={`shrink-0 rounded-xl px-4 py-2 text-[11px] font-bold transition-all ${
                          active
                            ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                            : 'border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>

                {/* SEARCH */}
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search data plan..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                  />
                </div>

                {/* PLAN LIST */}
                <div className="space-y-2.5">
                  {loadingPlans ? (
                    <div className="py-10 text-center">
                      <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />

                      <p className="mt-3 text-xs text-slate-400">
                        Loading data plans...
                      </p>
                    </div>
                  ) : visiblePlans.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center dark:border-slate-700">
                      <Smartphone className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />

                      <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        No data plan found
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Try another category or search.
                      </p>
                    </div>
                  ) : (
                    visiblePlans.map((plan) => {
                      const active =
                        selectedPlan?.id === plan.id;

                      return (
                        <motion.button
                          key={plan.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            setSelectedPlan(plan)
                          }
                          className={`relative w-full rounded-2xl border-2 p-4 text-left transition-all ${
                            active
                              ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-500/10 dark:bg-primary-500/10'
                              : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                                active
                                  ? 'bg-primary-500'
                                  : 'bg-primary-50 dark:bg-primary-500/10'
                              }`}
                            >
                              <Wifi
                                className={`h-5 w-5 ${
                                  active
                                    ? 'text-white'
                                    : 'text-primary-500'
                                }`}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="pr-7 text-sm font-bold text-slate-900 dark:text-white">
                                {plan.name}
                              </p>

                              {plan.description && (
                                <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-400">
                                  {plan.description}
                                </p>
                              )}
                            </div>

                            <div className="text-right">
                              <p className="text-base font-bold text-primary-600 dark:text-primary-400">
                                {formatCurrency(plan.price)}
                              </p>

                              {plan.cashback_percent &&
                                plan.cashback_percent > 0 ? (
                                <p className="mt-0.5 text-[9px] font-bold text-emerald-500">
                                  {plan.cashback_percent}% cashback
                                </p>
                              ) : null}
                            </div>
                          </div>

                          {active && (
                            <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </section>

              {/* SELECTED PLAN */}
              {selectedPlan && (
                <motion.section
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-premium overflow-hidden"
                >
                  <div className="bg-primary-600 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                      Selected Plan
                    </p>

                    <p className="mt-1 text-base font-bold text-white">
                      {selectedPlan.name}
                    </p>
                  </div>

                  <div className="space-y-3 p-4">
                    <ConfirmRow
                      label="Network"
                      value={
                        NETWORKS.find(
                          (n) => n.id === selectedNetwork
                        )?.name || selectedNetwork
                      }
                    />

                    <ConfirmRow
                      label="Recipient"
                      value={`+234 ${phone}`}
                    />

                    <ConfirmRow
                      label="Plan"
                      value={selectedPlan.name}
                    />

                    <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          Total
                        </p>

                        <p className="font-display text-xl font-bold text-primary-600 dark:text-primary-400">
                          {formatCurrency(selectedPlan.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* PURCHASE BAR */}
      <AnimatePresence>
        {canProceed && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 320,
            }}
            className="fixed bottom-20 left-0 right-0 z-40 px-5 sm:left-1/2 sm:max-w-md sm:-translate-x-1/2"
          >
            <div className="card-premium border border-slate-200 p-4 shadow-2xl dark:border-slate-700">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Total
                  </p>

                  <p className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(selectedPlan.price)}
                  </p>
                </div>

                <div className="max-w-[55%] text-right">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Recipient
                  </p>

                  <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                    +234 {phone}
                  </p>
                </div>
              </div>

              <Button
                fullWidth
                size="lg"
                onClick={handleProceed}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIN */}
      <PurchasePinModal
        open={showPinModal}
        onClose={closePinModal}
        amount={selectedPlan?.price || 0}
        productName={selectedPlan?.name || ''}
        pin={pin}
        setPin={setPin}
        pinError={pinError}
        stage={stage}
        onPinComplete={handlePinComplete}
      />

      {/* RECEIPT */}
      <AnimatePresence>
        {receipt && (
          <ReceiptScreen
            receipt={receipt}
            onClose={() => navigate('/')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ConfirmRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="max-w-[65%] truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
        {value}
      </p>
    </div>
  );
}
