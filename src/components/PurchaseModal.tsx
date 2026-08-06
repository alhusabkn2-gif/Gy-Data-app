import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Modal from './ui/Modal';
import PinInput from './ui/PinInput';
import Button from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';

interface PurchaseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  service: string;
  product?: string;
  recipient?: string;
  network?: string;
}

export default function PurchaseModal({
  open, onClose, onSuccess, amount, service, product, recipient, network,
}: PurchaseModalProps) {
  const { user, refreshUser } = useAuth();
  const [stage, setStage] = useState<'pin' | 'processing' | 'success' | 'error'>('pin');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handlePinComplete = async (val: string) => {
    if (!user) return;
    if (val !== user.purchase_pin) {
      setError('Incorrect purchase PIN');
      setPin('');
      return;
    }
    setError('');
    setStage('processing');

    if (amount > user.wallet_balance) {
      setTimeout(() => {
        setStage('error');
        setError('Insufficient wallet balance. Please fund your wallet.');
      }, 1500);
      return;
    }

    try {
      const { error: txError } = await supabase.from('transactions').insert({
        phone: user.phone,
        type: 'purchase',
        service,
        product: product || service,
        amount,
        status: 'success',
        recipient: recipient || null,
        network: network || null,
      });
      if (txError) throw txError;

      const newBalance = user.wallet_balance - amount;
      const { error: balError } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance, updated_at: new Date().toISOString() })
        .eq('phone', user.phone);
      if (balError) throw balError;

      await refreshUser();
      setTimeout(() => setStage('success'), 1200);
    } catch {
      setTimeout(() => {
        setStage('error');
        setError('Transaction failed. Please try again.');
      }, 1500);
    }
  };

  const handleClose = () => {
    setStage('pin');
    setPin('');
    setError('');
    onClose();
  };

  const handleSuccessClose = () => {
    handleClose();
    onSuccess();
  };

  return (
    <Modal open={open} onClose={handleClose} size="sm">
      <AnimatePresence mode="wait">
        {stage === 'pin' && (
          <motion.div key="pin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <div className="w-16 h-16 rounded-3xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-1">Enter Purchase PIN</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Confirm payment of <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(amount)}</span> for {product || service}
            </p>
            <PinInput length={4} value={pin} onChange={setPin} onComplete={handlePinComplete} error={!!error} />
            {error && <p className="text-sm text-error-500 mt-3">{error}</p>}
          </motion.div>
        )}

        {stage === 'processing' && (
          <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
            <Loader2 className="w-16 h-16 text-primary-600 dark:text-primary-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-1">Processing...</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Please wait while we complete your transaction</p>
          </motion.div>
        )}

        {stage === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 150 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-success-500/30"
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-1">Transaction Successful!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {formatCurrency(amount)} has been deducted from your wallet
            </p>
            <Button fullWidth onClick={handleSuccessClose}>Done</Button>
          </motion.div>
        )}

        {stage === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-error-400 to-error-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-error-500/30">
              <XCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-1">Transaction Failed</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{error}</p>
            <Button fullWidth variant="secondary" onClick={handleClose}>Close</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
