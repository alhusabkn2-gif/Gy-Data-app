import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Gift, Check, ShieldCheck, Lock, PartyPopper,
  ArrowRight, ArrowLeft, Sparkles, Phone,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../components/Logo';
import PinInput from '../../components/ui/PinInput';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface FormData {
  full_name: string;
  phone: string;
  email: string;
  referral_code: string;
  login_pin: string;
  login_pin_confirm: string;
  purchase_pin: string;
  purchase_pin_confirm: string;
}

const STEP_META = [
  { title: 'Personal Information', subtitle: 'Tell us about yourself', icon: User },
  { title: 'Login Security', subtitle: 'Secure your account access', icon: ShieldCheck },
  { title: 'Purchase Security', subtitle: 'Protect your transactions', icon: Lock },
  { title: 'Account Created', subtitle: 'Welcome aboard', icon: PartyPopper },
];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FormData>({
    full_name: '', phone: '', email: '', referral_code: '',
    login_pin: '', login_pin_confirm: '', purchase_pin: '', purchase_pin_confirm: '',
  });

  const update = (key: keyof FormData, val: string) => {
    setData((prev) => ({ ...prev, [key]: val }));
    setError('');
  };

  // PIN strength: checks for unique digits, sequences, repeats
  const loginPinStrength = useMemo(() => {
    const pin = data.login_pin;
    if (pin.length < 6) return { score: 0, label: '', color: '' };
    const unique = new Set(pin).size;
    const isSequential = '123456' === pin || '012345' === pin || '654321' === pin;
    const isRepeated = unique === 1;
    if (isRepeated || isSequential) return { score: 1, label: 'Weak', color: 'bg-error-500' };
    if (unique >= 4) return { score: 3, label: 'Strong', color: 'bg-success-500' };
    if (unique >= 3) return { score: 2, label: 'Fair', color: 'bg-warning-500' };
    return { score: 1, label: 'Weak', color: 'bg-error-500' };
  }, [data.login_pin]);

  const loginPinsMatch = data.login_pin_confirm.length === 6 && data.login_pin === data.login_pin_confirm;
  const purchasePinsMatch = data.purchase_pin_confirm.length === 4 && data.purchase_pin === data.purchase_pin_confirm;

  const validateStep = (s: number): boolean => {
    if (s === 0) {
      if (!data.full_name.trim()) { setError('Enter your full name'); return false; }
      if (data.phone.replace(/\D/g, '').length < 11) { setError('Enter a valid 11-digit phone number'); return false; }
      return true;
    }
    if (s === 1) {
      if (data.login_pin.length !== 6) { setError('Login PIN must be 6 digits'); return false; }
      if (loginPinStrength.score <= 1) { setError('PIN is too weak. Avoid repeated or sequential digits.'); return false; }
      if (data.login_pin !== data.login_pin_confirm) { setError('PINs do not match'); return false; }
      return true;
    }
    if (s === 2) {
      if (data.purchase_pin.length !== 4) { setError('Purchase PIN must be 4 digits'); return false; }
      if (data.purchase_pin !== data.purchase_pin_confirm) { setError('PINs do not match'); return false; }
      return true;
    }
    return true;
  };

  const next = () => {
    if (!validateStep(step)) return;
    if (step === 2) { handleSubmit(); return; }
    setStep((s) => s + 1);
    setError('');
  };

  const back = () => {
    setStep((s) => Math.max(0, s - 1));
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    const { error: err } = await register({
      full_name: data.full_name.trim(),
      phone: data.phone.replace(/\D/g, ''),
      email: data.email.trim() || undefined,
      referral_code: data.referral_code.trim() || undefined,
      login_pin: data.login_pin,
      purchase_pin: data.purchase_pin,
    });
    if (err) {
      setError(err);
      setStep(0);
    } else {
      setStep(3);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary-50 via-slate-50 to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary-300/20 dark:bg-primary-600/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-300/15 dark:bg-accent-600/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-md mx-auto w-full relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Logo size="lg" />
        </motion.div>

        {/* Progress Indicator */}
        {step < 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-7"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400 tracking-wide uppercase">
                Step {step + 1} of 4
              </span>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {STEP_META[step].title}
              </span>
            </div>
            {/* Progress bar */}
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: i <= step ? '100%' : '0%' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-700"
                  />
                </div>
              ))}
            </div>
            {/* Step circles */}
            <div className="flex items-center justify-between mt-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: i === step ? 1.1 : 1,
                      backgroundColor: i < step ? '#16a34a' : i === step ? '#2563eb' : '#e2e8f0',
                    }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i <= step ? 'text-white shadow-lg' : 'text-slate-400'
                    } ${i === step ? 'shadow-primary-600/30' : ''}`}
                  >
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </motion.div>
                  {i < 2 && (
                    <div className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${
                      i < step ? 'bg-success-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* STEP 1 — Personal Information */}
          {step === 0 && (
            <motion.div
              key="s0"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="mb-6">
                <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Create Account</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Fill in your details to get started</p>
              </div>
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  icon={<User className="w-5 h-5" />}
                  value={data.full_name}
                  onChange={(e) => update('full_name', e.target.value)}
                  error={error}
                  autoFocus
                />
                <Input
                  label="Phone Number"
                  prefix="+234"
                  type="tel"
                  inputMode="numeric"
                  placeholder="801 234 5678"
                  icon={<Phone className="w-5 h-5" />}
                  value={data.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
                <Input
                  label="Email (Optional)"
                  placeholder="you@email.com"
                  type="email"
                  icon={<Mail className="w-5 h-5" />}
                  value={data.email}
                  onChange={(e) => update('email', e.target.value)}
                />
                <Input
                  label="Referral Code (Optional)"
                  placeholder="ABC123"
                  icon={<Gift className="w-5 h-5" />}
                  value={data.referral_code}
                  onChange={(e) => update('referral_code', e.target.value.toUpperCase())}
                />
              </div>
              <Button fullWidth size="lg" className="mt-6" onClick={next}>
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* STEP 2 — Login Security */}
          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-600/25">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Login PIN</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">6-digit code to access your account</p>
                </div>
              </div>

              {/* Info banner */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 mb-6">
                <ShieldCheck className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-primary-700 dark:text-primary-300 leading-relaxed">
                  This PIN will be required every time you log in to GY DATA. Keep it secure and do not share it with anyone.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Create Login PIN</label>
                  <PinInput length={6} value={data.login_pin} onChange={(v) => update('login_pin', v)} error={!!error} />
                </div>

                {/* PIN Strength Indicator */}
                <AnimatePresence>
                  {data.login_pin.length === 6 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5"
                    >
                      <div className="flex gap-1.5">
                        {[1, 2, 3].map((bar) => (
                          <div
                            key={bar}
                            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                              bar <= loginPinStrength.score ? loginPinStrength.color : 'bg-slate-200 dark:bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${
                        loginPinStrength.label === 'Strong' ? 'text-success-600 dark:text-success-400'
                        : loginPinStrength.label === 'Fair' ? 'text-warning-600 dark:text-warning-400'
                        : 'text-error-500'
                      }`}>
                        PIN Strength: {loginPinStrength.label}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Confirm Login PIN</label>
                  <PinInput length={6} value={data.login_pin_confirm} onChange={(v) => update('login_pin_confirm', v)} error={!!error} autoFocus={false} />
                </div>

                {/* Match indicator */}
                <AnimatePresence>
                  {data.login_pin_confirm.length === 6 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      {loginPinsMatch ? (
                        <>
                          <div className="w-5 h-5 rounded-full bg-success-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-medium text-success-600 dark:text-success-400">PINs match</span>
                        </>
                      ) : (
                        <span className="text-xs font-medium text-error-500">PINs do not match</span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm text-error-500 mt-4"
                >
                  {error}
                </motion.p>
              )}
              <div className="flex gap-3 mt-6">
                <Button variant="secondary" size="lg" onClick={back}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button fullWidth size="lg" onClick={next} loading={loading}>
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Purchase Security */}
          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-lg shadow-accent-600/25">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Purchase PIN</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">4-digit code for transactions</p>
                </div>
              </div>

              {/* Info banner */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-accent-50 dark:bg-accent-500/10 border border-accent-100 dark:border-accent-500/20 mb-6">
                <Lock className="w-4 h-4 text-accent-600 dark:text-accent-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-accent-700 dark:text-accent-300 leading-relaxed">
                  This PIN is required before every purchase or wallet transaction. It adds an extra layer of security to protect your funds.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Create Purchase PIN</label>
                  <PinInput length={4} value={data.purchase_pin} onChange={(v) => update('purchase_pin', v)} error={!!error} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">Confirm Purchase PIN</label>
                  <PinInput length={4} value={data.purchase_pin_confirm} onChange={(v) => update('purchase_pin_confirm', v)} error={!!error} autoFocus={false} />
                </div>

                {/* Match indicator */}
                <AnimatePresence>
                  {data.purchase_pin_confirm.length === 4 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      {purchasePinsMatch ? (
                        <>
                          <div className="w-5 h-5 rounded-full bg-success-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-medium text-success-600 dark:text-success-400">PINs match</span>
                        </>
                      ) : (
                        <span className="text-xs font-medium text-error-500">PINs do not match</span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm text-error-500 mt-4"
                >
                  {error}
                </motion.p>
              )}
              <div className="flex gap-3 mt-6">
                <Button variant="secondary" size="lg" onClick={back}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button fullWidth size="lg" onClick={next} loading={loading}>
                  Create Account <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4 — Success */}
          {step === 3 && (
            <motion.div
              key="s3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 relative"
            >
              {/* Confetti sparkles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: [0, (i - 3) * 40],
                    y: [0, -60 - i * 10],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: 0.3 + i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                  className="absolute left-1/2 top-1/3"
                >
                  <Sparkles className="w-4 h-4 text-primary-400" />
                </motion.div>
              ))}

              {/* Success circle */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 150, delay: 0.2 }}
                className="relative w-28 h-28 rounded-full bg-gradient-to-br from-success-400 via-success-500 to-success-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-success-500/40"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring', damping: 15 }}
                >
                  <PartyPopper className="w-14 h-14 text-white" />
                </motion.div>
                {/* Ripple */}
                <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 1.5, delay: 0.5, repeat: Infinity, repeatDelay: 0.5 }}
                  className="absolute inset-0 rounded-full border-4 border-success-400"
                />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-3xl font-bold font-display text-slate-900 dark:text-white mb-2"
              >
                Welcome to GY DATA!
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-slate-500 dark:text-slate-400 mb-2"
              >
                Your account has been created successfully.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-sm text-slate-400 dark:text-slate-500 mb-8"
              >
                Start enjoying premium fintech services today.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Button fullWidth size="lg" onClick={() => navigate('/')}>
                  Continue to Dashboard <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sign in link */}
        {step < 3 && (
          <div className="mt-auto pt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
