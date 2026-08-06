import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smartphone, Zap, Tv, GraduationCap, BookOpen, Trophy, Smile, Wifi, Check } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PurchaseModal from '../components/PurchaseModal';
import NetworkLogo from '../components/ui/NetworkLogo';
import { AnimatedCard } from '../components/ui/NetworkLogo';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';
import { NETWORKS, ELECTRICITY_PROVIDERS, CABLE_PROVIDERS, BETTING_PLATFORMS } from '../lib/constants';

const SERVICE_META: Record<string, { title: string; subtitle: string; icon: any; color: string }> = {
  data: { title: 'Buy Data', subtitle: 'Purchase data bundles', icon: Smartphone, color: 'from-blue-500 to-blue-700' },
  airtime: { title: 'Buy Airtime', subtitle: 'Top up any phone', icon: Smartphone, color: 'from-cyan-500 to-cyan-700' },
  electricity: { title: 'Electricity', subtitle: 'Pay prepaid bills', icon: Zap, color: 'from-amber-400 to-orange-500' },
  cable: { title: 'Cable TV', subtitle: 'Pay for cable subscriptions', icon: Tv, color: 'from-sky-400 to-blue-600' },
  waec: { title: 'WAEC', subtitle: 'Buy WAEC result checker pins', icon: GraduationCap, color: 'from-emerald-400 to-green-600' },
  jamb: { title: 'JAMB', subtitle: 'Buy JAMB UTME pins', icon: BookOpen, color: 'from-rose-400 to-red-600' },
  betting: { title: 'Betting', subtitle: 'Fund your betting account', icon: Trophy, color: 'from-violet-400 to-purple-600' },
  smile: { title: 'Smile Data', subtitle: 'Buy Smile data bundles', icon: Smile, color: 'from-cyan-400 to-teal-600' },
  internet: { title: 'Internet', subtitle: 'Buy internet plans', icon: Wifi, color: 'from-indigo-400 to-blue-600' },
};

