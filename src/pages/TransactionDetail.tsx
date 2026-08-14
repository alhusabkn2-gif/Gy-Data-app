import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import ReceiptScreen, {
  type ReceiptData,
} from '../components/ReceiptScreen';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadTransaction();
  }, [id]);

  const loadTransaction = async () => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Transaction fetch error:', error);
        setNotFound(true);
        return;
      }

      if (!data) {
        setNotFound(true);
        return;
      }

      const metadata =
        data.metadata &&
        typeof data.metadata === 'object'
          ? data.metadata
          : {};

      const prevBalance =
        Number(
          metadata.prev_balance ??
          metadata.previous_balance ??
          metadata.balance_before ??
          data.balance_before ??
          0
        );

      const newBalance =
        Number(
          metadata.new_balance ??
          metadata.balance_after ??
          data.balance_after ??
          0
        );

      const cashbackEarned = Number(
        metadata.cashback_amount ??
        metadata.cashbackEarned ??
        0
      );

      const extraRows: {
        label: string;
        value: string;
      }[] = [];

      /*
       * Add useful transaction information
       */
      if (data.service) {
        extraRows.push({
          label: 'Service',
          value: String(data.service),
        });
      }

      if (data.type) {
        extraRows.push({
          label: 'Type',
          value: String(data.type),
        });
      }

      /*
       * Add selected metadata fields
       */
      const hiddenMetadata = [
        'prev_balance',
        'previous_balance',
        'balance_before',
        'new_balance',
        'balance_after',
        'cashback_amount',
        'cashbackEarned',
        'generated_pin',
      ];

      Object.entries(metadata).forEach(([key, value]) => {
        if (
          hiddenMetadata.includes(key) ||
          value === null ||
          value === undefined ||
          value === ''
        ) {
          return;
        }

        const exists = extraRows.some(
          (row) =>
            row.label.toLowerCase() ===
            key.replace(/_/g, ' ').toLowerCase()
        );

        if (!exists) {
          extraRows.push({
            label: key
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (char) =>
                char.toUpperCase()
              ),
            value: String(value),
          });
        }
      });

      /*
       * Generated PIN
       */
      const generatedPin =
        metadata.generated_pin ??
        data.generated_pin ??
        undefined;

      /*
       * Transaction title
       */
      const successful = data.status === 'success';

      const title = successful
        ? 'Transaction Successful'
        : data.status === 'pending'
        ? 'Transaction Pending'
        : 'Transaction Failed';

      const subtitle =
        data.product ||
        data.service ||
        'Transaction';

      /*
       * Build receipt object
       */
      setReceipt({
        reference: String(
          data.reference ||
          data.id
        ),

        network: String(
          data.network ||
          data.service ||
          'GY DATA'
        ),

        phone: String(
          data.recipient ||
          data.phone ||
          'N/A'
        ),

        productName: String(
          data.product ||
          data.service ||
          'Transaction'
        ),

        amount: Number(data.amount || 0),

        prevBalance,

        newBalance,

        date: String(
          data.created_at ||
          new Date().toISOString()
        ),

        title,

        subtitle,

        extraRows,

        generatedPin:
          generatedPin !== undefined
            ? String(generatedPin)
            : undefined,

        cashbackEarned:
          cashbackEarned > 0
            ? cashbackEarned
            : undefined,
      });
    } catch (error) {
      console.error(
        'Failed to load transaction:',
        error
      );

      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 px-5 pt-12">
        <PageHeader title="Transaction" />

        <div className="space-y-4">
          <div className="h-48 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />

          <div className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />

          <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  /*
   * Not found
   */
  if (notFound || !receipt) {
    return (
      <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 px-5 pt-12">
        <PageHeader
          title="Transaction"
          back
        />

        <div className="card-premium p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>

          <h2 className="font-bold text-slate-800 dark:text-slate-100">
            Transaction not found
          </h2>

          <p className="text-sm text-slate-400 mt-2">
            This transaction may have been removed or
            is no longer available.
          </p>

          <button
            onClick={() => navigate('/transactions')}
            className="mt-6 px-5 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold"
          >
            Back to Transactions
          </button>
        </div>
      </div>
    );
  }

  /*
   * Receipt
   */
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ReceiptScreen
        receipt={receipt}
        onClose={() =>
          navigate('/transactions')
        }
      />
    </div>
  );
}
