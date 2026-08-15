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

const CATEGORIES = [
  'SME',
  'Corporate',
  'Gifting',
  'Direct',
] as const;

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

  const [selectedNetwork, setSelectedNetwork] =
    useState('');
  const [category, setCategory] =
    useState<Category>('SME');

  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');

  const [selectedPlan, setSelectedPlan] =
    useState<DataPlan | null>(null);

  const [showPinModal, setShowPinModal] =
    useState(false);
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
        .order('price', {
          ascending: true,
        });

      if (error) {
        console.error(
          'Failed to load data plans:',
          error,
        );
        setPlans([]);
        return;
      }

      if (data) {
        setPlans(data as DataPlan[]);
      }
    } catch (error) {
      console.error(
        'Unexpected error loading plans:',
        error,
      );
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (
        selectedNetwork &&
        plan.network?.toUpperCase() !==
          selectedNetwork.toUpperCase()
      ) {
        return false;
      }

      if (
        category &&
        plan.category?.toLowerCase() !==
          category.toLowerCase()
      ) {
        return false;
      }

      if (
        search &&
        !plan.name
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [
    plans,
    selectedNetwork,
    category,
    search,
  ]);

  const canProceed =
    !!selectedNetwork &&
    phone.replace(/\D/g, '').length >= 10 &&
    !!selectedPlan;

  const handleUseMyNumber = () => {
    if (!user?.phone) return;

    const digits = user.phone.replace(/\D/g, '');

    if (
      digits.startsWith('234') &&
      digits.length >= 12
    ) {
      setPhone(digits.slice(3, 13));
    } else {
      setPhone(digits.slice(-10));
    }
  };

  const handleProceed = () => {
    if (!canProceed) return;

    if (!user) {
      setPinError(
        'Please login before purchasing data.',
      );
      return;
    }

    setPin('');
    setPinError('');
    setStage('pin');
    setShowPinModal(true);
  };

  const normalizeRecipient = (
    value: string,
  ) => {
    const digits = value.replace(/\D/g, '');

    if (
      digits.startsWith('234') &&
      digits.length === 13
    ) {
      return `0${digits.slice(3)}`;
    }

    if (digits.length === 10) {
      return `0${digits}`;
    }

    if (
      digits.length === 11 &&
      digits.startsWith('0')
    ) {
      return digits;
    }

    return digits;
  };

  const handlePinComplete = async (
    value: string,
  ) => {
    if (!user || !selectedPlan) {
      setPinError(
        'Please login and select a data plan.',
      );
      setStage('error');
      return;
    }

    const purchasePin =
      String(value || '').trim();

    if (!purchasePin) {
      setPinError(
        'Enter your purchase PIN.',
      );
      setStage('error');
      return;
    }

    setPinError('');
    setStage('processing');

    const amount = Number(
      selectedPlan.price,
    );

    const recipient =
      normalizeRecipient(phone);

    if (recipient.length !== 11) {
      setStage('error');
      setPinError(
        'Please enter a valid Nigerian phone number.',
      );
      return;
    }

    const currentBalance = Number(
      user.wallet_balance || 0,
    );

    if (amount > currentBalance) {
      setStage('error');
      setPinError(
        'Insufficient wallet balance. Please fund your wallet.',
      );
      return;
    }

    try {
      const apiBaseUrl = String(
        import.meta.env.VITE_API_URL || '',
      ).replace(/\/$/, '');

      const endpoint = `${apiBaseUrl}/api/purchase`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
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
            description:
              selectedPlan.description || '',
          },
        }),
      });

      let result:
        | PurchaseResponse
        | null = null;

      try {
        result =
          (await response.json()) as PurchaseResponse;
      } catch {
        result = null;
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            `Data purchase failed (${response.status}). Please try again.`,
        );
      }

      const transaction =
        result.transaction;

      if (!transaction?.reference) {
        throw new Error(
          'Purchase completed without a transaction reference.',
        );
      }

      const previousBalance =
        Number(
          result.prevBalance ??
            currentBalance,
        );

      const newBalance =
        Number(
          result.newBalance ??
            previousBalance - amount,
        );

      const cashbackEarned =
        Number(
          result.cashbackEarned || 0,
        );

      updateWalletBalance(newBalance);

      setReceipt({
        reference:
          transaction.reference,
        network: selectedNetwork,
        phone: recipient,
        productName:
          selectedPlan.name,
        amount,
        prevBalance:
          previousBalance,
        newBalance,
        date:
          transaction.created_at ||
          new Date().toISOString(),
        title:
          'Data Purchase Complete',
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
        error,
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
    <div className="min-h-screen bg-[#F6F8FB] pb-32 dark:bg-slate-950">

      {/* HEADER */}

      <div className="relative overflow-hidden bg-gradient-to-br from-[#0B2145] via-[#102A56] to-[#183867] px-5 pb-24 pt-10">

        <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/5 blur-3xl" />

        <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/4 translate-y-1/2 rounded-full bg-[#F28C28]/10 blur-3xl" />

        <motion.div
          initial={{
            opacity: 0,
            y: -16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
          className="relative flex items-center gap-3"
        >

          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 backdrop-blur-md transition-all hover:bg-white/20 active:scale-90"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>

          <div className="flex-1">

            <h1 className="font-display text-xl font-bold text-white">
              Buy Data
            </h1>

            <p className="text-xs text-white/60">
              Purchase data bundles
            </p>

          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 backdrop-blur-md">
            <Smartphone className="h-5 w-5 text-white" />
          </div>

        </motion.div>

        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.1,
          }}
          className="relative mt-5 flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 backdrop-blur-md"
        >

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <Wallet className="h-4 w-4 text-white" />
          </div>

          <div>

            <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">
              Wallet Balance
            </p>

            <p className="font-display text-base font-bold text-white">
              {formatCurrency(
                user?.wallet_balance || 0,
              )}
            </p>

          </div>

        </motion.div>

      </div>

      <div className="relative z-10 -mt-12 space-y-5 px-5">

        {/* NETWORK */}

        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.15,
          }}
        >

          <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Select Network
          </label>

          <div className="grid grid-cols-4 gap-2.5">

            {NETWORKS.map((net) => (
              <motion.button
                key={net.id}
                whileTap={{
                  scale: 0.92,
                }}
                onClick={() => {
                  setSelectedNetwork(net.id);
                  setSelectedPlan(null);
                }}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2.5 transition-all ${
                  selectedNetwork === net.id
                    ? 'border-[#102A56] bg-[#102A56]/5 shadow-md shadow-[#102A56]/10'
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                }`}
              >

                <NetworkLogo
                  network={net.id}
                  size="sm"
                />

                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                  {net.name}
                </span>

              </motion.button>
            ))}

          </div>

        </motion.div>

        {selectedNetwork && (
          <>
            {/* PHONE */}

            <motion.div
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
            >

              <div className="mb-2.5 flex items-center justify-between">

                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Phone Number
                </label>

                <button
                  onClick={handleUseMyNumber}
                  className="flex items-center gap-1 text-xs font-semibold text-[#102A56] transition-colors hover:text-[#183867]"
                >
                  <Sparkles className="h-3 w-3 text-[#F28C28]" />
                  Use My Number
                </button>

              </div>

              <div className="relative">

                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 dark:text-slate-500">
                  +234
                </span>

                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="801 234 5678"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                        .replace(
                          /[^0-9]/g,
                          '',
                        )
                        .slice(0, 11),
                    )
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:border-[#102A56] focus:outline-none focus:ring-2 focus:ring-[#102A56]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />

              </div>

            </motion.div>

            {/* CATEGORY */}

            <motion.div
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
            >

              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Data Category
              </label>

              <div className="grid grid-cols-4 gap-2">

                {CATEGORIES.map((cat) => (
                  <motion.button
                    key={cat}
                    whileTap={{
                      scale: 0.92,
                    }}
                    onClick={() => {
                      setCategory(cat);
                      setSelectedPlan(null);
                    }}
                    className={`rounded-xl py-2.5 text-xs font-bold transition-all ${
                      category === cat
                        ? 'bg-[#102A56] text-white shadow-lg shadow-[#102A56]/20'
                        : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                  >
                    {cat}
                  </motion.button>
                ))}

              </div>

            </motion.div>

            {/* PLAN SEARCH */}

            <motion.div
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
            >

              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Select Data Plan
              </label>

              <div className="relative mb-3">

                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  placeholder="Search plans..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-[#102A56] focus:outline-none focus:ring-2 focus:ring-[#102A56]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />

              </div>

              <div className="grid max-h-72 grid-cols-2 gap-2.5 overflow-y-auto">

                {loadingPlans ? (
                  <div className="col-span-2 py-8 text-center">

                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#102A56] border-t-transparent" />

                  </div>
                ) : filteredPlans.length === 0 ? (
                  <div className="col-span-2 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                    No plans available for this selection
                  </div>
                ) : (
                  filteredPlans.map((plan) => (
                    <motion.button
                      key={plan.id}
                      whileTap={{
                        scale: 0.96,
                      }}
                      onClick={() =>
                        setSelectedPlan(plan)
                      }
                      className={`relative rounded-2xl border-2 p-3.5 text-left transition-all ${
                        selectedPlan?.id === plan.id
                          ? 'border-[#102A56] bg-[#102A56]/5'
                          : 'border-slate-200 bg-white hover:border-[#102A56]/30 dark:border-slate-700 dark:bg-slate-900'
                      }`}
                    >

                      {selectedPlan?.id ===
                        plan.id && (
                        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#F28C28]">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}

                      <p className="pr-6 text-sm font-bold text-slate-800 dark:text-slate-100">
                        {plan.name}
                      </p>

                      <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                        {plan.description}
                      </p>

                      <p className="mt-1.5 text-lg font-bold text-[#102A56] dark:text-slate-100">
                        {formatCurrency(
                          plan.price,
                        )}
                      </p>

                    </motion.button>
                  ))
                )}

              </div>

            </motion.div>

            {/* AMOUNT */}

            {selectedPlan && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 16,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
              >

                <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Amount
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                    ₦
                  </span>

                  <input
                    type="text"
                    readOnly
                    value={selectedPlan.price.toFixed(2)}
                    className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 py-3.5 pl-8 pr-4 font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-400"
                  />

                </div>

              </motion.div>
            )}

          </>
        )}

      </div>

      {/* PURCHASE BAR */}

      <AnimatePresence>
        {canProceed && (
          <motion.div
            initial={{
              opacity: 0,
              y: 40,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 40,
            }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 320,
            }}
            className="fixed bottom-20 left-0 right-0 z-40 px-5 sm:left-1/2 sm:max-w-md sm:-translate-x-1/2"
          >

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">

              <div className="mb-3 flex items-center justify-between">

                <div>

                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Total Amount
                  </p>

                  <p className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(
                      selectedPlan?.price || 0,
                    )}
                  </p>

                </div>

                <div className="max-w-[50%] text-right">

                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Plan
                  </p>

                  <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {selectedPlan?.name}
                  </p>

                </div>

              </div>

              <Button
                fullWidth
                size="lg"
                onClick={handleProceed}
              >
                Purchase Data
                <ArrowRight className="h-4 w-4" />
              </Button>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

      <PurchasePinModal
        open={showPinModal}
        onClose={closePinModal}
        amount={selectedPlan?.price || 0}
        productName={
          selectedPlan?.name || ''
        }
        pin={pin}
        setPin={setPin}
        pinError={pinError}
        stage={stage}
        onPinComplete={
          handlePinComplete
        }
      />

      <AnimatePresence>
        {receipt && (
          <ReceiptScreen
            receipt={receipt}
            onClose={() =>
              navigate('/')
            }
          />
        )}
      </AnimatePresence>

    </div>
  );
}
