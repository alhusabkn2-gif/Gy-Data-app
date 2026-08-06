import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Check, ArrowRight } from 'lucide-react';
import ServiceHeader from '../../components/ServiceHeader';
import Button from '../../components/ui/Button';
import ReceiptScreen, { PurchasePinModal } from '../../components/ReceiptScreen';
import { usePurchase } from '../../hooks/usePurchase';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';

const ISPS = [
  { id: 'SPECTRANET', name: 'Spectranet' },
  { id: 'SMILE', name: 'Smile' },
  { id: 'SWIFT', name: 'Swift' },
];

interface InternetPlan {
  id: string;
  name: string;
  price: number;
  network: string;
  description: string;
}

export default function Internet() {
  const navigate = useNavigate();
  const purchase = usePurchase();
  const [isp, setIsp] = useState('');
  const [accountId, setAccountId] = useState('');
  const [plans, setPlans] = useState<InternetPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<InternetPlan | null>(null);

  useEffect(() => {
    if (!isp) return;
    supabase.from('products').select('*').eq('service', 'internet').eq('network', isp).eq('is_active', true).order('price', { ascending: true }).then(({ data }) => {
      if (data) setPlans(data as InternetPlan[]);
      else setPlans([]);
      setSelectedPlan(null);
    });
  }, [isp]);

  const canProceed = isp && accountId.length >= 4 && !!selectedPlan;

  const handleProceed = () => {
    if (!canProceed || !selectedPlan) return;
    purchase.startPurchase({
      service: 'internet', product: selectedPlan.name, amount: selectedPlan.price,
      recipient: accountId, network: isp,
    });
  };

  return (
    <div className="min-h-screen pb-32 bg-slate-50 dark:bg-slate-950">
      <ServiceHeader title="Internet" subtitle="Buy internet plans" icon={Wifi} />

      <div className="px-5 -mt-12 relative z-10 space-y-5">
        {/* ISP Selection */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Select ISP</label>
          <div className="grid grid-cols-3 gap-2.5">
            {ISPS.map((p) => (
              <motion.button key={p.id} whileTap={{ scale: 0.92 }} onClick={() => setIsp(p.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${isp === p.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-300'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${isp === p.id ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{p.name.slice(0, 2)}</div>
                <span className={`text-[10px] font-medium ${isp === p.id ? 'text-primary-700 dark:text-primary-300' : 'text-slate-600 dark:text-slate-400'}`}>{p.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {isp && (
          <>
            {/* Account ID */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Account / User ID</label>
              <input type="text" placeholder="Enter your account ID" value={accountId}
                onChange={(e) => setAccountId(e.target.value.slice(0, 20))}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
            </motion.div>

            {/* Plans */}
            {accountId && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Available Plans</label>
                {plans.length === 0 ? (
                  <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto animate-spin" /></div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {plans.map((plan) => (
                      <motion.button key={plan.id} whileTap={{ scale: 0.98 }} onClick={() => setSelectedPlan(plan)}
                        className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${selectedPlan?.id === plan.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-300'}`}>
                        {selectedPlan?.id === plan.id && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                        <div className="pr-6">
                          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{plan.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{plan.description}</p>
                        </div>
                        <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{formatCurrency(plan.price)}</p>
                      </motion.button>
                    ))}
                  </div>
                )}
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
                  <p className="text-xl font-bold text-slate-900 dark:text-white font-display">{formatCurrency(selectedPlan?.price || 0)}</p>
                </div>
                <div className="text-right max-w-[50%]">
                  <p className="text-xs text-slate-400 dark:text-slate-500">Plan</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{selectedPlan?.name}</p>
                </div>
              </div>
              <Button fullWidth size="lg" onClick={handleProceed}>Purchase Plan <ArrowRight className="w-4 h-4" /></Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PurchasePinModal open={purchase.showPinModal} onClose={purchase.closePinModal} amount={selectedPlan?.price || 0} productName={selectedPlan?.name || ''}
        pin={purchase.pin} setPin={purchase.setPin} pinError={purchase.pinError} stage={purchase.stage} onPinComplete={purchase.handlePinComplete} />

      <AnimatePresence>
        {purchase.receipt && <ReceiptScreen receipt={purchase.receipt} onClose={() => navigate('/')} />}
      </AnimatePresence>
    </div>
  );
}
