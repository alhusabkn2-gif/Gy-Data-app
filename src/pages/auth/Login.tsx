import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../components/Logo';
import PinInput from '../../components/ui/PinInput';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length < 11) {
      setError('Enter a valid 11-digit phone number');
      return;
    }

    if (pin.length !== 6) {
      setError('Enter your 6-digit Login PIN');
      return;
    }

    setLoading(true);
    setError('');

    const { error: err } = await login(cleanPhone, pin);

    if (err) {
      setError(err);
      setPin('');
      setLoading(false);
      return;
    }

    navigate('/');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020b2b] px-5 py-8 flex items-center justify-center">

      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-24 top-[30%] w-72 h-72 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -right-24 bottom-[10%] w-80 h-80 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="absolute left-0 bottom-20 w-48 h-48 rounded-full border border-blue-500/10" />
        <div className="absolute right-[-60px] top-20 w-52 h-52 rounded-full border border-blue-500/10" />

        <div className="absolute left-10 bottom-28 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_18px_6px_rgba(59,130,246,0.35)]" />
        <div className="absolute right-8 top-40 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_15px_5px_rgba(59,130,246,0.3)]" />
        <div className="absolute right-16 bottom-40 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_18px_5px_rgba(59,130,246,0.3)]" />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="
            bg-white
            rounded-[30px]
            px-6
            sm:px-10
            py-10
            shadow-[0_0_45px_rgba(37,99,235,0.22)]
            ring-1
            ring-blue-100
          "
        >

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45 }}
            className="flex justify-center mb-8"
          >
            <Logo size="lg" />
          </motion.div>

          {/* Welcome */}
          <div className="text-center mb-7">
            <h1 className="text-[28px] sm:text-3xl font-bold font-display text-[#07143d]">
              Welcome Back
            </h1>

            <p className="text-slate-500 text-sm mt-2">
              Enter your phone number to continue
            </p>
          </div>

          {/* Phone */}
          <div className="space-y-5">
            <Input
              label="Phone Number"
              prefix="+234"
              type="tel"
              inputMode="numeric"
              placeholder="801 234 5678"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError('');
              }}
              error={error && phone.replace(/\D/g, '').length < 11 ? error : ''}
              autoFocus
              className="
                !border-slate-200
                !rounded-2xl
                !bg-white
                focus:!border-blue-500
                focus:!ring-blue-500/20
              "
            />

            {/* Continue */}
            <Button
              type="button"
              fullWidth
              size="lg"
              onClick={() => {
                if (phone.replace(/\D/g, '').length < 11) {
                  setError('Enter a valid 11-digit phone number');
                  return;
                }

                setError('');
                document
                  .getElementById('login-pin-section')
                  ?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  });
              }}
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
              Continue
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* OR */}
          <div className="flex items-center gap-4 my-8">
            <div className="h-px flex-1 bg-slate-200" />

            <span className="text-sm font-medium text-slate-400">
              OR
            </span>

            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* PIN section */}
          <div id="login-pin-section">

            <div className="text-center mb-6">

              <div className="
                w-12
                h-12
                rounded-2xl
                bg-[#071b55]/5
                flex
                items-center
                justify-center
                mx-auto
                mb-3
              ">
                <Phone className="w-6 h-6 text-[#071b55]" />
              </div>

              <h2 className="
                text-[25px]
                font-bold
                font-display
                text-[#07143d]
              ">
                Enter PIN
              </h2>

              <p className="text-slate-500 text-sm mt-1">
                Enter your 6-digit Login PIN
              </p>
            </div>

            {/* PIN */}
            <div className="mb-6">
              <PinInput
                length={6}
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
                  Verifying...
                </p>
              )}
            </div>

            {/* Login */}
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
              Login
              <ArrowRight className="w-5 h-5" />
            </Button>

            {/* Forgot PIN */}
            <div className="text-center mt-5">
              <button
                type="button"
                onClick={() =>
                  alert('PIN reset would be handled via SMS OTP here')
                }
                className="
                  text-sm
                  text-blue-600
                  font-medium
                  hover:underline
                "
              >
                Forgot PIN?
              </button>
            </div>
          </div>
        </motion.div>

        {/* Register */}
        <div className="text-center mt-6">
          <p className="text-sm text-white/50">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-white font-semibold hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>

        {/* Secret buttons — plain & very subtle */}
        <div className="relative mt-7 h-28 opacity-[0.08]">

          <SecretCircle
            className="absolute left-[18%] top-0"
            onClick={() => navigate('/admin')}
          />

          <SecretCircle
            className="absolute right-[18%] top-0"
            onClick={() => navigate(user ? '/home' : '/login')}
          />

          <SecretCircle
            className="absolute left-[42%] bottom-0"
            onClick={() => navigate(user ? '/wallet' : '/login')}
          />

          <SecretCircle
            className="absolute right-[8%] bottom-0"
            onClick={() => navigate(user ? '/wallet' : '/login')}
          />

        </div>
      </div>
    </div>
  );
}

function SecretCircle({
  onClick,
  className = '',
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label=""
      className={`
        w-[48px]
        h-[48px]
        rounded-full
        bg-blue-500
        border
        border-blue-300/20
        shadow-[0_0_18px_rgba(37,99,235,0.25)]
        ${className}
      `}
    />
  );
}
