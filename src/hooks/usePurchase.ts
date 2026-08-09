import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
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

  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [stage, setStage] = useState<'pin' | 'processing' | 'error'>('pin');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [pendingParams, setPendingParams] =
    useState<PurchaseParams | null>(null);

  const startPurchase = (params: PurchaseParams) => {
    setPendingParams(params);
    setStage('pin');
    setPin('');
    setPinError('');
    setShowPinModal(true);
  };

  const handlePinComplete = async (val: string) => {
    if (!user || !pendingParams) return;

    setPinError('');
    setStage('processing');

    try {
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
          purchase_pin: val,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Purchase failed');
      }

      const {
        transaction,
        newBalance,
        prevBalance,
        cashbackEarned,
      } = result;

      await refreshUser();

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
          ...(pendingParams.metadata
            ? Object.entries(pendingParams.metadata)
                .filter(([key]) => key !== 'generated_pin')
                .map(([key, value]) => ({
                  label: key
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (char) => char.toUpperCase()),
                  value: String(value),
                }))
            : []),
          ...(pendingParams.generatedPin
            ? [
                {
                  label: 'Generated PIN',
                  value: pendingParams.generatedPin,
                },
              ]
            : []),
        ],
      });

      setTimeout(() => {
        setShowPinModal(false);
        setPin('');
        setStage('pin');
      }, 1000);
    } catch (error) {
      console.error('Purchase error:', error);

      setStage('error');
      setPinError(
        error instanceof Error
          ? error.message
          : 'Transaction failed. Please try again.'
      );
      setPin('');
    }
  };

  const closePinModal = () => {
    setShowPinModal(false);
    setStage('pin');
    setPin('');
    setPinError('');
    setPendingParams(null);
  };

  const closeReceipt = () => {
    setReceipt(null);
    setPendingParams(null);
  };

  return {
    showPinModal,
    pin,
    setPin,
    pinError,
    stage,
    receipt,
    startPurchase,
    handlePinComplete,
    closePinModal,
    closeReceipt,
  };
} 
