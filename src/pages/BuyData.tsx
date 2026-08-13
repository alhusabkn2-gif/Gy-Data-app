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

  /*
   * Load active data products from Supabase.
   *
   * IMPORTANT:
   * This is ONLY for displaying products/prices.
   * The actual purchase is NOT performed here.
   */
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

      if (data) {
        setPlans(data as DataPlan[]);
      }
    } catch (error) {
      console.error('Unexpected error loading plans:', error);
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  /*
   * Filter products according to:
   * Network
   * Category
   * Search
   */
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (
        selectedNetwork &&
        plan.network?.toUpperCase() !== selectedNetwork.toUpperCase()
      ) {
        return false;
      }

      if (
        category &&
        plan.category?.toLowerCase() !== category.toLowerCase()
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
  }, [plans, selectedNetwork, category, search]);

  const canProceed =
    !!selectedNetwork &&
    phone.replace(/\D/g, '').length >= 10 &&
    !!selectedPlan;

  /*
   * Use the authenticated user's phone number.
   */
  const handleUseMyNumber = () => {
    if (!user?.phone) return;

    const digits = user.phone.replace(/\D/g, '');

    if (digits.startsWith('234') && digits.length >= 12) {
      setPhone(digits.slice(3, 13));
    } else {
      setPhone(digits.slice(-10));
    }
  };

  /*
   * Open PIN modal.
   */
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

  /*
   * Convert any Nigerian phone format to 080...
   */
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

  /*
   * ACTUAL DATA PURCHASE
   *
   * IMPORTANT:
   *
   * Frontend DOES NOT:
   * - deduct wallet
   * - create successful transaction
   * - call ClubKonnect directly
   *
   * Backend /api/purchase handles:
   * - purchase PIN verification
   * - wallet validation
   * - ClubKonnect API request
   * - transaction creation
   * - wallet deduction
   *
   * This prevents the frontend from saying "successful"
   * when ClubKonnect has not actually delivered the data.
   */
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

    /*
     * This is only a quick client-side check.
     *
     * The backend MUST perform the final balance check.
     */
    const currentBalance = Number(user.wallet_balance || 0);

    if (amount > currentBalance) {
      setStage('error');
      setPinError(
        'Insufficient wallet balance. Please fund your wallet.'
      );
      return;
    }

    try {
      /*
       * VITE_API_URL:
       *
       * If VITE_API_URL is configured, use it.
       *
       * Otherwise use the same origin.
       *
       * Since Render serves frontend + backend together,
       * empty string is normally correct.
       */
      const apiBaseUrl =
        String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

      const endpoint = `${apiBaseUrl}/api/purchase`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          /*
           * Authenticated account.
           */
          phone: user.phone,

          /*
           * Service.
           */
          service: 'data',

          /*
           * Product information.
           */
          product: selectedPlan.name,
          product_id: selectedPlan.id,

          /*
           * Amount shown to the customer.
           *
           * Backend MUST NOT blindly trust this amount.
           * It should verify the product price from database.
           */
          amount,

          /*
           * Actual recipient.
           */
          recipient,

          /*
           * Selected network.
           */
          network: selectedNetwork,

          /*
           * Category.
           */
          category: selectedPlan.category,

          /*
           * Purchase PIN.
           */
          purchase_pin: purchasePin,

          /*
           * Extra information for backend.
           */
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

      /*
       * Anything other than a successful backend response
       * is treated as failed.
       */
      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ||
            `Data purchase failed (${response.status}). Please try again.`
        );
      }

      /*
       * Backend must return the completed transaction.
       */
      const transaction = result.transaction;

      if (!transaction?.reference) {
        throw new Error(
          'Purchase completed without a transaction reference.'
        );
      }

      /*
       * Backend has already:
       *
       * 1. Verified PIN
       * 2. Checked balance
       * 3. Called ClubKonnect
       * 4. Confirmed success
       * 5. Deducted wallet
       * 6. Recorded transaction
       *
       * Therefore frontend only synchronizes its displayed balance.
       */
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

      /*
       * Show receipt only AFTER backend says success.
       */
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

      /*
       * Close PIN modal after successful purchase.
       */
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
    <div className="min-h-screen pb-32 bg-slate-50 dark:bg-slate-950">

      {/* HEADER */}
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-800 dark:via-primary-900 dark:to-slate-950 px-5 pt-10 pb-24 overflow-hidden">

        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />

        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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

        {/* NETWORK */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">
            Select Network
          </label>

          <div className="grid grid-cols-4 gap-2.5">
            {NETWORKS.map((net) => (
              <motion.button
                key={net.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  setSelectedNetwork(net.id);
                  setSelectedPlan(null);
                }}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-all ${
                  selectedNetwork === net.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 shadow-md shadow-primary-500/10'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
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
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-2.5">

                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Phone Number
                </label>

                <button
                  onClick={handleUseMyNumber}
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
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                        .replace(/[^0-9]/g, '')
                        .slice(0, 11)
                    )
                  }
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </motion.div>

            {/* CATEGORY */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">
                Data Category
              </label>

              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <motion.button
                    key={cat}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      setCategory(cat);
                      setSelectedPlan(null);
                    }}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                      category === cat
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {cat}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* PLAN SEARCH */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
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
                  onChange={(e) =>
                    setSearch(e.target.value)
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
                    No plans available for this selection
                  </div>
                ) : (
                  filteredPlans.map((plan) => (
                    <motion.button
                      key={plan.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() =>
                        setSelectedPlan(plan)
                      }
                      className={`relative p-3.5 rounded-2xl border-2 transition-all text-left ${
                        selectedPlan?.id === plan.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-300'
                      }`}
                    >
                      {selectedPlan?.id === plan.id && (
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
                        {formatCurrency(plan.price)}
                      </p>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>

            {/* AMOUNT */}
            {selectedPlan && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
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
                    value={selectedPlan.price.toFixed(2)}
                    className="w-full pl-8 pr-4 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold cursor-not-allowed"
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
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
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

      {/* PURCHASE PIN */}
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
