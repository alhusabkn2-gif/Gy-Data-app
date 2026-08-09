import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCashback } from './useCashback';
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
  const { getCashbackPercent } = useCashback();
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
      // Call backend endpoint to process purchase
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: user.phone,
          service: pendingParams.service,
          product: pendingParams.product,
          amount: pendingParams.amount,
          recipient: pendingParams.recipient,
          network: pendingParams.network,
          metadata: pendingParams.metadata,
          generatedPin: pendingParams.generatedPin,
          cashbackPercent: getCashbackPercent(pendingParams.service, pendingParams.productCashbackPercent),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Purchase failed');
      }

      const {
        transaction,
        newBalance,
        prevBalance,
        cashbackEarned,
      } = await response.json();

      // Refresh user data from backend
      await refreshUser();

      // Build receipt
      setReceipt({
        reference: transaction.reference,
        network: pendingParams.network,
        phone: pendingParams.recipient,
        productName: pendingParams.product,
        amount: pendingParams.amount,
        prevBalance,
        newBalance,
        date: transaction.created_at,
        title: 'Transaction Successful',
        subtitle: `${pendingParams.product} completed`,
        cashbackEarned,
        extraRows: [
          ...(pendingParams.metadata ? Object.entries(pendingParams.metadata).filter(([k]) => k !== 'generated_pin').map(([k, v]) => ({ label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: String(v) })) : []),
          ...(pendingParams.generatedPin ? [{ label: 'Generated PIN', value: pendingParams.generatedPin }] : []),
        ],
      });
      setTimeout(() => setShowPinModal(false), 1000);
    } catch (err) {
      console.error('Purchase error:', err);
      setTimeout(() => {
        setStage('error');
        setPinError(err instanceof Error ? err.message : 'Transaction failed. Please try again.');
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
