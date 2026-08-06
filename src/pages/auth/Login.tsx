import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Fingerprint, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../components/Logo';
import PinInput from '../../components/ui/PinInput';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [step, setStep] = useState<'phone' | 'pin'>('phone');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 11) {
      setError('Enter a valid 11-digit phone number');
      return;
    }
    setError('');
    setStep('pin');
  };

  const handlePinComplete = async (val: string) => {
    setLoading(true);
    setError('');
    const { error: err } = await login(phone.replace(/\D/g, ''), val);
    if (err) {
      setError(err);
      setPin('');
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(t);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-5 py-8">
      <div className="w-full max-w-md">
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(15,23,42,0.07)] ring-1 ring-slate-100/80 px-6 sm:px-10 py-10 sm:py-12"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <Logo size="lg" />
          </motion.div>

          <AnimatePresence mode="wait">
            {step === 'phone' ? (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-[26px] sm:text-3xl font-bold font-display text-navy-900 mb-2 text-center">Welcome Back</h1>
                <p className="text-slate-500 text-sm text-center mb-7">Enter your phone number to continue</p>
                <form onSubmit={handlePhoneSubmit} className="space-y-5">
                  <Input
                    label="Phone Number"
                    prefix="+234"
                    type="tel"
                    inputMode="numeric"
                    placeholder="801 234 5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    error={error}
                    autoFocus
                    className="!border-slate-200 !rounded-2xl !bg-slate-50/60 focus:!ring-blue-500/30 focus:!border-blue-500"
                  />
                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    className="!bg-navy-900 hover:!bg-navy-800 !shadow-[0_6px_20px_rgba(15,23,42,0.25)] !rounded-2xl"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="pin"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-7 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-navy-900/5 flex items-center justify-center mb-4 mx-auto">
                    <Phone className="w-7 h-7 text-navy-900" />
                  </div>
                  <h1 className="text-[26px] sm:text-3xl font-bold font-display text-navy-900 mb-2">Enter PIN</h1>
                  <p className="text-slate-500 text-sm">Enter your 6-digit Login PIN</p>
                </div>
                <div className="mb-7">
                  <PinInput
                    length={6}
                    value={pin}
                    onChange={setPin}
                    onComplete={handlePinComplete}
                    error={!!error}
                  />
                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-sm text-error-500 mt-3"
                    >
                      {error}
                    </motion.p>
                  )}
                  {loading && (
                    <p className="text-center text-sm text-blue-600 mt-3 font-medium">Verifying...</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => { setStep('phone'); setPin(''); setError(''); }}
                    className="!rounded-2xl"
                  >
                    Back
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => alert('Biometric authentication would activate here')}
                    className="!rounded-2xl"
                  >
                    <Fingerprint className="w-5 h-5" /> Biometric
                  </Button>
                </div>
                <div className="text-center mt-6">
                  <button
                    onClick={() => alert('PIN reset would be handled via SMS OTP here')}
                    className="text-sm text-blue-600 font-medium hover:underline"
                  >
                    Forgot PIN?
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer links */}
        <div className="text-center mt-7">
          <p className="text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-navy-900 font-semibold hover:underline">
              Create one
            </Link>
          </p>

          {/* Quick Access Action Buttons */}
          <div className="mt-6 flex items-center justify-center gap-6">
            <SecretCircle onClick={() => navigate('/admin')} />
            <SecretCircle onClick={() => navigate(user ? '/home' : '/login')} />
            <SecretCircle onClick={() => navigate(user ? '/wallet' : '/login')} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SecretCircle({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      onClick={onClick}
      aria-label=""
      className="w-[44px] h-[44px] rounded-full bg-navy-900/70 shadow-[0_0_10px_2px_rgba(59,130,246,0.18)] opacity-75 hover:opacity-100 transition-opacity duration-200"
    />
  );
}
