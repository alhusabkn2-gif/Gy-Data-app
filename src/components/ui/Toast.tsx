import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-success-500" />,
    error: <XCircle className="w-5 h-5 text-error-500" />,
    info: <Info className="w-5 h-5 text-primary-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-warning-500" />,
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={() => onDismiss(toast.id)}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 cursor-pointer"
          >
            {icons[toast.type]}
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 flex-1">{toast.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
