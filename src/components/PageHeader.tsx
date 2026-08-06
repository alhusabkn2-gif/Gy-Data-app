import { type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, back = true, action }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 mb-6"
    >
      {back && (
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-105 transition-transform"
        >
          <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
        </button>
      )}
      <div className="flex-1">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </motion.div>
  );
}
