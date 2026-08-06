import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowRight, Loader2, UserCheck, Sparkles } from 'lucide-react';
import ServiceHeader from '../../components/ServiceHeader';
import Button from '../../components/ui/Button';
import ReceiptScreen, { PurchasePinModal } from '../../components/ReceiptScreen';
import { usePurchase } from '../../hooks/usePurchase';
import { useCashback } from '../../hooks/useCashback';
import { BETTING_PLATFORMS } from '../../lib/constants';
import { formatCurrency } from '../../lib/utils';

export default function Betting() {
  const navigate = useNavigate();
  const purchase = usePurchase();
  const { calculateCashback } = useCashback();
  const [provider, setProvider] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [amount, setAmount] = useState('');

  const numericAmount = parseFloat(amount) || 0;
  const canVerify = provider && customerId.length >= 4;
  const canProceed = canVerify && verified && numericAmount > 0;

  const verifyCustomer = () => {
    if (!canVerify) return;
    setVerifying(true); setVerified(false);
    setTimeout(() => { setCustomerName('Verified User'); setVerified(true); setVerifying(false); }, 1500);
  };

  const cashbackAmount = calculateCashback(numericAmount, 'betting');

  const handleProceed = () => {
    if (!canProceed) return;
    purchase.startPurchase({
      service: 'betting', product: `${provider} Fund`, amount: numericAmount,
      recipient: customerId, network: provider, metadata: { customer_name: customerName },
    });
  };

  return (
    <div className="min-h-screen pb-32 bg-slate-50 dark:bg-slate-950">
      <ServiceHeader title="Betting" subtitle="Fund your betting account" icon={Trophy} />

      <div className="px-5 -mt-12 relative z-10 space-y-5">
        {/* Provider */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Select Provider</label>
          <div className="grid grid-cols-2 gap-2.5">
            {BETTING_PLATFORMS.map((p) => (
              <motion.button key={p.id} whileTap={{ scale: 0.96 }} onClick={() => { setProvider(p.id); setVerified(false); setCustomerName(''); }}
                className={`flex items-center gap-2.5 p-3.5 rounded-2xl border-2 transition-all ${provider === p.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-300'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${provider === p.id ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{p.name.slice(0, 2)}</div>
                <span className={`text-sm font-semibold ${provider === p.id ? 'text-primary-700 dark:text-primary-300' : 'text-slate-600 dark:text-slate-400'}`}>{p.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {provider && (
          <>
            {/* Customer ID */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Customer / User ID</label>
              <input type="text" placeholder="Enter your betting ID" value={customerId}
                onChange={(e) => { setCustomerId(e.target.value.slice(0, 20)); setVerified(false); setCustomerName(''); }}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
            </motion.div>

            {/* Verify */}
            {canVerify && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <Button variant="secondary" fullWidth onClick={verifyCustomer} disabled={verifying || verified}>
                  {verifying ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : verified ? <><UserCheck className="w-4 h-4" /> {customerName}</> : 'Verify Account'}
                </Button>
              </motion.div>
            )}

            {/* Amount */}
            {verified && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₦</span>
                  <input type="tel" inputMode="numeric" placeholder="0.00" value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, '').slice(0, 7))}
                    className="w-full pl-8 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-lg font-semibold" />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[500, 1000, 2000, 5000, 10000, 20000].map((amt) => (
                    <motion.button key={amt} whileTap={{ scale: 0.92 }} onClick={() => setAmount(String(amt))}
                      className={`py-2.5 rounded-xl text-sm font-bold transition-all ${numericAmount === amt ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-primary-300'}`}>
                      ₦{amt.toLocaleString()}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

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
                  <p className="text-xs text-slate-400 dark:text-slate-500">Account</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{customerId}</p>
                </div>
              </div>
              {cashbackAmount > 0 && (
                <div className="flex items-center gap-1.5 mb-2.5 px-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Earn {formatCurrency(cashbackAmount)} cashback</p>
                </div>
              )}
              <Button fullWidth size="lg" onClick={handleProceed}>Fund Account <ArrowRight className="w-4 h-4" /></Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PurchasePinModal open={purchase.showPinModal} onClose={purchase.closePinModal} amount={numericAmount} productName={`${provider} Fund`}
        pin={purchase.pin} setPin={purchase.setPin} pinError={purchase.pinError} stage={purchase.stage} onPinComplete={purchase.handlePinComplete} />

      <AnimatePresence>
        {purchase.receipt && <ReceiptScreen receipt={purchase.receipt} onClose={() => navigate('/')} />}
      </AnimatePresence>
    </div>
  );
}
