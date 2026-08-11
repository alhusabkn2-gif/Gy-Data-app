import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Phone } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../components/Logo';
import PinInput from '../../components/ui/PinInput';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const SECRET_HOLD_TIME = 2000;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const secretTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startSecretHold = () => {
    if (secretTimerRef.current) {
      clearTimeout(secretTimerRef.current);
    }

    secretTimerRef.current = setTimeout(() => {
      secretTimerRef.current = null;
      navigate('/super-admin-login');
    }, SECRET_HOLD_TIME);
  };

  const cancelSecretHold = () => {
    if (secretTimerRef.current) {
      clearTimeout(secretTimerRef.current);
      secretTimerRef.current = null;
    }
  };

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

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        {/* TOP-LEFT SPHERICAL SHAPE */}
        <div
          className="
            absolute
            -left-20
            -top-20
            h-64
            w-64
            rounded-full
            border
            border-white/[0.04]
            bg-blue-400/[0.025]
            shadow-[inset_0_0_70px_rgba(96,165,250,0.035)]
          "
        />

        {/* BOTTOM-RIGHT SPHERICAL SHAPE */}
        <div
          className="
            absolute
            -right-24
            -bottom-24
            h-72
            w-72
            rounded-full
            border
            border-white/[0.04]
            bg-blue-400/[0.025]
            shadow-[inset_0_0_80px_rgba(96,165,250,0.035)]
          "
        />

        {/* Very subtle ambient glow */}
        <div className="absolute -left-24 top-[30%] h-72 w-72 rounded-full bg-blue-600/[0.08] blur-3xl" />
        <div className="absolute -right-24 bottom-[10%] h-80 w-80 rounded-full bg-blue-500/[0.07] blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="
            rounded-[30px]
            bg-white
            px-6
            py-10
            shadow-[0_0_45px_rgba(37,99,235,0.22)]
            ring-1
            ring-blue-100
            sm:px-10
          "
        >

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45 }}
            className="mb-8 flex justify-center"
          >
            <Logo size="lg" />
          </motion.div>

          {/* Welcome */}
          <div className="mb-7 text-center">
            <h1 className="font-display text-[28px] font-bold text-[#07143d] sm:text-3xl">
              Welcome Back
            </h1>

            <p className="mt-2 text-sm text-slate-500">
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
              error={
                error && phone.replace(/\D/g, '').length < 11
                  ? error
                  : ''
              }
              autoFocus
              className="
                !rounded-2xl
                !border-slate-200
                !bg-white
                focus:!border-blue-500
                focus:!ring-blue-500/20
              "
            />

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
                !rounded-2xl
                !bg-gradient-to-r
                !from-[#071b55]
                !via-[#082b82]
                !to-[#063da5]
                !shadow-[0_7px_20px_rgba(7,29,91,0.30)]
              "
            >
              Continue
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          {/* OR */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-sm font-medium text-slate-400">OR</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* PIN */}
          <div id="login-pin-section">

            <div className="mb-6 text-center">
              <div className="
                mx-auto
                mb-3
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-[#071b55]/5
              ">
                <Phone className="h-6 w-6 text-[#071b55]" />
              </div>

              <h2 className="font-display text-[25px] font-bold text-[#07143d]">
                Enter PIN
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter your 6-digit Login PIN
              </p>
            </div>

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
                  className="mt-3 text-center text-sm text-red-500"
                >
                  {error}
                </motion.p>
              )}

              {loading && (
                <p className="mt-3 text-center text-sm font-medium text-blue-600">
                  Verifying...
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
                !rounded-2xl
                !bg-gradient-to-r
                !from-[#071b55]
                !via-[#082b82]
                !to-[#063da5]
                !shadow-[0_7px_20px_rgba(7,29,91,0.30)]
              "
            >
              Login
              <ArrowRight className="h-5 w-5" />
            </Button>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() =>
                  alert('PIN reset would be handled via SMS OTP here')
                }
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Forgot PIN?
              </button>
            </div>
          </div>
        </motion.div>

        {/* Register */}
        <div className="mt-6 text-center">
          <p className="text-sm text-white/50">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-white hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>

        {/* Secret / decorative circles */}
        <div className="relative mt-7 h-28">

          {/* Circle 1 — SUPER ADMIN SECRET */}
          <SecretCircle
            className="absolute left-[18%] top-0"
            secret
            onPointerDown={startSecretHold}
            onPointerUp={cancelSecretHold}
            onPointerCancel={cancelSecretHold}
            onPointerLeave={cancelSecretHold}
          />

          {/* Circle 2 — decorative only */}
          <SecretCircle className="absolute right-[18%] top-0" />

          {/* Circle 3 — decorative only */}
          <SecretCircle className="absolute left-[42%] bottom-0" />

          {/* Circle 4 — decorative spherical shape */}
          <SecretCircle className="absolute right-[8%] bottom-0 spherical" />

        </div>
      </div>
    </div>
  );
}

function SecretCircle({
  secret = false,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  className = '',
}: {
  secret?: boolean;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  onPointerCancel?: () => void;
  onPointerLeave?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden={!secret}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerLeave}
      onContextMenu={(event) => event.preventDefault()}
      className={`
        h-[48px]
        w-[48px]
        rounded-full
        border
        border-white/[0.025]
        bg-white/[0.015]
        opacity-[0.08]
        shadow-none
        outline-none
        focus:outline-none
        active:outline-none
        select-none
        touch-none
        cursor-default
        ${className}
      `}
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'none',
      }}
    >
      {secret ? null : null}
    </button>
  );
}s.

Bayan ka manna: Save → Commit → Push → Render build.