export default function ServicePage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const meta = SERVICE_META[serviceId || ''] || SERVICE_META.data;
  const Icon = meta.icon;

  const [products, setProducts] = useState<any[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [recipient, setRecipient] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [showPurchase, setShowPurchase] = useState(false);

  useEffect(() => {
    fetchProducts();
    const nets = getNetworks();
    if (nets.length === 1) setSelectedNetwork(nets[0].id);
    else setSelectedNetwork('');
    setSelectedProduct(null);
  }, [serviceId]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('service', serviceId)
      .eq('is_active', true)
      .order('price', { ascending: true });
    if (data) setProducts(data);
  };

  const getNetworks = () => {
    if (serviceId === 'data' || serviceId === 'airtime') return NETWORKS.map(n => ({ id: n.id, name: n.name }));
    if (serviceId === 'electricity') return ELECTRICITY_PROVIDERS;
    if (serviceId === 'cable') return CABLE_PROVIDERS;
    if (serviceId === 'betting') return BETTING_PLATFORMS;
    if (serviceId === 'smile') return [{ id: 'SMILE', name: 'Smile' }];
    if (serviceId === 'internet') return [{ id: 'SMILE', name: 'Smile' }, { id: 'SPECTRANET', name: 'Spectranet' }];
    if (serviceId === 'waec') return [{ id: 'WAEC', name: 'WAEC' }];
    if (serviceId === 'jamb') return [{ id: 'JAMB', name: 'JAMB' }];
    return [];
  };

  const networks = getNetworks();
  const filteredProducts = selectedNetwork
    ? products.filter(p => p.network === selectedNetwork)
    : products;

  const getAmount = (): number => {
    if (serviceId === 'airtime' || serviceId === 'electricity' || serviceId === 'betting') {
      return parseFloat(customAmount) || 0;
    }
    return selectedProduct?.price || 0;
  };

  const getProductLabel = (): string => {
    if (selectedProduct) return selectedProduct.name;
    if (customAmount) return `${selectedNetwork} - ${formatCurrency(parseFloat(customAmount))}`;
    return serviceId || '';
  };

  const canProceed = () => {
    if (!selectedNetwork) return false;
    if (serviceId === 'airtime' || serviceId === 'electricity' || serviceId === 'betting') {
      return parseFloat(customAmount) > 0 && (recipient || meterNumber);
    }
    if (serviceId === 'waec' || serviceId === 'jamb') {
      return selectedProduct && recipient;
    }
    return selectedProduct && recipient;
  };

  const handleProceed = () => {
    if (!canProceed()) return;
    setShowPurchase(true);
  };

  const handleSuccess = () => {
    setShowPurchase(false);
    navigate('/transactions');
  };

  const needsRecipient = serviceId !== 'electricity';
  const recipientLabel = serviceId === 'electricity' ? 'Meter Number' : serviceId === 'betting' ? 'Betting Account ID' : serviceId === 'cable' ? 'IUC/Smart Card Number' : 'Phone Number';
  const recipientPrefix = serviceId === 'electricity' || serviceId === 'cable' || serviceId === 'betting' ? undefined : '+234';

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 px-5 pt-12">
      <PageHeader title={meta.title} subtitle={meta.subtitle} />

      {/* Service Hero */}
      <AnimatedCard delay={0.05} className="mb-6">
        <div className={`relative rounded-3xl bg-gradient-to-br ${meta.color} p-5 overflow-hidden shadow-xl`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-white font-bold font-display text-lg">{meta.title}</p>
              <p className="text-white/70 text-sm">Wallet: {formatCurrency(user?.wallet_balance || 0)}</p>
            </div>
          </div>
        </div>
      </AnimatedCard>

      {/* Network Selection */}
      {networks.length > 1 && (
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Select Provider</label>
          <div className="grid grid-cols-4 gap-2.5">
            {networks.map((net) => (
              <button
                key={net.id}
                onClick={() => { setSelectedNetwork(net.id); setSelectedProduct(null); }}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-all ${
                  selectedNetwork === net.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <NetworkLogo network={net.id} size="sm" />
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate w-full text-center">{net.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}


      {/* Recipient Input */}
      {selectedNetwork && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <Input
            label={recipientLabel}
            prefix={recipientPrefix}
            type="tel"
            inputMode="numeric"
            placeholder={serviceId === 'electricity' ? '0000000000' : serviceId === 'cable' ? '1234567890' : serviceId === 'betting' ? 'Account ID' : '801 234 5678'}
            value={recipient || meterNumber}
            onChange={(e) => {
              if (needsRecipient) setRecipient(e.target.value);
              else setMeterNumber(e.target.value);
            }}
          />
        </motion.div>
      )}

      {/* Product Selection or Custom Amount */}
      {selectedNetwork && (
        <>
          {(serviceId === 'airtime' || serviceId === 'electricity' || serviceId === 'betting') ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
              <Input
                label="Amount"
                prefix="₦"
                type="tel"
                inputMode="numeric"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              />
              {(serviceId === 'airtime' || serviceId === 'betting') && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {[100, 200, 500, 1000, 2000, 5000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setCustomAmount(String(amt))}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      ₦{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Select Plan</label>
              {filteredProducts.length === 0 ? (
                <div className="card-premium p-6 text-center">
                  <p className="text-sm text-slate-400 dark:text-slate-500">No products available for this provider</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredProducts.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => setSelectedProduct(prod)}
                      className={`relative p-3.5 rounded-2xl border-2 transition-all text-left ${
                        selectedProduct?.id === prod.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-300'
                      }`}
                    >
                      {selectedProduct?.id === prod.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{prod.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{prod.description}</p>
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400 mt-1">{formatCurrency(prod.price)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Summary & Proceed */}
      {canProceed() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 left-0 right-0 px-5 z-40 sm:max-w-md sm:left-1/2 sm:-translate-x-1/2"
        >
          <div className="card-premium p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Total Amount</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white font-display">{formatCurrency(getAmount())}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 dark:text-slate-500">Product</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{getProductLabel()}</p>
              </div>
            </div>
            <Button fullWidth size="lg" onClick={handleProceed}>
              Proceed to Pay
            </Button>
          </div>
        </motion.div>
      )}

      <PurchaseModal
        open={showPurchase}
        onClose={() => setShowPurchase(false)}
        onSuccess={handleSuccess}
        amount={getAmount()}
        service={serviceId || ''}
        product={getProductLabel()}
        recipient={needsRecipient ? recipient : meterNumber}
        network={selectedNetwork}
      />
    </div>
  );
}
