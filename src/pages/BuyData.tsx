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

  // ==========================================
  // FETCH DATA PLANS
  // ==========================================

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoadingPlans(true);

    try {
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
          error
        );
        setPlans([]);
        return;
      }

      if (data) {
        setPlans(data as DataPlan[]);
      }
    } finally {
      setLoadingPlans(false);
    }
  };

  // ==========================================
  // FILTER PLANS
  // ==========================================

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

  // ==========================================
  // VALIDATION
  // ==========================================

  const cleanRecipient = phone.replace(
    /\D/g,
    ''
  );

  const canProceed =
    !!selectedNetwork &&
    cleanRecipient.length === 11 &&
    !!selectedPlan;

  // ==========================================
  // USE MY NUMBER
  // ==========================================

  const handleUseMyNumber = () => {
    if (!user?.phone) {
      return;
    }

    const number = user.phone
      .replace(/\D/g, '')
      .slice(-11);

    setPhone(number);
  };

  // ==========================================
  // START PURCHASE
  // ==========================================

  const handleProceed = () => {
    if (!selectedPlan) {
      return;
    }

    if (!selectedNetwork) {
      return;
    }

    const recipient = phone.replace(
      /\D/g,
      ''
    );

    if (recipient.length !== 11) {
      return;
    }

    /*
     * IMPORTANT:
     *
     * We DO NOT deduct wallet here.
     * We DO NOT insert a transaction here.
     * We DO NOT verify the purchase PIN here.
     *
     * Everything is sent to:
     *
     * POST /api/purchase
     *
     * through usePurchase().
     */

    startPurchase({
      service: 'data',
      product: selectedPlan.name,
      amount: Number(selectedPlan.price),
      recipient,
      network: selectedNetwork,
      metadata: {
        category: selectedPlan.category,
        plan_id: selectedPlan.id,
        description:
          selectedPlan.description,
      },
      productCashbackPercent:
        selectedPlan.cashback_percent,
    });
  };

  return (
    <div className="min-h-screen pb-32 bg-slate-50 dark:bg-slate-950">

      {/* ==========================================
          HEADER
      =========================================== */}

      <div
        className="
          relative
          bg-gradient-to-br
          from-primary-600
          via-primary-700
          to-primary-900
          dark:from-primary-800
          dark:via-primary-900
          dark:to-slate-950
          px-5
          pt-10
          pb-24
          overflow-hidden
        "
      >

        <div
          className="
            absolute
            top-0
            right-0
            w-64
            h-64
            bg-white/5
            rounded-full
            blur-3xl
            -translate-y-1/3
            translate-x-1/3
          "
        />

        <div
          className="
            absolute
            bottom-0
            left-0
            w-48
            h-48
            bg-accent-500/10
            rounded-full
            blur-3xl
            translate-y-1/2
            -translate-x-1/4
          "
        />

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
          className="
            relative
            flex
            items-center
            gap-3
          "
        >

          <button
            onClick={() => navigate(-1)}
            className="
              w-10
              h-10
              rounded-2xl
              bg-white/10
              backdrop-blur-md
              flex
              items-center
              justify-center
              hover:bg-white/20
              active:scale-90
              transition-all
              ring-1
              ring-white/10
            "
          >
            <ChevronLeft
              className="
                w-5
                h-5
                text-white
              "
            />
          </button>

          <div className="flex-1">

            <h1
              className="
                text-xl
                font-bold
                font-display
                text-white
              "
            >
              Buy Data
            </h1>

            <p
              className="
                text-white/60
                text-xs
              "
            >
              Purchase data bundles
            </p>

          </div>

          <div
            className="
              w-10
              h-10
              rounded-2xl
              bg-white/10
              backdrop-blur-md
              flex
              items-center
              justify-center
              ring-1
              ring-white/10
            "
          >
            <Smartphone
              className="
                w-5
                h-5
                text-white
              "
            />
          </div>

        </motion.div>

        {/* BALANCE */}

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
          className="
            relative
            mt-5
            flex
            items-center
            gap-3
            px-4
            py-3
            rounded-2xl
            bg-white/10
            backdrop-blur-md
            ring-1
            ring-white/10
          "
        >

          <div
            className="
              w-10
              h-10
              rounded-xl
              bg-white/10
              flex
              items-center
              justify-center
            "
          >
            <Wallet
              className="
                w-5
                h-5
                text-white
              "
            />
          </div>

          <div>

            <p
              className="
                text-white/50
                text-[10px]
              "
            >
              Wallet Balance
            </p>

            <p
              className="
                text-white
                font-bold
                text-lg
              "
            >
              {formatCurrency(
                Number(
                  user?.wallet_balance || 0
                )
              )}
            </p>

          </div>

        </motion.div>

      </div>

      {/* ==========================================
          MAIN CONTENT
      =========================================== */}

      <div
        className="
          relative
          -mt-14
          px-5
          space-y-5
        "
      >

        {/* ==========================================
            NETWORK
        =========================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="card-premium p-4"
        >

          <label
            className="
              block
              text-sm
              font-medium
              text-slate-700
              dark:text-slate-300
              mb-2.5
            "
          >
            Select Network
          </label>

          <div
            className="
              grid
              grid-cols-4
              gap-2
            "
          >

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
                className={`
                  py-3
                  rounded-xl
                  flex
                  flex-col
                  items-center
                  justify-center
                  gap-1
                  transition-all
                  ${
                    selectedNetwork ===
                    network.id
                      ? 'bg-primary-50 dark:bg-primary-500/10 ring-2 ring-primary-500'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
                  }
                `}
              >

                <NetworkLogo
                  network={network.id}
                  size="sm"
                />

                <span
                  className="
                    text-[10px]
                    font-medium
                    text-slate-600
                    dark:text-slate-400
                  "
                >
                  {network.name}
                </span>

              </motion.button>
            ))}

          </div>

        </motion.div>

        {selectedNetwork && (
          <>

            {/* ======================================
                PHONE
            ======================================= */}

            <motion.div
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="card-premium p-4"
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                  mb-2.5
                "
              >

                <label
                  className="
                    block
                    text-sm
                    font-medium
                    text-slate-700
                    dark:text-slate-300
                  "
                >
                  Phone Number
                </label>

                <button
                  onClick={
                    handleUseMyNumber
                  }
                  className="
                    text-xs
                    font-semibold
                    text-primary-600
                    dark:text-primary-400
                    flex
                    items-center
                    gap-1
                  "
                >
                  <Sparkles
                    className="
                      w-3
                      h-3
                    "
                  />
                  Use My Number
                </button>

              </div>

              <div className="relative">

                <span
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                    text-sm
                    font-medium
                    pointer-events-none
                  "
                >
                  +234
                </span>

                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="8012345678"
                  value={phone}
                  maxLength={11}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                        .replace(
                          /[^0-9]/g,
                          ''
                        )
                        .slice(0, 11)
                    )
                  }
                  className="
                    w-full
                    pl-12
                    pr-4
                    py-3.5
                    rounded-2xl
                    bg-slate-50
                    dark:bg-slate-800/50
                    border
                    border-slate-200
                    dark:border-slate-700
                    text-slate-900
                    dark:text-slate-100
                    focus:outline-none
                    focus:ring-2
                    focus:ring-primary-500
                    focus:border-transparent
                  "
                />

              </div>

              {phone.length > 0 &&
                phone.length !== 11 && (
                  <p
                    className="
                      text-xs
                      text-amber-500
                      mt-2
                    "
                  >
                    Enter 11 digits
                  </p>
                )}

            </motion.div>

            {/* ======================================
                CATEGORY
            ======================================= */}

            <motion.div
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="card-premium p-4"
            >

              <label
                className="
                  block
                  text-sm
                  font-medium
                  text-slate-700
                  dark:text-slate-300
                  mb-2.5
                "
              >
                Data Category
              </label>

              <div
                className="
                  grid
                  grid-cols-4
                  gap-2
                "
              >

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
                    className={`
                      py-2.5
                      rounded-xl
                      text-xs
                      font-bold
                      transition-all
                      ${
                        category === cat
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }
                    `}
                  >
                    {cat}
                  </motion.button>
                ))}

              </div>

            </motion.div>

            {/* ======================================
                PLANS
            ======================================= */}

            <motion.div
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="card-premium p-4"
            >

              <label
                className="
                  block
                  text-sm
                  font-medium
                  text-slate-700
                  dark:text-slate-300
                  mb-2.5
                "
              >
                Select Data Plan
              </label>

              <div
                className="
                  relative
                  mb-3
                "
              >

                <Search
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    w-4
                    h-4
                    text-slate-400
                  "
                />

                <input
                  type="text"
                  placeholder="Search plans..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  className="
                    w-full
                    pl-11
                    pr-4
                    py-3
                    rounded-2xl
                    bg-slate-50
                    dark:bg-slate-800/50
                    border
                    border-slate-200
                    dark:border-slate-700
                    text-slate-900
                    dark:text-slate-100
                    text-sm
                    focus:outline-none
                    focus:ring-2
                    focus:ring-primary-500
                  "
                />

              </div>

              <div
                className="
                  grid
                  grid-cols-2
                  gap-2.5
                  max-h-72
                  overflow-y-auto
                "
              >

                {loadingPlans ? (

                  <div
                    className="
                      col-span-2
                      text-center
                      py-8
                    "
                  >
                    <div
                      className="
                        w-6
                        h-6
                        border-2
                        border-primary-500
                        border-t-transparent
                        rounded-full
                        mx-auto
                        animate-spin
                      "
                    />
                  </div>

                ) : filteredPlans.length === 0 ? (

                  <div
                    className="
                      col-span-2
                      text-center
                      py-8
                      text-sm
                      text-slate-400
                    "
                  >
                    No plans available for
                    this selection
                  </div>

                ) : (

                  filteredPlans.map(
                    (plan) => (
                      <motion.button
                        key={plan.id}
                        whileTap={{
                          scale: 0.96,
                        }}
                        onClick={() =>
                          setSelectedPlan(
                            plan
                          )
                        }
                        className={`
                          relative
                          p-3.5
                          rounded-2xl
                          border-2
                          transition-all
                          text-left
                          ${
                            selectedPlan?.id ===
                            plan.id
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                          }
                        `}
                      >

                        {selectedPlan?.id ===
                          plan.id && (
                          <div
                            className="
                              absolute
                              top-2
                              right-2
                              w-5
                              h-5
                              rounded-full
                              bg-primary-500
                              flex
                              items-center
                              justify-center
                            "
                          >
                            <Check
                              className="
                                w-3
                                h-3
                                text-white
                              "
                            />
                          </div>
                        )}

                        <p
                          className="
                            font-bold
                            text-slate-800
                            dark:text-slate-100
                            text-sm
                            pr-6
                          "
                        >
                          {plan.name}
                        </p>

                        <p
                          className="
                            text-[11px]
                            text-slate-400
                            mt-0.5
                          "
                        >
                          {plan.description}
                        </p>

                        <p
                          className="
                            text-lg
                            font-bold
                            text-primary-600
                            dark:text-primary-400
                            mt-1.5
                          "
                        >
                          {formatCurrency(
                            plan.price
                          )}
                        </p>

                      </motion.button>
                    )
                  )

                )}

              </div>

            </motion.div>

            {/* ======================================
                AMOUNT
            ======================================= */}

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
                className="card-premium p-4"
              >

                <label
                  className="
                    block
                    text-sm
                    font-medium
                    text-slate-700
                    dark:text-slate-300
                    mb-2.5
                  "
                >
                  Amount
                </label>

                <div className="relative">

                  <span
                    className="
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-slate-400
                      text-sm
                      font-medium
                    "
                  >
                    ₦
                  </span>

                  <input
                    type="text"
                    readOnly
                    value={Number(
                      selectedPlan.price
                    ).toFixed(2)}
                    className="
                      w-full
                      pl-8
                      pr-4
                      py-3.5
                      rounded-2xl
                      bg-slate-100
                      dark:bg-slate-800/30
                      border
                      border-slate-200
                      dark:border-slate-700
                      text-slate-500
                      dark:text-slate-400
                      font-semibold
                    "
                  />

                </div>

              </motion.div>
            )}

          </>
        )}

      </div>

      {/* ==========================================
          PURCHASE BAR
      =========================================== */}

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
            className="
              fixed
              bottom-20
              left-0
              right-0
              px-5
              z-40
              sm:max-w-md
              sm:left-1/2
              sm:-translate-x-1/2
            "
          >

            <div
              className="
                card-premium
                p-4
                shadow-2xl
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                  mb-3
                "
              >

                <div>

                  <p
                    className="
                      text-xs
                      text-slate-400
                    "
                  >
                    Total Amount
                  </p>

                  <p
                    className="
                      text-xl
                      font-bold
                      text-slate-900
                      dark:text-white
                      font-display
                    "
                  >
                    {formatCurrency(
                      selectedPlan?.price ||
                        0
                    )}
                  </p>

                </div>

                <div
                  className="
                    text-right
                    max-w-[50%]
                  "
                >

                  <p
                    className="
                      text-xs
                      text-slate-400
                    "
                  >
                    Plan
                  </p>

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-slate-700
                      dark:text-slate-200
                      truncate
                    "
                  >
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

                <ArrowRight
                  className="
                    w-4
                    h-4
                  "
                />
              </Button>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          PURCHASE PIN
      =========================================== */}

      <PurchasePinModal
        open={showPinModal}
        onClose={closePinModal}
        amount={
          selectedPlan?.price || 0
        }
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

      {/* ==========================================
          RECEIPT
      =========================================== */}

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
