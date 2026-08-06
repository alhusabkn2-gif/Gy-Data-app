import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, Check } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { AnimatedCard } from '../components/ui/NetworkLogo';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];
const PAYMENT_METHODS = [
  { id: 'card', name: 'Debit Card', desc: 'Visa, Mastercard, Verve' },
  { id: 'transfer', name: 'Bank Transfer', desc: 'Pay via bank transfer' },
  { id: 'ussd', name: 'USSD', desc: 'Dial code to pay' },
];

export default function FundWallet() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFund = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 100) return;

    setLoading(true);
    try {
      const { error: txError } = await supabase.from('transactions').insert({
        phone: user!.phone,
        type: 'funding',
        service: 'wallet_funding',
        product: 'Wallet Funding',
        amount: amt,
        status: 'success',
      });
      if (txError) throw txError;

      const newBalance = (user?.wallet_balance || 0) + amt;
      const { error: balError } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance, updated_at: new Date().toISOString() })
        .eq('phone', user!.phone);
      if (balError) throw balError;

      await refreshUser();
      setSuccess(true);
    } catch {
      alert('Funding failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-slate-50 dark:bg-slate-950">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 150 }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center mb-6 shadow-2xl shadow-success-500/30"
        >
          <Check className="w-12 h-12 text-white" />
        </motion.div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-2">Wallet Funded!</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-center">
          {formatCurrency(parseFloat(amount))} has been added to your wallet
        </p>
        <Button fullWidth size="lg" onClick={() => navigate('/')} className="max-w-xs">Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 px-5 pt-12">
      <PageHeader title="Fund Wallet" subtitle="Add money to your wallet" />

      <AnimatedCard delay={0.05} className="mb-6">
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-primary-900 to-primary-800 p-5 overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs">Current Balance</p>
              <p className="text-white text-2xl font-bold font-display">{formatCurrency(user?.wallet_balance || 0)}</p>
            </div>
          </div>
        </div>
      </AnimatedCard>

      <div className="mb-5">
        <Input
          label="Amount"
          prefix="₦"
          type="tel"
          inputMode="numeric"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
          autoFocus
        />
        <div className="flex gap-2 mt-3 flex-wrap">
          {QUICK_AMOUNTS.map(amt => (
            <button
              key={amt}
              onClick={() => setAmount(String(amt))}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              ₦{amt.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Payment Method</label>
        <div className="space-y-2.5">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${
                method === m.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex-1 text-left">
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{m.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{m.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                method === m.id ? 'border-primary-500 bg-primary-500' : 'border-slate-300 dark:border-slate-600'
              }`}>
                {method === m.id && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <Button
        fullWidth
        size="lg"
        onClick={handleFund}
        loading={loading}
        disabled={!amount || parseFloat(amount) < 100}
      >
        Fund Wallet with {amount ? formatCurrency(parseFloat(amount)) : '₦0'}
      </Button>
      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3">Minimum funding amount is ₦100</p>
    </div>
  );
}
