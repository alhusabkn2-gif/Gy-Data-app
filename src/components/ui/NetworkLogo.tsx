import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface NetworkLogoProps {
  network: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const NETWORK_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  MTN: { bg: 'bg-yellow-400', text: 'text-black', label: 'MTN' },
  GLO: { bg: 'bg-green-600', text: 'text-white', label: 'Glo' },
  AIRTEL: { bg: 'bg-red-600', text: 'text-white', label: 'Airtel' },
  '9MOBILE': { bg: 'bg-blue-600', text: 'text-white', label: '9Mobile' },
  SMILE: { bg: 'bg-teal-500', text: 'text-white', label: 'Smile' },
  DSTV: { bg: 'bg-blue-700', text: 'text-white', label: 'DStv' },
  GOTV: { bg: 'bg-emerald-600', text: 'text-white', label: 'GOtv' },
  STARTIMES: { bg: 'bg-orange-500', text: 'text-white', label: 'StarTimes' },
  WAEC: { bg: 'bg-emerald-700', text: 'text-white', label: 'WAEC' },
  JAMB: { bg: 'bg-rose-700', text: 'text-white', label: 'JAMB' },
  SPORTYBET: { bg: 'bg-blue-600', text: 'text-white', label: 'SB' },
  BET9JA: { bg: 'bg-red-700', text: 'text-white', label: 'B9' },
  BANGBET: { bg: 'bg-purple-700', text: 'text-white', label: 'BB' },
  NAIRABET: { bg: 'bg-green-700', text: 'text-white', label: 'NB' },
  BETKING: { bg: 'bg-indigo-700', text: 'text-white', label: 'BK' },
  IKEDC: { bg: 'bg-amber-600', text: 'text-white', label: 'IKEDC' },
  EKEDC: { bg: 'bg-cyan-700', text: 'text-white', label: 'EKEDC' },
  AEDC: { bg: 'bg-slate-700', text: 'text-white', label: 'AEDC' },
  PHED: { bg: 'bg-rose-600', text: 'text-white', label: 'PHED' },
  IBEDC: { bg: 'bg-orange-700', text: 'text-white', label: 'IBEDC' },
  KEDCO: { bg: 'bg-red-800', text: 'text-white', label: 'KEDCO' },
  JED: { bg: 'bg-teal-700', text: 'text-white', label: 'JED' },
  SPECTRANET: { bg: 'bg-purple-600', text: 'text-white', label: 'Spec' },
  SWIFT: { bg: 'bg-rose-600', text: 'text-white', label: 'Swift' },
};

export default function NetworkLogo({ network, size = 'md', className }: NetworkLogoProps) {
  const style = NETWORK_STYLES[network?.toUpperCase()] || { bg: 'bg-slate-500', text: 'text-white', label: network?.slice(0, 2).toUpperCase() || '??' };
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
  };
  return (
    <div
      className={cn(
        'rounded-2xl flex items-center justify-center font-bold flex-shrink-0 shadow-sm',
        style.bg,
        style.text,
        sizes[size],
        className,
      )}
    >
      {style.label}
    </div>
  );
}

export function ServiceIcon({ icon, color, size = 'md' }: { icon: ReactNode; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };
  return (
    <div className={cn('rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg', color, sizes[size])}>
      <div className={iconSizes[size]}>{icon}</div>
    </div>
  );
}

export function AnimatedCard({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
