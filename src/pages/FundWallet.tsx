import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Copy,
  Check,
  Wallet,
  Upload,
} from 'lucide-react';

import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
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

const PALMPAY_ACCOUNT = '9550627002';
const PALMPAY_BANK = 'PalmPay';
const PALMPAY_NAME = 'Abdurrahman Yahaya Ibrahim';

export default function FundWallet() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(PALMPAY_ACCOUNT);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      alert('Unable to copy account number.');
    }
  };

  const handleSubmit = async () => {
    const numericAmount = Number.parseFloat(amount);

    if (!Number.isFinite(numericAmount) || numericAmount < 100) {
      alert('Minimum funding amount is ₦100.');
      return;
    }

    if (!user?.phone) {
      alert('Please login again and try again.');
      return;
    }

    if (!reference.trim()) {
      alert('Please enter your payment reference.');
      return;
    }

    if (!receipt) {
      alert('Please upload your payment receipt.');
      return;
    }

    setLoading(true);

    try {
      /*
       * Manual funding request.
       *
       * NOTE:
       * This requires the backend endpoint:
       * POST /api/manual-funding/create
       */

      const formData = new FormData();

      formData.append('amount', String(numericAmount));
      formData.append('phone', user.phone);
      formData.append('reference', reference.trim());
      formData.append('bank', PALMPAY_BANK);
      formData.append('accountNumber', PALMPAY_ACCOUNT);
      formData.append('accountName', PALMPAY_NAME);
      formData.append('receipt', receipt);

      const apiUrl = import.meta.env.VITE_API_URL || '';

      const response = await fetch(
        `${apiUrl}/api/manual-funding/create`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ||
            'Unable to submit funding request.'
        );
      }

      alert(
        'Funding request submitted successfully. Please wait for admin approval.'
      );

      navigate('/');
    } catch (error) {
      console.error('Manual funding error:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Funding request failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-5 pt-10 pb-28">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <PageHeader
        title="Fund Wallet"
        subtitle="Add money to your wallet manually"
      />

      {/* Current Balance */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-5 mb-5 bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 shadow-xl"
      >
        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>

          <div>
            <p className="text-white/50 text-xs">
              Current Balance
            </p>

            <p className="text-white text-2xl font-bold">
              {formatCurrency(user?.wallet_balance || 0)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* PalmPay Account */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 mb-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-400">
              Transfer money to
            </p>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              PalmPay
            </h2>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
            Manual Funding
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
            <div>
              <p className="text-[11px] text-slate-400">
                Account Number
              </p>

              <p className="font-bold text-slate-900 dark:text-white tracking-wider">
                {PALMPAY_ACCOUNT}
              </p>
            </div>

            <button
              type="button"
              onClick={copyAccount}
              className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
            <p className="text-[11px] text-slate-400">
              Account Name
            </p>

            <p className="font-semibold text-slate-900 dark:text-white">
              {PALMPAY_NAME}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
            <p className="text-[11px] text-slate-400">
              Bank
            </p>

            <p className="font-semibold text-slate-900 dark:text-white">
              {PALMPAY_BANK}
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10">
          <p className="text-xs leading-5 text-amber-700 dark:text-amber-300">
            Make the transfer first, then enter the amount and
            payment reference below and upload your receipt.
          </p>
        </div>
      </div>

      {/* Amount */}
      <div className="mb-5">
        <Input
          label="Amount"
          prefix="₦"
          type="tel"
          inputMode="numeric"
          placeholder="0.00"
          value={amount}
          onChange={(e) =>
            setAmount(
              e.target.value.replace(/[^0-9.]/g, '')
            )
          }
        />

        <div className="flex flex-wrap gap-2 mt-3">
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAmount(String(value))}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              ₦{value.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Reference */}
      <div className="mb-5">
        <Input
          label="Payment Reference"
          type="text"
          placeholder="Enter transfer reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </div>

      {/* Receipt */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Payment Receipt
        </label>

        <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {receipt
                ? receipt.name
                : 'Upload payment receipt'}
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Screenshot or image of your transfer
            </p>
          </div>

          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              setReceipt(e.target.files?.[0] || null)
            }
          />
        </label>
      </div>

      {/* Submit */}
      <Button
        fullWidth
        size="lg"
        loading={loading}
        disabled={
          !amount ||
          Number.parseFloat(amount) < 100 ||
          !reference.trim() ||
          !receipt
        }
        onClick={handleSubmit}
      >
        Submit Funding Request
      </Button>

      <p className="text-center text-xs text-slate-400 mt-3">
        Minimum funding amount is ₦100. Your wallet will be
        credited after admin approval.
      </p>
    </div>
  );
}
