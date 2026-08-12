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
import { usePurchase } from '../hooks/usePurchase';

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

export default function BuyData() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const {
    showPinModal,
    pin,
    setPin,
    pinError,
    stage,
    receipt,
    startPurchase,
    handlePinComplete,
    closePinModal,
    closeReceipt,
  } = usePurchase();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoadingPlans(true);

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('service', 'data')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      console.error(
        'Data plans error:',
        error.message
      );
    }

    if (data) {
      setPlans(data as DataPlan[]);
    }

    setLoadingPlans(false);
  };

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (
        selectedNetwork &&
        plan.network !== selectedNetwork
      ) {
        return false;
      }

      if (
        category &&
        plan.category !== category
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

  const normalizedPhone = phone
    .replace(/\D/g, '')
    .slice(0, 11);

  const canProceed =
    !!selectedNetwork &&
    normalizedPhone.length === 11 &&
    !!selectedPlan;

  const handleUseMyNumber = () => {
    if (!user?.phone) return;

    const normalized = String(user.phone)
      .replace(/\D/g, '');

    if (normalized.startsWith('234')) {
      setPhone(
        `0${normalized.slice(3)}`.slice(0, 11)
      );
      return;
    }

    setPhone(
      normalized.startsWith('0')
        ? normalized.slice(0, 11)
        : `0${normalized}`.slice(0, 11)
    );
  };

  const handleProceed = () => {
    if (!canProceed || !selectedPlan) {
      return;
    }

    startPurchase({
      service: 'data',
      product: selectedPlan.name,
      amount: selectedPlan.price,
      recipient: normalizedPhone,
      network: selectedNetwork,
      metadata: {
        category,
        data_plan_id: selectedPlan.id,
      },
      productCashbackPercent:
        selectedPlan.cashback_percent,
    });
  };

  return (
    <div className="min-h-screen pb-32 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-800 dark:via-primary-900 dark:to-slate-950 px-5 pt-10 pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />

        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

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
            className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all ring-1 ring-white/10"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex-1">
            <h1 className="text-xl font-bold font-display text-white">
              Buy Data
            </h1>

            <p className="text-white/60 text-xs">
              Purchase data bundles
            </p>
          </div>

          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-1 ring-white/10">
            <Smartphone className="w-5 h-5 text-white" />
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
          className="relative mt-5 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/10"
        >
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>

          <div>
            <p className="text-white/50 text-[10px] font-medium uppercase tracking-wider">
              Wallet Balance
            </p>

            <p className="text-white font-bold font-display text-base">
              {formatCurrency(
                user?.wallet_balance || 0
              )}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="px-5 -mt-12 relative z-10 space-y-5">
        {/* Network Selection */}
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
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">
            Select Network
          </label>

          <div className="grid grid-cols-4 gap-2.5">
            {NETWORKS.map((network) => (
              <motion.button
                key={network.id}
                whileTap={{
                  scale: 0.92,
                }}
                onClick={() => {
                  setSelectedNetwork(
                    network.id
                  );
                  setSelectedPlan(null);
                }}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-all ${
                  selectedNetwork === network.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 shadow-md shadow-primary-500/10'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <NetworkLogo
                  network={network.id}
                  size="sm"
                />

                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                  {network.name}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {selectedNetwork && (
          <>
            {/* Phone Number */}
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
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Phone Number
                </label>

                <button
                  type="button"
                  onClick={
                    handleUseMyNumber
                  }
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Use My Number
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-medium pointer-events-none">
                  +234
                </span>

                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="801 234 5678"
                  value={phone}
                  maxLength={11}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                        .replace(/\D/g, '')
                        .slice(0, 11)
                    )
                  }
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <p className="text-[11px] text-slate-400 mt-2">
                Enter an 11-digit Nigerian phone
                number.
              </p>

              {normalizedPhone.length > 0 &&
                normalizedPhone.length !== 11 && (
                  <p className="text-[11px] text-red-500 mt-1">
                    Phone number must contain 11
                    digits.
                  </p>
                )}
            </motion.div>

            {/* Data Category */}
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">
                Data Category
              </label>

              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((item) => (
                  <motion.button
                    key={item}
                    whileTap={{
                      scale: 0.92,
                    }}
                    onClick={() => {
                      setCategory(item);
                      setSelectedPlan(null);
                    }}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                      category === item
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {item}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Plan Selector */}
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">
                Select Data Plan
              </label>

              <div className="relative mb-3">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <input
                  type="text"
                  placeholder="Search plans..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 max-h-72 overflow-y-auto">
                {loadingPlans ? (
                  <div className="col-span-2 text-center py-8">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto animate-spin" />
                  </div>
                ) : filteredPlans.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-sm text-slate-400 dark:text-slate-500">
                    No plans available for this
                    selection
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
                      className={`relative p-3.5 rounded-2xl border-2 transition-all text-left ${
                        selectedPlan?.id ===
                        plan.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-300'
                      }`}
                    >
                      {selectedPlan?.id ===
                        plan.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}

                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm pr-6">
                        {plan.name}
                      </p>

                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {plan.description}
                      </p>

                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400 mt-1.5">
                        {formatCurrency(
                          plan.price
                        )}
                      </p>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>

            {/* Amount */}
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">
                  Amount
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                    ₦
                  </span>

                  <input
                    type="text"
                    readOnly
                    value={selectedPlan.price.toFixed(
                      2
                    )}
                    className="w-full pl-8 pr-4 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold cursor-not-allowed"
                  />
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Sticky Purchase Bar */}
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
            className="fixed bottom-20 left-0 right-0 px-5 z-40 sm:max-w-md sm:left-1/2 sm:-translate-x-1/2"
          >
            <div className="card-premium p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Total Amount
                  </p>

                  <p className="text-xl font-bold text-slate-900 dark:text-white font-display">
                    {formatCurrency(
                      selectedPlan?.price || 0
                    )}
                  </p>
                </div>

                <div className="text-right max-w-[50%]">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Plan
                  </p>

                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
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
                <ArrowRight className="w-4 h-4" />
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
        onPinComplete={handlePinComplete}
      />

      <AnimatePresence>
        {receipt && (
          <ReceiptScreen
            receipt={receipt}
            onClose={() => {
              closeReceipt();
              navigate('/');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
