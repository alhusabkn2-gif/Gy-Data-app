import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  Share2,
  Sparkles,
  X,
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

function cleanPhone(phone: string) {
  return phone.replace(/^(\+234|234)/, '').replace(/\s+/g, '');
}

function money(value: number) {
  return `₦${Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function drawReceiptImage(receipt: ReceiptData): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');

    const width = 1080;
    const height = 1500;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas is not supported'));
      return;
    }

    const phone = cleanPhone(receipt.phone);

    const rows = [
      ['Recipient', phone],
      ['Amount', money(receipt.amount)],
      ['Bal. Before', money(receipt.prevBalance)],
      ['Bal. After', money(receipt.newBalance)],
      ['Method', 'Wallet'],
      ['Date', formatDateTime(receipt.date)],
      ['Reference', receipt.reference],
      ...(receipt.extraRows || []),
    ];

    /*
     * BACKGROUND
     */
    ctx.fillStyle = '#f5f7fa';
    ctx.fillRect(0, 0, width, height);

    /*
     * TOP HEADER
     */
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#071d49');
    gradient.addColorStop(1, '#0b356f');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, 230);

    /*
     * GY DATA
     */
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 52px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GY DATA', width / 2, 82);

    ctx.font = '400 25px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('Transaction Receipt', width / 2, 122);

    /*
     * SUCCESS ICON
     */
    ctx.beginPath();
    ctx.arc(width / 2, 185, 42, 0, Math.PI * 2);
    ctx.fillStyle = '#22c55e';
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 18, 185);
    ctx.lineTo(width / 2 - 4, 200);
    ctx.lineTo(width / 2 + 22, 168);
    ctx.stroke();

    /*
     * RECEIPT CARD
     */
    const cardX = 70;
    const cardY = 275;
    const cardW = width - 140;
    const cardH = 980;

    ctx.fillStyle = '#ffffff';

    if ('roundRect' in ctx) {
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 28);
      ctx.fill();
    } else {
      ctx.fillRect(cardX, cardY, cardW, cardH);
    }

    /*
     * SUCCESS
     */
    ctx.fillStyle = '#16a34a';
    ctx.font = '700 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SUCCESSFUL', width / 2, 330);

    /*
     * AMOUNT
     */
    ctx.fillStyle = '#071d49';
    ctx.font = '700 64px Arial';
    ctx.fillText(money(receipt.amount), width / 2, 410);

    /*
     * PRODUCT
     */
    ctx.fillStyle = '#64748b';
    ctx.font = '400 24px Arial';
    ctx.fillText(receipt.productName || 'Transaction', width / 2, 450);

    /*
     * NETWORK
     */
    ctx.fillStyle = '#071d49';
    ctx.font = '700 32px Arial';
    ctx.fillText(receipt.network || 'GY DATA', width / 2, 505);

    /*
     * DIVIDER
     */
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cardX + 35, 540);
    ctx.lineTo(cardX + cardW - 35, 540);
    ctx.stroke();

    /*
     * ROWS
     */
    let y = 600;

    rows.forEach(([label, value]) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '400 23px Arial';
      ctx.fillText(label, cardX + 35, y);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#172033';
      ctx.font = '600 24px Arial';

      let displayValue = String(value);

      if (displayValue.length > 34) {
        displayValue = `${displayValue.substring(0, 31)}...`;
      }

      ctx.fillText(displayValue, cardX + cardW - 35, y);

      ctx.strokeStyle = '#edf2f7';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(cardX + 35, y + 22);
      ctx.lineTo(cardX + cardW - 35, y + 22);
      ctx.stroke();

      y += 78;
    });

    /*
     * CASHBACK
     */
    if (receipt.cashbackEarned && receipt.cashbackEarned > 0) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#d97706';
      ctx.font = '600 23px Arial';
      ctx.fillText('Cashback Earned', cardX + 35, y + 5);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#d97706';
      ctx.font = '700 24px Arial';
      ctx.fillText(
        `+${money(receipt.cashbackEarned)}`,
        cardX + cardW - 35,
        y + 5
      );

      y += 65;
    }

    /*
     * REFERENCE NOTE
     */
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 21px Arial';
    ctx.fillText(
      'Keep this receipt for your records.',
      width / 2,
      1320
    );

    /*
     * FOOTER
     */
    ctx.fillStyle = '#071d49';
    ctx.font = '700 28px Arial';
    ctx.fillText('GY DATA', width / 2, 1380);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 19px Arial';
    ctx.fillText(
      'Endless Joy',
      width / 2,
      1415
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not generate receipt image'));
        }
      },
      'image/png',
      1
    );
  });
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
  const [sharing, setSharing] = useState(false);

  const copyRef = async () => {
    try {
      await navigator.clipboard?.writeText(receipt.reference);
      setCopiedRef(true);

      setTimeout(() => {
        setCopiedRef(false);
      }, 2000);
    } catch {}
  };

  const copyPin = async () => {
    if (!receipt.generatedPin) return;

    try {
      await navigator.clipboard?.writeText(receipt.generatedPin);
      setCopiedPin(true);

      setTimeout(() => {
        setCopiedPin(false);
      }, 2000);
    } catch {}
  };

  /*
   * SHARE THE ACTUAL RECEIPT IMAGE
   */
  const shareReceipt = async () => {
    if (sharing) return;

    setSharing(true);

    try {
      const blob = await drawReceiptImage(receipt);

      const file = new File(
        [blob],
        `GY-DATA-Receipt-${receipt.reference}.png`,
        {
          type: 'image/png',
        }
      );

      /*
       * Android / Chrome / WhatsApp capable share
       */
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: 'GY DATA Receipt',
          text: `GY DATA transaction receipt - ${receipt.reference}`,
          files: [file],
        });

        return;
      }

      /*
       * Fallback for browsers that cannot share files.
       */
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `GY-DATA-Receipt-${receipt.reference}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (error: any) {
      /*
       * User cancelled the share sheet.
       */
      if (error?.name === 'AbortError') {
        return;
      }

      console.error('Receipt sharing failed:', error);
      alert('Unable to share receipt. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  /*
   * DOWNLOAD PNG
   */
  const downloadReceipt = async () => {
    try {
      const blob = await drawReceiptImage(receipt);

      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');

      a.href = url;
      a.download = `GY-DATA-Receipt-${receipt.reference}.png`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Receipt download failed:', error);
      alert('Unable to download receipt.');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{
          opacity: 0,
          y: 40,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 40,
          scale: 0.98,
        }}
        transition={{
          type: 'spring',
          damping: 28,
          stiffness: 320,
        }}
        className="relative w-full max-w-md bg-slate-50 dark:bg-slate-950 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[95vh]"
      >
        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* HEADER */}
        <div className="relative bg-gradient-to-br from-[#071d49] via-[#0b356f] to-[#08234e] px-6 pt-10 pb-9 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/5 blur-3xl" />

          <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative text-center">
            <motion.div
              initial={{
                scale: 0,
                rotate: -180,
              }}
              animate={{
                scale: 1,
                rotate: 0,
              }}
              transition={{
                type: 'spring',
                damping: 12,
                stiffness: 150,
              }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-green-500/40"
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </motion.div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 ring-1 ring-green-400/30 mb-3">
              <Check className="w-3 h-3 text-green-300" />

              <span className="text-[10px] font-bold text-green-300 uppercase tracking-wider">
                Successful
              </span>
            </div>

            <h2 className="text-2xl font-bold font-display text-white">
              {receipt.title}
            </h2>

            <p className="text-white/60 text-sm mt-1">
              {receipt.subtitle}
            </p>
          </div>
        </div>

        {/* RECEIPT */}
        <div className="px-5 py-6 space-y-4">
          {/* PRODUCT CARD */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <NetworkLogo
              network={receipt.network}
              size="md"
            />

            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                {receipt.network}
              </p>

              <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                +234 {cleanPhone(receipt.phone)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                Product
              </p>

              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {receipt.productName}
              </p>
            </div>
          </div>

          {/* PIN */}
          {receipt.generatedPin && (
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-500/10 dark:to-accent-500/10 border border-primary-200 dark:border-primary-500/20 shadow-sm">
              <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-2">
                Your Generated PIN
              </p>

              <div className="flex items-center justify-between gap-3">
                <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-wider break-all">
                  {receipt.generatedPin}
                </p>

                <button
                  onClick={copyPin}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 active:scale-95 transition-all"
                >
                  {copiedPin ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* MAIN DETAILS */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <ReceiptRow
              label="Recipient"
              value={cleanPhone(receipt.phone)}
            />

            <ReceiptRow
              label="Amount"
              value={formatCurrency(receipt.amount)}
              valueClass="font-bold text-slate-900 dark:text-white"
            />

            {receipt.extraRows?.map((row) => (
              <ReceiptRow
                key={row.label}
                label={row.label}
                value={row.value}
              />
            ))}

            <ReceiptRow
              label="Wallet Balance Before"
              value={formatCurrency(receipt.prevBalance)}
            />

            <ReceiptRow
              label="Wallet Balance After"
              value={formatCurrency(receipt.newBalance)}
              valueClass="font-bold text-green-600 dark:text-green-400"
            />

            {receipt.cashbackEarned &&
              receipt.cashbackEarned > 0 && (
                <div className="px-4 py-3.5 bg-amber-50 dark:bg-amber-500/10 border-t border-amber-100 dark:border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>

                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                        Cashback Earned
                      </p>
                    </div>

                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      +{formatCurrency(receipt.cashbackEarned)}
                    </p>
                  </div>
                </div>
              )}

            {/* REFERENCE */}
            <div className="px-4 py-3.5 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Reference
                </p>

                <button
                  onClick={copyRef}
                  className="flex items-center gap-1.5 text-xs font-mono text-primary-600 dark:text-primary-400 max-w-[65%]"
                >
                  <span className="truncate">
                    {receipt.reference}
                  </span>

                  {copiedRef ? (
                    <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                  ) : (
                    <Copy className="w-3 h-3 flex-shrink-0" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Date & Time
                </p>

                <p className="text-xs text-slate-600 dark:text-slate-300 text-right">
                  {formatDateTime(receipt.date)}
                </p>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              variant="secondary"
              size="md"
              onClick={downloadReceipt}
            >
              <Download className="w-4 h-4" />
              Download
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={shareReceipt}
              disabled={sharing}
            >
              <Share2 className="w-4 h-4" />

              {sharing ? 'Preparing...' : 'Share'}
            </Button>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={onClose}
          >
            Done
          </Button>

          {/* FOOTER */}
          <div className="text-center pt-2 pb-3">
            <p className="text-xs text-slate-400">
              Thank you for using GY DATA
            </p>

            <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">
              Endless Joy
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  valueClass = '',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <p className="text-xs text-slate-400 dark:text-slate-500">
        {label}
      </p>

      <p
        className={`text-sm text-right text-slate-700 dark:text-slate-200 break-all ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| PURCHASE PIN MODAL
|--------------------------------------------------------------------------
*/

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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={
              stage === 'processing'
                ? undefined
                : onClose
            }
          />

          <motion.div
            initial={{
              opacity: 0,
              y: 40,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 40,
              scale: 0.98,
            }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 320,
            }}
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
                  <motion.div
                    key="pin"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                      <ShieldCheckIcon />
                    </div>

                    <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-1">
                      Enter Purchase PIN
                    </h2>

                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                      Confirm payment of{' '}
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {formatCurrency(amount)}
                      </span>{' '}
                      for {productName}
                    </p>

                    <PinInput
                      length={4}
                      value={pin}
                      onChange={setPin}
                      onComplete={onPinComplete}
                      error={!!pinError}
                    />

                    {pinError && (
                      <p className="text-sm text-red-500 mt-3">
                        {pinError}
                      </p>
                    )}
                  </motion.div>
                )}

                {stage === 'processing' && (
                  <motion.div
                    key="proc"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8"
                  >
                    <LoaderIcon />

                    <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-1">
                      Processing...
                    </h2>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Purchasing {productName}
                    </p>
                  </motion.div>
                )}

                {stage === 'error' && (
                  <motion.div
                    key="err"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-6"
                  >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-red-500/30">
                      <X className="w-10 h-10 text-white" />
                    </div>

                    <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-1">
                      Transaction Failed
                    </h2>

                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                      {pinError}
                    </p>

                    <Button
                      fullWidth
                      variant="secondary"
                      onClick={onClose}
                    >
                      Close
                    </Button>
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
import {
  ShieldCheck,
  Loader2,
} from 'lucide-react';

function ShieldCheckIcon() {
  return (
    <ShieldCheck className="w-8 h-8 text-primary-600 dark:text-primary-400" />
  );
}

function LoaderIcon() {
  return (
    <Loader2 className="w-16 h-16 text-primary-600 dark:text-primary-400 mx-auto mb-4 animate-spin" />
  );
}
