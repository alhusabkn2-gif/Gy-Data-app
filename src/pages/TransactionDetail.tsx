import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Download, Share2, Copy, Check, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import NetworkLogo from '../components/ui/NetworkLogo';
import { AnimatedCard } from '../components/ui/NetworkLogo';
import { CashbackEarned } from '../components/ui/Cashback';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDateTime } from '../lib/utils';

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTx();
  }, [id]);

  const fetchTx = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (data) setTx(data);
    setLoading(false);
  };

  const copyRef = () => {
    if (tx?.reference) {
      navigator.clipboard.writeText(tx.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReceipt = async () => {
    if (!tx) return;
    const text = `GY DATA Receipt\n\nProduct: ${tx.product || tx.service}\nAmount: ${formatCurrency(tx.amount)}\nStatus: ${tx.status}\nReference: ${tx.reference}\nDate: ${formatDateTime(tx.created_at)}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'GY DATA Receipt', text }); } catch {}
    } else {
      navigator.clipboard.writeText(text);
      alert('Receipt details copied to clipboard');
    }
  };

  const downloadReceipt = () => {
    if (!tx) return;
    const content = `GY DATA - Transaction Receipt\n\nProduct: ${tx.product || tx.service}\nAmount: ${formatCurrency(tx.amount)}\nStatus: ${tx.status}\nRecipient: ${tx.recipient || 'N/A'}\nNetwork: ${tx.network || 'N/A'}\nReference: ${tx.reference}\nDate: ${formatDateTime(tx.created_at)}\n\nThank you for using GY DATA.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GY-Data-Receipt-${tx.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 px-5 pt-12">
        <PageHeader title="Receipt" />
        <div className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 px-5 pt-12">
        <PageHeader title="Receipt" />
        <div className="card-premium p-10 text-center">
          <p className="text-slate-400 dark:text-slate-500">Transaction not found</p>
        </div>
      </div>
    );
  }

  const statusConfig = {
    success: { icon: CheckCircle2, color: 'text-success-500', bg: 'bg-success-500/10', label: 'Successful' },
    failed: { icon: XCircle, color: 'text-error-500', bg: 'bg-error-500/10', label: 'Failed' },
    pending: { icon: Clock, color: 'text-warning-500', bg: 'bg-warning-500/10', label: 'Pending' },
  };
  const status = statusConfig[tx.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 px-5 pt-12">
      <PageHeader title="Transaction Receipt" />

      <AnimatedCard delay={0.05}>
        <div className="card-premium overflow-hidden">
          {/* Receipt Header */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 150 }}
              className={`w-16 h-16 rounded-full ${status.bg} flex items-center justify-center mx-auto mb-3 relative`}
            >
              <StatusIcon className={`w-8 h-8 ${status.color}`} />
            </motion.div>
            <p className="text-white/70 text-sm">{status.label}</p>
            <p className="text-white text-3xl font-bold font-display mt-1">
              {tx.type === 'funding' ? '+' : '-'}{formatCurrency(tx.amount)}
            </p>
          </div>

          {/* Receipt Body */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100 dark:border-slate-800">
              <NetworkLogo network={tx.network || tx.service} size="md" />
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">{tx.product || tx.service}</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">{tx.network || tx.service}</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <ReceiptRow label="Recipient" value={tx.recipient || 'N/A'} />
              <ReceiptRow label="Product" value={tx.product || tx.service} />
              <ReceiptRow label="Amount" value={formatCurrency(tx.amount)} />
              <ReceiptRow label="Status" value={status.label} highlight={tx.status} />
              {tx.metadata?.cashback_amount && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Cashback Earned</span>
                  <CashbackEarned amount={tx.metadata.cashback_amount} />
                </div>
              )}
              <ReceiptRow label="Date & Time" value={formatDateTime(tx.created_at)} />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Reference</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-200">{tx.reference}</span>
                  <button onClick={copyRef} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    {copied ? <Check className="w-4 h-4 text-success-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2.5 mt-6">
              <Button variant="secondary" size="sm" onClick={downloadReceipt}>
                <Download className="w-4 h-4" /> Download
              </Button>
              <Button variant="secondary" size="sm" onClick={shareReceipt}>
                <Share2 className="w-4 h-4" /> Share
              </Button>
              <Button variant="secondary" size="sm" onClick={copyRef}>
                {copied ? <Check className="w-4 h-4 text-success-500" /> : <Copy className="w-4 h-4" />} Copy Ref
              </Button>
            </div>
          </div>

          {/* Receipt Footer */}
          <div className="px-6 pb-6">
            <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700 pt-4 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Thank you for using GY DATA
              </p>
              <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
                Generated on {formatDateTime(new Date())}
              </p>
            </div>
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
}

function ReceiptRow({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`text-sm font-semibold ${
        highlight === 'success' ? 'text-success-600 dark:text-success-400'
        : highlight === 'failed' ? 'text-error-500'
        : 'text-slate-700 dark:text-slate-200'
      }`}>
        {value}
      </span>
    </div>
  );
}
