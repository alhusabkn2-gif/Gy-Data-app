import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, CheckCircle2, Copy, Download, Share2, Sparkles, X,
} from 'lucide-react';
import NetworkLogo from './ui/NetworkLogo';
import Button from './ui/Button';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { useState } from 'react';

export interface ReceiptData {
  reference: string;
  network: string;
  phone: string;
  productName: string;
  amount: number;
  prevBalance: number;
  newBalance: number;
  date: string;
  title: string;
  subtitle: string;
  extraRows?: { label: string; value: string }[];
  generatedPin?: string;
  cashbackEarned?: number;
}

export default function ReceiptScreen({
  receipt,
  onClose,
}: {
  receipt: ReceiptData;
  onClose: () => void;
}) {
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  const copyRef = () => {
    navigator.clipboard?.writeText(receipt.reference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const shareReceipt = async () => {
    const text = `GY DATA Receipt\nReference: ${receipt.reference}\nNetwork: ${receipt.network}\nPhone: ${receipt.phone}\n${receipt.extraRows?.map((r) => `${r.label}: ${r.value}`).join('\n') || ''}\nProduct: ${receipt.productName}\nAmount: ${formatCurrency(receipt.amount)}\nDate: ${formatDateTime(receipt.date)}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'GY DATA Receipt', text }); } catch {}
    } else {
      navigator.clipboard?.writeText(text);
    }
  };

  const downloadReceipt = () => {
    const text = `GY DATA - TRANSACTION RECEIPT\n\nReference: ${receipt.reference}\nNetwork: ${receipt.network}\nPhone: ${receipt.phone}\n${receipt.extraRows?.map((r) => `${r.label}: ${r.value}`).join('\n') || ''}\nProduct: ${receipt.productName}\nAmount Paid: ${formatCurrency(receipt.amount)}\nPrevious Balance: ${formatCurrency(receipt.prevBalance)}\nNew Balance: ${formatCurrency(receipt.newBalance)}\nDate: ${formatDateTime(receipt.date)}\n\nThank you for using GY DATA.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GYDATA-${receipt.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-md bg-slate-50 dark:bg-slate-950 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[95vh]"
      >
        {/* Success header */}
        <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-800 dark:via-primary-900 dark:to-slate-950 px-6 pt-10 pb-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], x: [0, (i - 2) * 30], y: [0, -50 - i * 8] }}
              transition={{ duration: 1.5, delay: 0.3 + i * 0.1, repeat: Infinity, repeatDelay: 2 }}
              className="absolute left-1/2 top-1/3"
            >
              <Sparkles className="w-3.5 h-3.5 text-white/60" />
            </motion.div>
          ))}

          <div className="relative text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 150, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-success-500/40"
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-500/20 backdrop-blur-sm ring-1 ring-success-400/30 mb-3"
            >
              <Check className="w-3 h-3 text-success-300" />
              <span className="text-[10px] font-bold text-success-300 uppercase tracking-wider">Successful</span>
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="text-2xl font-bold font-display text-white">
              {receipt.title}
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="text-white/60 text-sm mt-1">
              {receipt.subtitle}
            </motion.p>
          </div>
        </div>

        {/* Receipt details */}
        <div className="px-6 py-6 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <NetworkLogo network={receipt.network} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{receipt.network}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">+234 {receipt.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Product</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{receipt.productName}</p>
            </div>
          </motion.div>

          {receipt.generatedPin && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72 }}
              className="relative p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-500/10 dark:to-accent-500/10 border border-primary-200 dark:border-primary-500/20 shadow-sm"
            >
              <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-2">Your Generated PIN</p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-wider break-all">{receipt.generatedPin}</p>
                <button
                  onClick={() => { if (receipt.generatedPin) navigator.clipboard?.writeText(receipt.generatedPin); setCopiedPin(true); setTimeout(() => setCopiedPin(false), 2000); }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 active:scale-95 transition-all"
                >
                  {copiedPin ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            <ReceiptRow label="Amount Paid" value={formatCurrency(receipt.amount)} valueClass="text-slate-900 dark:text-white font-bold" />
            {receipt.extraRows?.map((row) => (
              <ReceiptRow key={row.label} label={row.label} value={row.value} />
            ))}
            <ReceiptRow label="Wallet Balance Before" value={formatCurrency(receipt.prevBalance)} />
            <ReceiptRow label="Wallet Balance After" value={formatCurrency(receipt.newBalance)} valueClass="text-success-600 dark:text-success-400 font-bold" />
            {receipt.cashbackEarned && receipt.cashbackEarned > 0 ? (
              <div className="px-4 py-3.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border-t border-amber-100 dark:border-amber-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Cashback Earned</p>
                  </div>
                  <motion.p
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.8 }}
                    className="text-lg font-bold text-amber-600 dark:text-amber-400 font-display"
                  >
                    +{formatCurrency(receipt.cashbackEarned)}
                  </motion.p>
                </div>
              </div>
            ) : null}
            <div className="px-4 py-3.5 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-400 dark:text-slate-500">Reference</p>
                <button onClick={copyRef} className="flex items-center gap-1.5 text-xs font-mono text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
                  {receipt.reference}
                  {copiedRef ? <Check className="w-3 h-3 text-success-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 dark:text-slate-500">Date & Time</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">{formatDateTime(receipt.date)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
            className="space-y-2.5"
          >
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="secondary" size="md" onClick={downloadReceipt}>
                <Download className="w-4 h-4" /> Download
              </Button>
              <Button variant="secondary" size="md" onClick={shareReceipt}>
                <Share2 className="w-4 h-4" /> Share
              </Button>
            </div>
            <Button fullWidth size="lg" onClick={onClose}>
              Done
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function ReceiptRow({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
      <p className={`text-sm text-slate-600 dark:text-slate-300 ${valueClass}`}>{value}</p>
    </div>
  );
}

export function PurchasePinModal({
  open,
  onClose,
  amount,
  productName,
  pin,
  setPin,
  pinError,
  stage,
  onPinComplete,
}: {
  open: boolean;
  onClose: () => void;
  amount: number;
  productName: string;
  pin: string;
  setPin: (v: string) => void;
  pinError: string;
  stage: 'pin' | 'processing' | 'error';
  onPinComplete: (v: string) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={stage === 'processing' ? undefined : onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
          >
            {stage !== 'processing' && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            )}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {stage === 'pin' && (
                  <motion.div key="pin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                    <div className="w-16 h-16 rounded-3xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                      <ShieldCheckIcon />
                    </div>
                    <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-1">Enter Purchase PIN</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                      Confirm payment of <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(amount)}</span> for {productName}
                    </p>
                    <PinInput length={4} value={pin} onChange={setPin} onComplete={onPinComplete} error={!!pinError} />
                    {pinError && <p className="text-sm text-error-500 mt-3">{pinError}</p>}
                  </motion.div>
                )}
                {stage === 'processing' && (
                  <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                    <LoaderIcon />
                    <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-1">Processing...</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Purchasing {productName}</p>
                  </motion.div>
                )}
                {stage === 'error' && (
                  <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-error-400 to-error-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-error-500/30">
                      <X className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-1">Transaction Failed</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{pinError}</p>
                    <Button fullWidth variant="secondary" onClick={onClose}>Close</Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import PinInput from './ui/PinInput';
import { ShieldCheck, Loader2, Sparkles } from 'lucide-react';

function ShieldCheckIcon() {
  return <ShieldCheck className="w-8 h-8 text-primary-600 dark:text-primary-400" />;
}
function LoaderIcon() {
  return <Loader2 className="w-16 h-16 text-primary-600 dark:text-primary-400 mx-auto mb-4 animate-spin" />;
}
