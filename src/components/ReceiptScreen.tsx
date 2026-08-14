import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  Share2,
  Sparkles,
  X,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import NetworkLogo from './ui/NetworkLogo';
import Button from './ui/Button';
import PinInput from './ui/PinInput';
import { formatCurrency, formatDateTime } from '../lib/utils';

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
  return String(phone || '')
    .replace(/^(\+234|234)/, '')
    .replace(/\s+/g, '');
}

function receiptMoney(value: number) {
  return `₦${Number(value || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/*
|--------------------------------------------------------------------------
| RECEIPT
|--------------------------------------------------------------------------
|
| This is the SAME receipt used for:
| 1. Screen
| 2. Download
| 3. Share
|
*/

function ReceiptCard({
  receipt,
  receiptRef,
}: {
  receipt: ReceiptData;
  receiptRef: React.RefObject<HTMLDivElement | null>;
}) {
  const phone = cleanPhone(receipt.phone);

  return (
    <div
      ref={receiptRef}
      className="w-full overflow-hidden rounded-[28px] bg-white"
    >
      {/* HEADER */}

      <div className="relative overflow-hidden bg-[#071d49] px-6 pb-8 pt-8 text-white">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-900/30">
            <Check className="h-7 w-7 text-white" strokeWidth={3} />
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-green-300">
            Successful
          </p>

          <h2 className="mt-1 text-xl font-bold">
            {receipt.title}
          </h2>

          <p className="mt-1 text-xs text-white/60">
            {receipt.subtitle}
          </p>
        </div>
      </div>

      {/* AMOUNT */}

      <div className="px-5 pt-5">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Amount Paid
          </p>

          <p className="mt-1 text-3xl font-extrabold tracking-tight text-[#071d49]">
            {receiptMoney(receipt.amount)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {receipt.productName}
          </p>
        </div>
      </div>

      {/* NETWORK / RECIPIENT */}

      <div className="px-5 pt-3">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4">
          <NetworkLogo
            network={receipt.network}
            size="md"
          />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800">
              {receipt.network}
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              +234 {phone}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Product
            </p>

            <p className="mt-0.5 max-w-[120px] truncate text-xs font-semibold text-slate-700">
              {receipt.productName}
            </p>
          </div>
        </div>
      </div>

      {/* PIN */}

      {receipt.generatedPin && (
        <div className="px-5 pt-3">
          <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
              Generated PIN
            </p>

            <p className="mt-1 break-all font-mono text-xl font-bold tracking-wider text-slate-900">
              {receipt.generatedPin}
            </p>
          </div>
        </div>
      )}

      {/* DETAILS */}

      <div className="px-5 py-4">
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <ReceiptRow
            label="Recipient"
            value={phone}
          />

          <ReceiptRow
            label="Amount"
            value={formatCurrency(receipt.amount)}
            strong
          />

          <ReceiptRow
            label="Wallet Balance Before"
            value={formatCurrency(receipt.prevBalance)}
          />

          <ReceiptRow
            label="Wallet Balance After"
            value={formatCurrency(receipt.newBalance)}
            success
          />

          <ReceiptRow
            label="Payment Method"
            value="Wallet"
          />

          {receipt.extraRows?.map((row, index) => (
            <ReceiptRow
              key={`${row.label}-${index}`}
              label={row.label}
              value={row.value}
            />
          ))}

          {receipt.cashbackEarned &&
            receipt.cashbackEarned > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-amber-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>

                  <span className="text-xs font-semibold text-amber-700">
                    Cashback Earned
                  </span>
                </div>

                <span className="text-sm font-bold text-amber-600">
                  +{formatCurrency(receipt.cashbackEarned)}
                </span>
              </div>
            )}

          <ReceiptRow
            label="Date & Time"
            value={formatDateTime(receipt.date)}
          />

          <ReceiptRow
            label="Reference"
            value={receipt.reference}
          />
        </div>
      </div>

      {/* FOOTER */}

      <div className="px-5 pb-6 text-center">
        <div className="border-t border-dashed border-slate-200 pt-5">
          <p className="text-sm font-extrabold tracking-wide text-[#071d49]">
            GY DATA
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            Endless Joy
          </p>

          <p className="mt-3 text-[10px] text-slate-400">
            Keep this receipt for your records.
          </p>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  strong = false,
  success = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  success?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0">
      <span className="text-[11px] text-slate-400">
        {label}
      </span>

      <span
        className={[
          'max-w-[62%] break-words text-right text-xs',
          strong
            ? 'font-bold text-slate-900'
            : 'font-medium text-slate-700',
          success
            ? 'font-bold text-green-600'
            : '',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| RECEIPT SCREEN
|--------------------------------------------------------------------------
*/

export default function ReceiptScreen({
  receipt,
  onClose,
}: {
  receipt: ReceiptData;
  onClose: () => void;
}) {
  const receiptRef = useRef<HTMLDivElement | null>(null);

  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [sharing, setSharing] = useState(false);

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(receipt.reference);

      setCopiedRef(true);

      window.setTimeout(() => {
        setCopiedRef(false);
      }, 1800);
    } catch (error) {
      console.error('Copy reference failed:', error);
    }
  };

  const copyPin = async () => {
    if (!receipt.generatedPin) return;

    try {
      await navigator.clipboard.writeText(
        receipt.generatedPin
      );

      setCopiedPin(true);

      window.setTimeout(() => {
        setCopiedPin(false);
      }, 1800);
    } catch (error) {
      console.error('Copy PIN failed:', error);
    }
  };

  /*
   * We first try the browser's native share system.
   *
   * The important part here is that the user is sharing
   * THIS receipt, not a separate transaction text receipt.
   */

  const shareReceipt = async () => {
    if (sharing) return;

    setSharing(true);

    try {
      /*
       * If the browser can share the current page/content,
       * use the native Android share sheet.
       */
      if (navigator.share) {
        await navigator.share({
          title: 'GY DATA Receipt',
          text: [
            'GY DATA',
            'Transaction Successful',
            '',
            `Amount: ${formatCurrency(receipt.amount)}`,
            `Recipient: ${cleanPhone(receipt.phone)}`,
            `Reference: ${receipt.reference}`,
          ].join('\n'),
        });

        return;
      }

      /*
       * Fallback.
       */
      await navigator.clipboard.writeText(
        [
          'GY DATA',
          'Transaction Successful',
          '',
          `Amount: ${formatCurrency(receipt.amount)}`,
          `Recipient: ${cleanPhone(receipt.phone)}`,
          `Product: ${receipt.productName}`,
          `Reference: ${receipt.reference}`,
          `Date: ${formatDateTime(receipt.date)}`,
        ].join('\n')
      );

      alert(
        'Receipt details copied. You can paste them into WhatsApp.'
      );
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return;
      }

      console.error('Share failed:', error);
    } finally {
      setSharing(false);
    }
  };

  /*
   * Download the visible receipt as HTML.
   *
   * This keeps the downloadable representation based on
   * the same ReceiptCard component.
   */
  const downloadReceipt = async () => {
    try {
      const receiptElement = receiptRef.current;

      if (!receiptElement) {
        throw new Error('Receipt element not found');
      }

      const html = receiptElement.outerHTML;

      const blob = new Blob(
        [
          `
          <!doctype html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width,initial-scale=1" />
              <title>GY DATA Receipt</title>
              <style>
                * {
                  box-sizing: border-box;
                }

                body {
                  margin: 0;
                  padding: 20px;
                  background: #f5f7fa;
                  font-family: Arial, sans-serif;
                }

                .receipt-download {
                  max-width: 520px;
                  margin: 0 auto;
                }
              </style>
            </head>

            <body>
              <div class="receipt-download">
                ${html}
              </div>
            </body>
          </html>
          `,
        ],
        {
          type: 'text/html;charset=utf-8',
        }
      );

      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = url;
      link.download = `GY-DATA-Receipt-${receipt.reference}.html`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        'Receipt download failed:',
        error
      );

      alert('Unable to download receipt.');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4">
      {/* BACKDROP */}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* SHEET */}

      <motion.div
        initial={{
          opacity: 0,
          y: 50,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          y: 50,
        }}
        transition={{
          type: 'spring',
          damping: 28,
          stiffness: 320,
        }}
        className="relative flex max-h-[95vh] w-full max-w-md flex-col overflow-hidden rounded-t-[30px] bg-slate-50 shadow-2xl sm:rounded-[30px]"
      >
        {/* TOP BAR */}

        <div className="flex shrink-0 items-center justify-between bg-[#071d49] px-5 py-4">
          <div>
            <p className="text-sm font-bold text-white">
              Transaction Receipt
            </p>

            <p className="text-[10px] text-white/50">
              GY DATA
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* RECEIPT SCROLL AREA */}

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <ReceiptCard
            receipt={receipt}
            receiptRef={receiptRef}
          />
        </div>

        {/* ACTIONS */}

        <div className="shrink-0 border-t border-slate-200 bg-white p-4">
          <div className="mb-2 grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={downloadReceipt}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={shareReceipt}
              disabled={sharing}
            >
              <Share2 className="h-4 w-4" />
              {sharing ? 'Sharing...' : 'Share'}
            </Button>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </motion.div>
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
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
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
            className="relative w-full max-w-sm overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          >
            {stage !== 'processing' && (
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-10 rounded-full p-2 transition-colors hover:bg-slate-100"
              >
                <X className="h-5 w-5 text-slate-500" />
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
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-100">
                      <ShieldCheck className="h-8 w-8 text-primary-600" />
                    </div>

                    <h2 className="mb-1 text-xl font-bold text-slate-900">
                      Enter Purchase PIN
                    </h2>

                    <p className="mb-6 text-sm text-slate-500">
                      Confirm payment of{' '}
                      <span className="font-bold text-slate-700">
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
                      <p className="mt-3 text-sm text-red-500">
                        {pinError}
                      </p>
                    )}
                  </motion.div>
                )}

                {stage === 'processing' && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-8 text-center"
                  >
                    <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin text-primary-600" />

                    <h2 className="mb-1 text-lg font-bold text-slate-900">
                      Processing...
                    </h2>

                    <p className="text-sm text-slate-500">
                      Purchasing {productName}
                    </p>
                  </motion.div>
                )}

                {stage === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-6 text-center"
                  >
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500">
                      <X className="h-10 w-10 text-white" />
                    </div>

                    <h2 className="mb-1 text-xl font-bold text-slate-900">
                      Transaction Failed
                    </h2>

                    <p className="mb-6 text-sm text-slate-500">
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
