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
import ReceiptScreen, { PurchasePinModal, type ReceiptData } from '../components/ReceiptScreen';

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
  const [airtimeType, setAirtimeType] = useState<AirtimeType>('VTU');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');

  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [stage, setStage] = useState<'pin' | 'processing' | 'error'>('pin');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const numericAmount = parseFloat(amount) || 0;
  const canProceed = selectedNetwork && phone.replace(/\D/g, '').length >= 10 && numericAmount > 0;

  const handleUseMyNumber = () => {
    if (user?.phone) setPhone(user.phone.slice(-10));
  };

  const handleProceed = () => {
    if (!canProceed) return;
    setStage('pin'); setPin(''); setPinError('');
    setShowPinModal(true);
  };

  const handlePinComplete = async (val: string) => {
    if (!user) return;
    if (val !== user.purchase_pin) { setPinError('Incorrect purchase PIN'); setPin(''); return; }
    setPinError(''); setStage('processing');

    if (numericAmount > user.wallet_balance) {
      setTimeout(() => { setStage('error'); setPinError('Insufficient wallet balance. Please fund your wallet.'); }, 1200);
      return;
    }

    try {
      const recipient = phone.replace(/\D/g, '');
      const productName = `${selectedNetwork} Airtime (${airtimeType})`;
      const { data: txData, error: txError } = await supabase.from('transactions').insert({
        phone: user.phone, type: 'purchase', service: 'airtime', product: productName,
        amount: numericAmount, status: 'success', recipient, network: selectedNetwork,
        metadata: { airtime_type: airtimeType },
      }).select().single();
      if (txError) throw txError;

      const prevBalance = user.wallet_balance;
      const newBalance = prevBalance - numericAmount;
      const { error: balError } = await supabase
        .from('profiles').update({ wallet_balance: newBalance, updated_at: new Date().toISOString() }).eq('phone', user.phone);
      if (balError) throw balError;

      await refreshUser();
      setReceipt({
        reference: txData.reference, network: selectedNetwork, phone: recipient,
        productName, amount: numericAmount, prevBalance, newBalance, date: txData.created_at,
        title: 'Airtime Purchase Complete', subtitle: `${formatCurrency(numericAmount)} delivered to ${recipient}`,
        extraRows: [{ label: 'Airtime Type', value: airtimeType }],
      });
      setTimeout(() => { setShowPinModal(false); }, 1000);
    } catch {
      setTimeout(() => { setStage('error'); setPinError('Transaction failed. Please try again.'); }, 1200);
    }
  };

  const closePinModal = () => {
    setShowPinModal(false); setStage('pin'); setPin(''); setPinError('');
  };

  return (
    <div className="min-h-screen pb-32 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-800 dark:via-primary-900 dark:to-slate-950 px-5 pt-10 pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all ring-1 ring-white/10">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold font-display text-white">Buy Airtime</h1>
            <p className="text-white/60 text-xs">Top up any phone</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-1 ring-white/10">
            <Phone className="w-5 h-5 text-white" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative mt-5 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/10">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white/50 text-[10px] font-medium uppercase tracking-wider">Wallet Balance</p>
            <p className="text-white font-bold font-display text-base">{formatCurrency(user?.wallet_balance || 0)}</p>
          </div>
        </motion.div>
      </div>

      <div className="px-5 -mt-12 relative z-10 space-y-5">
        {/* Network Selection */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Select Network</label>
          <div className="grid grid-cols-4 gap-2.5">
            {NETWORKS.map((net) => (
              <motion.button key={net.id} whileTap={{ scale: 0.92 }} onClick={() => setSelectedNetwork(net.id)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-all ${selectedNetwork === net.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 shadow-md shadow-primary-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                <NetworkLogo network={net.id} size="sm" />
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{net.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {selectedNetwork && (
          <>
            {/* Phone Number */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                <button onClick={handleUseMyNumber} className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Use My Number
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-medium pointer-events-none">+234</span>
                <input type="tel" inputMode="numeric" placeholder="801 234 5678" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
              </div>
            </motion.div>

            {/* Airtime Type */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Airtime Type</label>
              <div className="grid grid-cols-2 gap-2.5">
                {AIRTIME_TYPES.map((type) => (
                  <motion.button key={type} whileTap={{ scale: 0.96 }} onClick={() => setAirtimeType(type)}
                    className={`flex items-center gap-2.5 p-3.5 rounded-2xl border-2 transition-all ${airtimeType === type ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-300'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${airtimeType === type ? 'border-primary-500 bg-primary-500' : 'border-slate-300 dark:border-slate-600'}`}>
                      {airtimeType === type && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm font-bold ${airtimeType === type ? 'text-primary-700 dark:text-primary-300' : 'text-slate-600 dark:text-slate-400'}`}>{type}</span>
                  </motion.button>
                ))}
              </div>
              <div className="flex items-start gap-2 mt-2.5 px-1">
                <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                  <span className="font-semibold">VTU</span> delivers airtime directly to the phone. <span className="font-semibold">Share &amp; Sell</span> sends via the network's transfer service.
                </p>
              </div>
            </motion.div>

            {/* Amount Input */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-medium pointer-events-none">₦</span>
                <input type="tel" inputMode="numeric" placeholder="0.00" value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, '').slice(0, 7))}
                  className="w-full pl-8 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-lg font-semibold" />
              </div>
              {/* Quick Amounts */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {QUICK_AMOUNTS.map((amt) => (
                  <motion.button key={amt} whileTap={{ scale: 0.92 }} onClick={() => setAmount(String(amt))}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all ${numericAmount === amt ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-primary-300'}`}>
                    ₦{amt.toLocaleString()}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Transaction Summary */}
            {numericAmount > 0 && phone.replace(/\D/g, '').length >= 10 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <div className="card-premium p-4 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary-500" /> Transaction Summary
                  </h3>
                  <div className="space-y-2.5">
                    <SummaryRow label="Network" value={NETWORKS.find(n => n.id === selectedNetwork)?.name || selectedNetwork} />
                    <SummaryRow label="Phone" value={`+234 ${phone}`} />
                    <SummaryRow label="Type" value={airtimeType} />
                    <SummaryRow label="Amount" value={formatCurrency(numericAmount)} />
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Total</p>
                        <p className="text-lg font-bold text-primary-600 dark:text-primary-400 font-display">{formatCurrency(numericAmount)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Sticky Purchase Bar */}
      <AnimatePresence>
        {canProceed && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-20 left-0 right-0 px-5 z-40 sm:max-w-md sm:left-1/2 sm:-translate-x-1/2">
            <div className="card-premium p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Total Amount</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white font-display">{formatCurrency(numericAmount)}</p>
                </div>
                <div className="text-right max-w-[50%]">
                  <p className="text-xs text-slate-400 dark:text-slate-500">Type</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{airtimeType}</p>
                </div>
              </div>
              <Button fullWidth size="lg" onClick={handleProceed}>Purchase Airtime <ArrowRight className="w-4 h-4" /></Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PurchasePinModal open={showPinModal} onClose={closePinModal} amount={numericAmount} productName={`${selectedNetwork} Airtime (${airtimeType})`}
        pin={pin} setPin={setPin} pinError={pinError} stage={stage} onPinComplete={handlePinComplete} />

      <AnimatePresence>
        {receipt && <ReceiptScreen receipt={receipt} onClose={() => navigate('/')} />}
      </AnimatePresence>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}
