import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet,
  Check,
  ArrowLeft,
  Copy,
  Upload,
  ShieldCheck,
} from 'lucide-react';

import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { AnimatedCard } from '../components/ui/NetworkLogo';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';

const QUICK_AMOUNTS = [
  500,
  1000,
  2000,
  5000,
  10000,
  20000,
];

// ─── PalmPay Account ───
const PALMPAY_BANK_NAME = 'PalmPay';
const PALMPAY_ACCOUNT_NAME = 'Abdurrahman Yahaya Ibrahim';
const PALMPAY_ACCOUNT_NUMBER = '9550627002';

export default function FundWallet() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [amount, setAmount] = useState('');
  const [senderName, setSenderName] = useState('');
  const [reference, setReference] = useState('');
  const [proof, setProof] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // ─── Copy PalmPay account number ───
  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(
        PALMPAY_ACCOUNT_NUMBER
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      alert('Unable to copy account number.');
    }
  };

  // ─── Payment proof ───
  const handleProofChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(
        'Please upload an image of your payment receipt.'
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(
        'Proof image must not be more than 5MB.'
      );
      return;
    }

    setProof(file);
  };

  // ─── Submit manual funding request ───
  const handleSubmit = async () => {
    const amt = Number.parseFloat(amount);

    if (!Number.isFinite(amt) || amt < 100) {
      alert('Minimum funding amount is ₦100.');
      return;
    }

    if (!user?.phone) {
      alert(
        'Please login again and try again.'
      );
      return;
    }

    if (!senderName.trim()) {
      alert('Please enter the sender name.');
      return;
    }

    if (!reference.trim()) {
      alert(
        'Please enter the transaction/reference number.'
      );
      return;
    }

    if (!proof) {
      alert(
        'Please upload your payment proof.'
      );
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append(
        'amount',
        String(amt)
      );

      formData.append(
        'senderName',
        senderName.trim()
      );

      formData.append(
        'reference',
        reference.trim()
      );

      formData.append(
        'paymentMethod',
        'PALMPAY'
      );

      formData.append(
        'bankName',
        PALMPAY_BANK_NAME
      );

      formData.append(
        'accountName',
        PALMPAY_ACCOUNT_NAME
      );

      formData.append(
        'accountNumber',
        PALMPAY_ACCOUNT_NUMBER
      );

      formData.append(
        'customerPhone',
        user.phone
      );

      if (user.full_name) {
        formData.append(
          'customerName',
          user.full_name
        );
      }

      if (user.email) {
        formData.append(
          'customerEmail',
          user.email
        );
      }

      formData.append(
        'proof',
        proof
      );

      const apiBaseUrl =
        import.meta.env.VITE_API_URL || '';

      const response = await fetch(
        `${apiBaseUrl}/api/manual-funding/create`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            'Unable to submit funding request.'
        );
      }

      setSuccess(true);
    } catch (error) {
      console.error(
        'Manual funding error:',
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : 'Funding request failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // ─── Success screen ───
  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-slate-50 dark:bg-slate-950">

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            damping: 12,
            stiffness: 150,
          }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center mb-6 shadow-2xl shadow-success-500/30"
        >
          <Check className="w-12 h-12 text-white" />
        </motion.div>

        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-2 text-center">
          Request Submitted!
        </h1>

        <p className="text-slate-500 dark:text-slate-400 mb-8 text-center max-w-sm">
          Your funding request has been submitted successfully.
          Your wallet will be credited after the payment is verified.
        </p>

        <Button
          fullWidth
          size="lg"
          onClick={() => navigate('/')}
          className="max-w-xs"
        >
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 px-5 pt-10">

      {/* ─── Back ─── */}
      <div className="mb-4">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* ─── Header ─── */}
      <PageHeader
        title="Fund Wallet"
        subtitle="Add money using PalmPay transfer"
      />

      {/* ─── Current Balance ─── */}
      <AnimatedCard
        delay={0.05}
        className="mb-5"
      >
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-primary-950 to-primary-900 p-5 overflow-hidden shadow-xl">

          <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative flex items-center gap-4">

            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>

            <div>
              <p className="text-white/50 text-xs">
                Current Balance
              </p>

              <p className="text-white text-2xl font-bold font-display">
                {formatCurrency(
                  user?.wallet_balance || 0
                )}
              </p>
            </div>

          </div>
        </div>
      </AnimatedCard>

      {/* ─── PalmPay Account Card ─── */}
      <div className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-primary-800 to-slate-950 p-5 shadow-xl shadow-primary-900/20">

        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-white/10 blur
