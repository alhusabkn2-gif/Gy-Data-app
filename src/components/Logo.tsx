import { motion } from 'framer-motion';

export default function Logo({ size = 'md', showText = true }: { size?: 'sm' | 'md' | 'lg'; showText?: boolean }) {
  const sizes = {
    sm: { box: 'w-9 h-9', text: 'text-base' },
    md: { box: 'w-12 h-12', text: 'text-xl' },
    lg: { box: 'w-16 h-16', text: 'text-2xl' },
  };

  return (
    <div className="flex items-center gap-2.5">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        className={`${sizes[size].box} rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 flex items-center justify-center shadow-lg shadow-primary-600/30 relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20" />
        <span className="relative font-bold text-white font-display tracking-tighter">G</span>
      </motion.div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${sizes[size].text} font-bold font-display tracking-tight text-slate-900 dark:text-white`}>
            GY DATA
          </span>
          {size !== 'sm' && (
            <span className="text-[10px] font-medium text-primary-500 dark:text-primary-400 tracking-widest uppercase mt-0.5">
              Premium Fintech
            </span>
          )}
        </div>
      )}
    </div>
  );
}
