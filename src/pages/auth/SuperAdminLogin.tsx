import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

import Logo from '../../components/Logo';
import PinInput from '../../components/ui/PinInput';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export const SUPER_ADMIN_SESSION = 'gydata_super_admin_session';

const SUPER_ADMIN_EMAIL = 'sadmin@gyd.com';
const SUPER_ADMIN_PIN = '1251';

export default function SuperAdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(SUPER_ADMIN_SESSION) === 'true') {
      navigate('/super-admin', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail !== SUPER_ADMIN_EMAIL) {
      setError('Invalid Super Admin email');
      return;
    }

    if (pin.length !== 4) {
      setError('Enter your 4-digit Super Admin PIN');
      return;
    }

    setLoading(true);
    setError('');

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (pin !== SUPER_ADMIN_PIN) {
      setError('Invalid Super Admin PIN');
      setPin('');
      setLoading(false);
      return;
    }

    localStorage.setItem(SUPER_ADMIN_SESSION, 'true');

    navigate('/super-admin', { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020b2b] px-5 py-8 flex items-center justify-center">

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -left-28 top-[25%] w-80 h-80 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -right-28 bottom-[5%] w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>

        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="
            bg-white
            rounded-[30px]
            px-6
            sm:px-10
            py-10
            shadow-[0_0_55px_rgba(37,99,235,0.25)]
          "
        >

          <div className="flex justify-center mb-7">
            <Logo size="lg" />
          </div>

          <div className="flex justify-center mb-5">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100">
              <ShieldCheck className="w-4 h-4 text-blue-600" />

              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
                Super Admin
              </span>
            </div>
          </div>

          <div className="text-center mb-7">
            <h1 className="text-[27px] sm:text-3xl font-bold font-display text-[#07143d]">
              Super Admin Login
            </h1>

            <p className="text-slate-500 text-sm mt-2">
              Secure access to the GY Data control center
            </p>
          </div>

          <div className="space-y-5">

            <Input
              label="Email Address"
              type="email"
              inputMode="email"
              placeholder="sadmin@gyd.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              error={error && pin.length === 0 ? error : ''}
              autoFocus
              className="
                !border-slate-200
                !rounded-2xl
                !bg-slate-50/70
                focus:!border-blue-500
                focus:!ring-blue-500/20
              "
            />

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-700">
                  Super Admin PIN
                </label>

                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  4 digits
                </span>
              </div>

              <PinInput
                length={4}
                value={pin}
                onChange={(value) => {
                  setPin(value);
                  setError('');
                }}
                onComplete={(value) => setPin(value)}
                error={!!error && pin.length > 0}
              />

              {error && pin.length > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm text-red-500 mt-3"
                >
                  {error}
                </motion.p>
              )}

              {loading && (
                <p className="text-center text-sm text-blue-600 mt-3 font-medium">
                  Verifying Super Admin...
                </p>
              )}
            </div>

            <Button
              type="button"
              fullWidth
              size="lg"
              onClick={handleLogin}
              loading={loading}
              className="
                !bg-gradient-to-r
                !from-[#071b55]
                !via-[#082b82]
                !to-[#063da5]
                hover:!from-[#061746]
                hover:!to-[#06358f]
                !rounded-2xl
                !shadow-[0_7px_20px_rgba(7,29,91,0.30)]
              "
            >
              Enter Super Admin
              <ArrowRight className="w-5 h-5" />
            </Button>

          </div>
        </motion.div>

        <p className="text-center text-white/20 text-[9px] uppercase tracking-[0.3em] mt-6">
          GY DATA · SUPER ADMIN CONTROL CENTER
        </p>

      </div>
    </div>
  );
}
