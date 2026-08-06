import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCashback } from './useCashback';
import { supabase } from '../lib/supabase';
import type { ReceiptData } from '../components/ReceiptScreen';

interface PurchaseParams {
  service: string;
  product: string;
  amount: number;
  recipient: string;
  network: string;
  metadata?: Record<string, unknown>;
  generatedPin?: string;
  productCashbackPercent?: number;
}

export function usePurchase() {
  const { user, refreshUser } = useAuth();
  const { creditCashback, getCashbackPercent } = useCashback();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [stage, setStage] = useState<'pin' | 'processing' | 'error'>('pin');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [pendingParams, setPendingParams] = useState<PurchaseParams | null>(null);

  const startPurchase = (params: PurchaseParams) => {
    setPendingParams(params);
    setStage('pin');
    setPin('');
    setPinError('');
    setShowPinModal(true);
  };

  const handlePinComplete = async (val: string) => {
    if (!user || !pendingParams) return;
    if (val !== user.purchase_pin) {
      setPinError('Incorrect purchase PIN');
      setPin('');
      return;
    }
    setPinError('');
    setStage('processing');

    if (pendingParams.amount > user.wallet_balance) {
      setTimeout(() => {
        setStage('error');
        setPinError('Insufficient wallet balance. Please fund your wallet.');
      }, 1200);
      return;
    }

    try {
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert({
          phone: user.phone,
          type: 'purchase',
          service: pendingParams.service,
          product: pendingParams.product,
          amount: pendingParams.amount,
          status: 'success',
          recipient: pendingParams.recipient,
          network: pendingParams.network,
          metadata: { ...pendingParams.metadata, ...(pendingParams.generatedPin ? { generated_pin: pendingParams.generatedPin } : {}) },
        })
        .select()
        .single();
      if (txError) throw txError;

      const prevBalance = user.wallet_balance;
      const newBalance = prevBalance - pendingParams.amount;
      const { error: balError } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance, updated_at: new Date().toISOString() })
        .eq('phone', user.phone);
      if (balError) throw balError;

      await refreshUser();

      let cashbackEarned = 0;
      const cashbackPercent = getCashbackPercent(pendingParams.service, pendingParams.productCashbackPercent);
      if (cashbackPercent > 0) {
        const { cashbackAmount } = await creditCashback({
          transactionId: txData.id,
          transactionReference: txData.reference,
          service: pendingParams.service,
          product: pendingParams.product,
          transactionAmount: pendingParams.amount,
          cashbackPercent,
        });
        cashbackEarned = cashbackAmount;
      }

      setReceipt({
        reference: txData.reference,
        network: pendingParams.network,
        phone: pendingParams.recipient,
        productName: pendingParams.product,
        amount: pendingParams.amount,
        prevBalance,
        newBalance,
        date: txData.created_at,
        title: 'Transaction Successful',
        subtitle: `${pendingParams.product} completed`,
        cashbackEarned,
        extraRows: [
          ...(pendingParams.metadata ? Object.entries(pendingParams.metadata).filter(([k]) => k !== 'generated_pin').map(([k, v]) => ({ label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: String(v) })) : []),
          ...(pendingParams.generatedPin ? [{ label: 'Generated PIN', value: pendingParams.generatedPin }] : []),
        ],
      });
      setTimeout(() => setShowPinModal(false), 1000);
    } catch {
      setTimeout(() => {
        setStage('error');
        setPinError('Transaction failed. Please try again.');
      }, 1200);
    }
  };

  const closePinModal = () => {
    setShowPinModal(false);
    setStage('pin');
    setPin('');
    setPinError('');
  };

  const closeReceipt = () => setReceipt(null);

  return {
    showPinModal, pin, setPin, pinError, stage, receipt,
    startPurchase, handlePinComplete, closePinModal, closeReceipt,
  };
}
