import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Tv, Check, ArrowRight, Loader2, UserCheck, Sparkles } from 'lucide-react';
import ServiceHeader from '../../components/ServiceHeader';
import Button from '../../components/ui/Button';
import ReceiptScreen, { PurchasePinModal } from '../../components/ReceiptScreen';
import { usePurchase } from '../../hooks/usePurchase';
import { useCashback } from '../../hooks/useCashback';
import { CABLE_PROVIDERS } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';

interface Bouquet {
  id: string;
  name: string;
  price: number;
  network: string;
  description: string;
}

export default function CableTV() {
  const navigate = useNavigate();
  const purchase = usePurchase();
  const { calculateCashback } = useCashback();
  const [provider, setProvider] = useState('');
  const [smartCard, setSmartCard] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [bouquets, setBouquets] = useState<Bouquet[]>([]);
  const [selectedBouquet, setSelectedBouquet] = useState<Bouquet | null>(null);

  useEffect(() => {
    if (!provider) return;
    fetchBouquets();
  }, [provider]);

  const fetchBouquets = async () => {
    const { data } = await supabase.from('products').select('*').eq('service', 'cable').eq('network', provider).eq('is_active', true).order('price', { ascending: true });
    if (data) setBouquets(data as Bouquet[]);
  };

  const canVerify = provider && smartCard.length >= 8;
  const canProceed = canVerify && verified && selectedBouquet;

  const verifyCustomer = () => {
    if (!canVerify) return;
    setVerifying(true); setVerified(false);
    setTimeout(() => { setCustomerName('Verified Customer'); setVerified(true); setVerifying(false); }, 1500);
  };

  const cashbackAmount = calculateCashback(selectedBouquet?.price || 0, 'cable', selectedBouquet?.cashback_percent);

  const handleProceed = () => {
    if (!canProceed || !selectedBouquet) return;
    purchase.startPurchase({
      service: 'cable', product: selectedBouquet.name, amount: selectedBouquet.price,
      recipient: smartCard, network: provider, metadata: { customer_name: customerName },
      productCashbackPercent: selectedBouquet.cashback_percent,
    });
  };

  return (
    <div className="min-h-screen pb-32 bg-slate-50 dark:bg-slate-950">
      <ServiceHeader title="Cable TV" subtitle="Pay for cable subscriptions" icon={Tv} />

      <div className="px-5 -mt-12 relative z-10 space-y-5">
        {/* Provider */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Select Provider</label>
          <div className="grid grid-cols-3 gap-2.5">
            {CABLE_PROVIDERS.map((p) => (
              <motion.button key={p.id} whileTap={{ scale: 0.92 }} onClick={() => { setProvider(p.id); setVerified(false); setCustomerName(''); setSelectedBouquet(null); }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${provider === p.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-300'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${provider === p.id ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{p.name.slice(0, 2)}</div>
                <span className={`text-[10px] font-medium ${provider === p.id ? 'text-primary-700 dark:text-primary-300' : 'text-slate-600 dark:text-slate-400'}`}>{p.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {provider && (
          <>
            {/* Smart Card */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Smart Card / IUC Number</label>
              <input type="tel" inputMode="numeric" placeholder="1234567890" value={smartCard}
                onChange={(e) => { setSmartCard(e.target.value.replace(/[^0-9]/g, '').slice(0, 13)); setVerified(false); setCustomerName(''); }}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
            </motion.div>

            {/* Verify */}
            {canVerify && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <Button variant="secondary" fullWidth onClick={verifyCustomer} disabled={verifying || verified}>
                  {verifying ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : verified ? <><UserCheck className="w-4 h-4" /> {customerName}</> : 'Verify Customer'}
                </Button>
              </motion.div>
            )}

            {/* Bouquet Selection */}
            {verified && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Select Bouquet</label>
                {bouquets.length === 0 ? (
                  <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto animate-spin" /></div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {bouquets.map((b) => (
                      <motion.button key={b.id} whileTap={{ scale: 0.98 }} onClick={() => setSelectedBouquet(b)}
                        className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${selectedBouquet?.id === b.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-300'}`}>
                        {selectedBouquet?.id === b.id && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                        <div className="pr-6">
                          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{b.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{b.description}</p>
                        </div>
                        <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{formatCurrency(b.price)}</p>
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
                  <p className="text-xl font-bold text-slate-900 dark:text-white font-display">{formatCurrency(selectedBouquet?.price || 0)}</p>
                </div>
                <div className="text-right max-w-[50%]">
                  <p className="text-xs text-slate-400 dark:text-slate-500">Bouquet</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{selectedBouquet?.name}</p>
                </div>
              </div>
              {cashbackAmount > 0 && (
                <div className="flex items-center gap-1.5 mb-2.5 px-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Earn {formatCurrency(cashbackAmount)} cashback</p>
                </div>
              )}
              <Button fullWidth size="lg" onClick={handleProceed}>Subscribe <ArrowRight className="w-4 h-4" /></Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PurchasePinModal open={purchase.showPinModal} onClose={purchase.closePinModal} amount={selectedBouquet?.price || 0} productName={selectedBouquet?.name || ''}
        pin={purchase.pin} setPin={purchase.setPin} pinError={purchase.pinError} stage={purchase.stage} onPinComplete={purchase.handlePinComplete} />

      <AnimatePresence>
        {purchase.receipt && <ReceiptScreen receipt={purchase.receipt} onClose={() => navigate('/')} />}
      </AnimatePresence>
    </div>
  );
}
