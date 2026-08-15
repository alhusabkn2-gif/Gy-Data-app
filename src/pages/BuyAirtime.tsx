import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Phone, Check, Wallet, Sparkles, ArrowRight, Info,
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

const AIRTIME_TYPES = ['VTU', 'Share & Sell'] as const;
type AirtimeType = (typeof AIRTIME_TYPES)[number];

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function BuyAirtime() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [airtimeType, setAirtimeType] =
    useState<AirtimeType>('VTU');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');

  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [stage, setStage] =
    useState<'pin' | 'processing' | 'error'>('pin');
  const [receipt, setReceipt] =
    useState<ReceiptData | null>(null);

  const numericAmount = parseFloat(amount) || 0;

  const canProceed =
    !!selectedNetwork &&
    phone.replace(/\D/g, '').length >= 10 &&
    numericAmount > 0;

  const handleUseMyNumber = () => {
    if (user?.phone) {
      setPhone(user.phone.slice(-10));
    }
  };

  const handleProceed = () => {
    if (!canProceed) return;

    setStage('pin');
    setPin('');
    setPinError('');
    setShowPinModal(true);
  };

  const handlePinComplete = async (val: string) => {
    if (!user) return;

    if (val !== user.purchase_pin) {
      setPinError('Incorrect purchase PIN');
      setPin('');
      return;
    }

    setPinError('');
    setStage('processing');

    if (numericAmount > user.wallet_balance) {
      setTimeout(() => {
        setStage('error');
        setPinError(
          'Insufficient wallet balance. Please fund your wallet.',
        );
      }, 1200);
      return;
    }

    try {
      const recipient = phone.replace(/\D/g, '');
      const productName =
        `${selectedNetwork} Airtime (${airtimeType})`;

      const { data: txData, error: txError } =
        await supabase
          .from('transactions')
          .insert({
            phone: user.phone,
            type: 'purchase',
            service: 'airtime',
            product: productName,
            amount: numericAmount,
            status: 'success',
            recipient,
            network: selectedNetwork,
            metadata: {
              airtime_type: airtimeType,
            },
          })
          .select()
          .single();

      if (txError) throw txError;

      const prevBalance = user.wallet_balance;
      const newBalance =
        prevBalance - numericAmount;

      const { error: balError } =
        await supabase
          .from('profiles')
          .update({
            wallet_balance: newBalance,
            updated_at:
              new Date().toISOString(),
          })
          .eq('phone', user.phone);

      if (balError) throw balError;

      await refreshUser();

      setReceipt({
        reference: txData.reference,
        network: selectedNetwork,
        phone: recipient,
        productName,
        amount: numericAmount,
        prevBalance,
        newBalance,
        date: txData.created_at,
        title: 'Airtime Purchase Complete',
        subtitle: `${formatCurrency(
          numericAmount,
        )} delivered to ${recipient}`,
        extraRows: [
          {
            label: 'Airtime Type',
            value: airtimeType,
          },
        ],
      });

      setTimeout(() => {
        setShowPinModal(false);
      }, 1000);
    } catch {
      setTimeout(() => {
        setStage('error');
        setPinError(
          'Transaction failed. Please try again.',
        );
      }, 1200);
    }
  };

  const closePinModal = () => {
    setShowPinModal(false);
    setStage('pin');
    setPin('');
    setPinError('');
  };

  return (
    <div className="min-h-screen pb-32 bg-[#F6F8FB] dark:bg-slate-950">

      {/* HEADER */}

      <div className="relative overflow-hidden bg-gradient-to-br from-[#0B2145] via-[#102A56] to-[#183867] px-5 pb-24 pt-10">

        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/3 translate-x-1/3 rounded-full bg-white/5 blur-3xl" />

        <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/4 translate-y-1/2 rounded-full bg-[#F28C28]/10 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
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
              Buy Airtime
            </h1>

            <p className="text-xs text-white/60">
              Top up any phone
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 backdrop-blur-md">
            <Phone className="h-5 w-5 text-white" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Select Network
          </label>

          <div className="grid grid-cols-4 gap-2.5">
            {NETWORKS.map((net) => (
              <motion.button
                key={net.id}
                whileTap={{ scale: 0.92 }}
                onClick={() =>
                  setSelectedNetwork(net.id)
                }
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
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
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
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
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
                        .slice(0, 11),
                    )
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:border-[#102A56] focus:outline-none focus:ring-2 focus:ring-[#102A56]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </motion.div>

            {/* AIRTIME TYPE */}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Airtime Type
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {AIRTIME_TYPES.map((type) => (
                  <motion.button
                    key={type}
                    whileTap={{ scale: 0.96 }}
                    onClick={() =>
                      setAirtimeType(type)
                    }
                    className={`flex items-center gap-2.5 rounded-2xl border-2 p-3.5 transition-all ${
                      airtimeType === type
                        ? 'border-[#102A56] bg-[#102A56]/5'
                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        airtimeType === type
                          ? 'border-[#102A56] bg-[#102A56]'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {airtimeType === type && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>

                    <span
                      className={`text-sm font-bold ${
                        airtimeType === type
                          ? 'text-[#102A56]'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {type}
                    </span>
                  </motion.button>
                ))}
              </div>

              <div className="mt-2.5 flex items-start gap-2 px-1">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

                <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                  <span className="font-semibold">
                    VTU
                  </span>{' '}
                  delivers airtime directly to the
                  phone.{' '}
                  <span className="font-semibold">
                    Share &amp; Sell
                  </span>{' '}
                  sends via the network's transfer
                  service.
                </p>
              </div>
            </motion.div>

            {/* AMOUNT */}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <label className="mb-2.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Amount
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                  ₦
                </span>

                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target.value
                        .replace(/[^0-9.]/g, '')
                        .slice(0, 7),
                    )
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-8 pr-4 text-lg font-semibold text-slate-900 placeholder-slate-400 focus:border-[#102A56] focus:outline-none focus:ring-2 focus:ring-[#102A56]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map((amt) => (
                  <motion.button
                    key={amt}
                    whileTap={{ scale: 0.92 }}
                    onClick={() =>
                      setAmount(String(amt))
                    }
                    className={`rounded-xl py-2.5 text-sm font-bold transition-all ${
                      numericAmount === amt
                        ? 'bg-[#102A56] text-white shadow-lg shadow-[#102A56]/20'
                        : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                  >
                    ₦{amt.toLocaleString()}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* SUMMARY */}

            {numericAmount > 0 &&
              phone.replace(/\D/g, '').length >=
                10 && (
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
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <h3 className="flex items-center gap-2 font-display text-sm font-bold text-slate-900 dark:text-white">
                      <Wallet className="h-4 w-4 text-[#F28C28]" />
                      Transaction Summary
                    </h3>

                    <div className="mt-3 space-y-2.5">
                      <SummaryRow
                        label="Network"
                        value={
                          NETWORKS.find(
                            (n) =>
                              n.id ===
                              selectedNetwork,
                          )?.name ||
                          selectedNetwork
                        }
                      />

                      <SummaryRow
                        label="Phone"
                        value={`+234 ${phone}`}
                      />

                      <SummaryRow
                        label="Type"
                        value={airtimeType}
                      />

                      <SummaryRow
                        label="Amount"
                        value={formatCurrency(
                          numericAmount,
                        )}
                      />

                      <div className="border-t border-slate-100 pt-2.5 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            Total
                          </p>

                          <p className="font-display text-lg font-bold text-[#102A56] dark:text-white">
                            {formatCurrency(
                              numericAmount,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
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
                  <p className="text-xs text-slate-400">
                    Total Amount
                  </p>

                  <p className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(
                      numericAmount,
                    )}
                  </p>
                </div>

                <div className="max-w-[50%] text-right">
                  <p className="text-xs text-slate-400">
                    Type
                  </p>

                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {airtimeType}
                  </p>
                </div>
              </div>

              <Button
                fullWidth
                size="lg"
                onClick={handleProceed}
              >
                Purchase Airtime
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PurchasePinModal
        open={showPinModal}
        onClose={closePinModal}
        amount={numericAmount}
        productName={`${selectedNetwork} Airtime (${airtimeType})`}
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
            onClose={() => navigate('/')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-slate-400 dark:text-slate-500">
        {label}
      </p>

      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {value}
      </p>
    </div>
  );
}
