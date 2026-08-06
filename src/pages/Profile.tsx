import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, ShieldCheck, KeyRound, Bell, LogOut, ChevronRight,
  BadgeCheck, Lock, Gift, Copy, Check, Moon, Sun, Settings, Info,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/ui/Modal';
import PinInput from '../components/ui/PinInput';
import Button from '../components/ui/Button';
import { AnimatedCard } from '../components/ui/NetworkLogo';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { getInitials, formatCurrency } from '../lib/utils';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showLogout, setShowLogout] = useState(false);
  const [showChangeLogin, setShowChangeLogin] = useState(false);
  const [showChangePurchase, setShowChangePurchase] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyReferral = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const menuItems = [
    { icon: User, label: 'Personal Information', action: () => navigate('/profile/personal') },
    { icon: BadgeCheck, label: 'KYC Verification', badge: user?.kyc_status || 'unverified', action: () => navigate('/profile/kyc') },
    { icon: ShieldCheck, label: 'Security', action: () => navigate('/profile/security') },
    { icon: KeyRound, label: 'Change Login PIN', action: () => setShowChangeLogin(true) },
    { icon: Lock, label: 'Change Purchase PIN', action: () => setShowChangePurchase(true) },
    { icon: Bell, label: 'Notifications', action: () => navigate('/notifications') },
    { icon: Gift, label: 'Referrals', action: () => navigate('/profile') },
  ];

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 px-5 pt-12">
      <PageHeader title="Profile" subtitle="Manage your account" back={false} />

      {/* Profile Card */}
      <AnimatedCard delay={0.05} className="mb-5">
        <div className="card-premium p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-600/25">
              {user ? getInitials(user.full_name) : '??'}
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900 dark:text-white font-display text-lg">{user?.full_name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.phone}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  user?.kyc_status === 'verified' ? 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400'
                  : 'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400'
                }`}>
                  {user?.kyc_status || 'unverified'}
                </span>
                {user?.is_admin && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Referral Code */}
          <div className="mt-4 p-3.5 rounded-2xl bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Your Referral Code</p>
                <p className="text-lg font-bold text-primary-600 dark:text-primary-400 font-mono">{user?.referral_code}</p>
              </div>
              <button onClick={copyReferral} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:scale-105 transition-transform">
                {copied ? <Check className="w-5 h-5 text-success-500" /> : <Copy className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
              </button>
            </div>
          </div>
        </div>
      </AnimatedCard>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <AnimatedCard delay={0.1}>
          <div className="card-premium p-4">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Wallet Balance</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white font-display mt-1">{formatCurrency(user?.wallet_balance || 0)}</p>
          </div>
        </AnimatedCard>
        <AnimatedCard delay={0.15}>
          <div className="card-premium p-4">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Member Since</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white font-display mt-1">{user ? new Date(user.created_at).getFullYear() : '--'}</p>
          </div>
        </AnimatedCard>
      </div>

      {/* Menu */}
      <div className="space-y-2.5 mb-5">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <AnimatedCard key={item.label} delay={0.1 + i * 0.03}>
              <button
                onClick={item.action}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </div>
                <span className="flex-1 text-left font-medium text-slate-700 dark:text-slate-200 text-sm">{item.label}</span>
                {item.badge && (
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500 capitalize">{item.badge}</span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
              </button>
            </AnimatedCard>
          );
        })}
      </div>

      {/* Theme Toggle */}
      <AnimatedCard delay={0.25}>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" /> : <Sun className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
          </div>
          <span className="flex-1 text-left font-medium text-slate-700 dark:text-slate-200 text-sm">
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-primary-600' : 'bg-slate-300'}`}>
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-4' : ''}`} />
          </div>
        </button>
      </AnimatedCard>

      {/* Settings & About */}
      <AnimatedCard delay={0.28}>
        <div className="card-premium overflow-hidden">
          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <span className="flex-1 text-left font-medium text-slate-700 dark:text-slate-200 text-sm">Settings</span>
            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
          </button>
          <button
            onClick={() => navigate('/support')}
            className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="flex-1 text-left font-medium text-slate-700 dark:text-slate-200 text-sm">Help & Support</span>
            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
          </button>
          <button
            onClick={() => navigate('/about')}
            className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center">
              <Info className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="flex-1 text-left font-medium text-slate-700 dark:text-slate-200 text-sm">About GY DATA</span>
            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
          </button>
        </div>
      </AnimatedCard>

      {/* Logout */}
      <AnimatedCard delay={0.3}>
        <button
          onClick={() => setShowLogout(true)}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-error-50 dark:bg-error-500/10 border border-error-100 dark:border-error-500/20 hover:bg-error-100 dark:hover:bg-error-500/20 transition-all mt-3"
        >
          <div className="w-10 h-10 rounded-xl bg-error-100 dark:bg-error-500/20 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-error-600 dark:text-error-400" />
          </div>
          <span className="flex-1 text-left font-semibold text-error-600 dark:text-error-400 text-sm">Logout</span>
        </button>
      </AnimatedCard>

      <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-6">GY DATA v1.0.0</p>

      {/* Logout Modal */}
      <Modal open={showLogout} onClose={() => setShowLogout(false)} size="sm">
        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl bg-error-100 dark:bg-error-500/20 flex items-center justify-center mx-auto mb-4">
            <LogOut className="w-8 h-8 text-error-600 dark:text-error-400" />
          </div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-1">Logout?</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Are you sure you want to log out of your account?</p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowLogout(false)}>Cancel</Button>
            <Button variant="danger" fullWidth onClick={logout}>Logout</Button>
          </div>
        </div>
      </Modal>

      {/* Change Login PIN Modal */}
      <ChangePinModal
        open={showChangeLogin}
        onClose={() => setShowChangeLogin(false)}
        type="login"
        length={6}
        user={user}
        onSuccess={refreshUser}
      />

      {/* Change Purchase PIN Modal */}
      <ChangePinModal
        open={showChangePurchase}
        onClose={() => setShowChangePurchase(false)}
        type="purchase"
        length={4}
        user={user}
        onSuccess={refreshUser}
      />
    </div>
  );
}

