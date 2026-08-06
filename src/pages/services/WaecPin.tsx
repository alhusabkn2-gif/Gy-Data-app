import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Minus, Plus, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import ServiceHeader from '../../components/ServiceHeader';
import Button from '../../components/ui/Button';
import ReceiptScreen, { PurchasePinModal } from '../../components/ReceiptScreen';
import { usePurchase } from '../../hooks/usePurchase';
import { useCashback } from '../../hooks/useCashback';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';

const WAEC_UNIT_PRICE = 1500;

export default function WaecPin() {
  const navigate = useNavigate();
  const purchase = usePurchase();
  const { calculateCashback } = useCashback();
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(WAEC_UNIT_PRICE);
  const [unitCashback, setUnitCashback] = useState(0);

  useEffect(() => {
    supabase.from('products').select('*').eq('service', 'waec').eq('is_active', true).limit(1).then(({ data }) => {
      if (data && data[0]) {
        setUnitPrice(parseFloat(data[0].price));
        setUnitCashback(parseFloat(data[0].cashback_percent) || 0);
      }
    });
  }, []);

  const total = unitPrice * quantity;
  const canProceed = quantity > 0;

  const generatePin = () => {
    const part1 = Math.random().toString(36).slice(2, 6).toUpperCase();
    const part2 = Math.random().toString(36).slice(2, 6).toUpperCase();
    const part3 = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${part1}-${part2}-${part3}`;
  };

  const cashbackAmount = calculateCashback(total, 'waec', unitCashback);

  const handleProceed = () => {
    if (!canProceed) return;
    purchase.startPurchase({
      service: 'waec', product: `WAEC Result Checker x${quantity}`, amount: total,
      recipient: 'WAEC', network: 'WAEC', metadata: { quantity },
      generatedPin: generatePin(),
      productCashbackPercent: unitCashback,
    });
  };

  return (
    <div className="min-h-screen pb-32 bg-slate-50 dark:bg-slate-950">
      <ServiceHeader title="WAEC PIN" subtitle="Buy WAEC result checker pins" icon={GraduationCap} />

      <div className="px-5 -mt-12 relative z-10 space-y-5">
        {/* Hero card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="relative rounded-3xl bg-gradient-to-br from-emerald-400 to-green-600 p-5 overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-white font-bold font-display text-lg">WAEC Result Checker</p>
              <p className="text-white/70 text-sm">{formatCurrency(unitPrice)} per PIN</p>
            </div>
          </div>
        </motion.div>

        {/* Quantity Selector */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Quantity</label>
          <div className="card-premium p-5">
            <div className="flex items-center justify-between">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors">
                <Minus className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </motion.button>
              <div className="text-center">
                <p className="text-4xl font-bold font-display text-slate-900 dark:text-white">{quantity}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PIN{quantity > 1 ? 's' : ''}</p>
              </div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setQuantity(Math.min(10, quantity + 1))}
                className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors">
                <Plus className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Price Summary */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card-premium p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">Unit Price</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(unitPrice)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">Quantity</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{quantity}</p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Total</p>
                <p className="text-xl font-bold text-primary-600 dark:text-primary-400 font-display">{formatCurrency(total)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info note */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 px-1">
          <ShieldCheck className="w-3.5 h-3.5 text-primary-500 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
            Your WAEC PIN(s) will be generated instantly after purchase and displayed on the receipt screen. Keep your PIN safe.
          </p>
        </motion.div>
      </div>

      <AnimatePresence>
        {canProceed && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-20 left-0 right-0 px-5 z-40 sm:max-w-md sm:left-1/2 sm:-translate-x-1/2">
            <div className="card-premium p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Total Amount</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white font-display">{formatCurrency(total)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 dark:text-slate-500">PINs</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{quantity}x WAEC</p>
                </div>
              </div>
              {cashbackAmount > 0 && (
                <div className="flex items-center gap-1.5 mb-2.5 px-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Earn {formatCurrency(cashbackAmount)} cashback</p>
                </div>
              )}
              <Button fullWidth size="lg" onClick={handleProceed}>Purchase WAEC PIN <ArrowRight className="w-4 h-4" /></Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PurchasePinModal open={purchase.showPinModal} onClose={purchase.closePinModal} amount={total} productName={`WAEC PIN x${quantity}`}
        pin={purchase.pin} setPin={purchase.setPin} pinError={purchase.pinError} stage={purchase.stage} onPinComplete={purchase.handlePinComplete} />

      <AnimatePresence>
        {purchase.receipt && <ReceiptScreen receipt={purchase.receipt} onClose={() => navigate('/')} />}
      </AnimatePresence>
    </div>
  );
}
