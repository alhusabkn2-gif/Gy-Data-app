import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  EyeOff,
  Eye,
  Smartphone,
  Phone,
  Wallet as WalletIcon,
  Receipt,
  Zap,
  Tv,
  GraduationCap,
  BookOpen,
  Trophy,
  Smile,
  Wifi,
  Grid3x3,
  Gift,
  ArrowUpRight,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, getGreeting } from '../lib/utils';
import Logo from '../components/Logo';

const services = [
  {
    id: 'airtime',
    name: 'Airtime',
    icon: Phone,
  },
  {
    id: 'data',
    name: 'Data',
    icon: Smartphone,
  },
  {
    id: 'cable',
    name: 'Cable TV',
    icon: Tv,
  },
  {
    id: 'electricity',
    name: 'Electricity',
    icon: Zap,
  },
  {
    id: 'waec',
    name: 'Exam Pins',
    icon: GraduationCap,
  },
  {
    id: 'internet',
    name: 'Internet',
    icon: Wifi,
  },
  {
    id: 'education',
    name: 'Education',
    icon: BookOpen,
  },
  {
    id: 'more',
    name: 'More',
    icon: Grid3x3,
  },
];

const servicePath: Record<string, string> = {
  airtime: '/buy-airtime',
  data: '/buy-data',
  electricity: '/services/electricity',
  cable: '/services/cable',
  waec: '/services/waec',
  internet: '/services/internet',
  education: '/services',
  more: '/services',
};

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showBalance, setShowBalance] = useState(true);

  const firstName =
    user?.full_name?.split(' ')[0] || 'User';

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-24">

      {/* ================= TOP ================= */}

      <section className="px-5 pb-4 pt-6">

        <div className="flex items-center justify-between">

          <div>
            <Logo size="sm" showText />

            <div className="mt-4">

              <h1 className="text-[18px] font-bold text-[#0F172A]">
                {getGreeting()}, {firstName} 👋
              </h1>

              <p className="mt-1 text-[11px] text-[#64748B]">
                Welcome back!
              </p>

            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="relative mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
          >
            <Bell className="h-[19px] w-[19px] text-[#0F172A]" />

            <span className="absolute right-[9px] top-[8px] h-2 w-2 rounded-full bg-[#F97316]" />
          </button>

        </div>

      </section>

      {/* ================= WALLET BALANCE ================= */}

      <section className="px-5">

        <div className="overflow-hidden rounded-[16px] bg-[#0D1B3D] p-4 shadow-[0_8px_24px_rgba(13,27,61,0.16)]">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-[11px] font-medium text-white/75">
                Wallet Balance
              </p>

              <AnimatePresence mode="wait">

                <motion.p
                  key={showBalance ? 'visible' : 'hidden'}
                  initial={{
                    opacity: 0,
                    y: 4,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -4,
                  }}
                  className="mt-1 text-[21px] font-bold tracking-tight text-white"
                >
                  {showBalance
                    ? formatCurrency(
                        user?.wallet_balance || 0,
                      )
                    : '₦ • • • • •'}
                </motion.p>

              </AnimatePresence>

              <p className="mt-1 text-[10px] text-white/70">
                Main Wallet
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowBalance(!showBalance)
              }
              className="mt-10 flex h-7 w-7 items-center justify-center rounded-full"
            >
              {showBalance ? (
                <Eye className="h-4 w-4 text-white" />
              ) : (
                <EyeOff className="h-4 w-4 text-white" />
              )}
            </button>

          </div>

        </div>

      </section>

      {/* ================= WALLET ACTIONS ================= */}

      <section className="px-5 pt-4">

        <div className="grid grid-cols-2 gap-3">

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/wallet')}
            className="h-[48px] rounded-[12px] bg-[#0D1B3D] text-[11px] font-bold text-white shadow-sm"
          >
            Fund Wallet
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/transactions')}
            className="h-[48px] rounded-[12px] border border-[#E3E7EE] bg-white text-[11px] font-semibold text-[#0F172A] shadow-sm"
          >
            Transactions
          </motion.button>

        </div>

      </section>

      {/* ================= QUICK SERVICES ================= */}

      <section className="px-5 pt-6">

        <div className="mb-3 flex items-center justify-between">

          <h2 className="text-[13px] font-bold text-[#0F172A]">
            Quick Services
          </h2>

          <button
            type="button"
            onClick={() => navigate('/services')}
            className="flex items-center gap-1 text-[10px] font-medium text-[#0F172A]"
          >
            View all
            <ArrowUpRight className="h-3 w-3" />
          </button>

        </div>

        <div className="grid grid-cols-4 gap-x-3 gap-y-4">

          {services.map((service) => {

            const Icon = service.icon;

            return (
              <motion.button
                key={service.id}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() =>
                  navigate(
                    servicePath[service.id] ||
                      '/services',
                  )
                }
                className="flex flex-col items-center"
              >

                <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[12px] border border-[#E7EAF0] bg-white shadow-sm">

                  <Icon
                    className={`h-[20px] w-[20px] ${
                      service.id ===
                      'electricity'
                        ? 'text-[#F97316]'
                        : 'text-[#0D1B3D]'
                    }`}
                    strokeWidth={1.8}
                  />

                </div>

                <span className="mt-1.5 max-w-[65px] truncate text-center text-[9px] font-medium text-[#0F172A]">
                  {service.name}
                </span>

              </motion.button>
            );
          })}

        </div>

      </section>

      {/* ================= BONUS CARD ================= */}

      <section className="px-5 pt-6">

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/services')}
          className="relative flex w-full items-center overflow-hidden rounded-[15px] bg-white px-4 py-3.5 text-left shadow-sm"
        >

          <div className="min-w-0 flex-1">

            <h3 className="text-[13px] font-bold text-[#0F172A]">
              Get 5% Bonus
            </h3>

            <p className="mt-1 max-w-[190px] text-[9px] leading-4 text-[#64748B]">
              Fund your wallet and get 5% bonus instantly
            </p>

          </div>

          <div className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-[#FFF1E6]">

            <Gift className="h-6 w-6 text-[#F97316]" />

          </div>

          <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#F97316]/5" />

        </motion.button>

      </section>

    </div>
  );
}