function ChangePinModal({ open, onClose, type, length, user, onSuccess }: {
  open: boolean; onClose: () => void; type: 'login' | 'purchase'; length: number; user: any; onSuccess: () => void;
}) {
  const [stage, setStage] = useState<'old' | 'new' | 'confirm' | 'done'>('old');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const col = type === 'login' ? 'login_pin' : 'purchase_pin';
  const title = type === 'login' ? 'Login PIN' : 'Purchase PIN';

  const handleOld = (val: string) => {
    if (val !== user?.[col]) { setError('Incorrect current PIN'); return; }
    setError('');
    setStage('new');
  };

  const handleNew = (val: string) => {
    if (val === user?.[col]) { setError('New PIN cannot be same as old'); return; }
    setError('');
    setStage('confirm');
  };

  const handleConfirm = async (val: string) => {
    if (val !== newPin) { setError('PINs do not match'); setConfirmPin(''); return; }
    setLoading(true);
    setError('');
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({ [col]: val, updated_at: new Date().toISOString() })
        .eq('phone', user.phone);
      if (err) throw err;
      await onSuccess();
      setStage('done');
    } catch {
      setError('Failed to update PIN. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStage('old'); setOldPin(''); setNewPin(''); setConfirmPin(''); setError('');
    onClose();
  };

  const labels: Record<string, string> = {
    old: `Enter Current ${title}`,
    new: `Enter New ${title}`,
    confirm: `Confirm New ${title}`,
    done: `${title} Changed!`,
  };

  return (
    <Modal open={open} onClose={handleClose} size="sm">
      <div className="text-center">
        <div className="w-16 h-16 rounded-3xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-1">Change {title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{labels[stage]}</p>

        {stage === 'done' ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }} className="py-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-success-500/30">
              <Check className="w-10 h-10 text-white" />
            </div>
            <Button fullWidth onClick={handleClose}>Done</Button>
          </motion.div>
        ) : (
          <>
            <PinInput
              length={length}
              value={stage === 'old' ? oldPin : stage === 'new' ? newPin : confirmPin}
              onChange={(v) => {
                if (stage === 'old') setOldPin(v);
                else if (stage === 'new') setNewPin(v);
                else setConfirmPin(v);
              }}
              onComplete={(v) => {
                if (stage === 'old') handleOld(v);
                else if (stage === 'new') handleNew(v);
                else handleConfirm(v);
              }}
              error={!!error}
            />
            {error && <p className="text-sm text-error-500 mt-3">{error}</p>}
            {loading && <p className="text-sm text-primary-500 mt-3">Updating...</p>}
            {stage !== 'old' && (
              <Button variant="secondary" fullWidth className="mt-4" onClick={() => { setStage(stage === 'confirm' ? 'new' : 'old'); setError(''); }}>
                Back
              </Button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
