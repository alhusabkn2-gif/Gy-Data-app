import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, ShieldCheck, Star } from 'lucide-react';

import Logo from '../../components/Logo';
import { useAuth } from '../../contexts/AuthContext';

const PIN_LENGTH = 6;

export default function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading, login } = useAuth();

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pinInputRef = useRef<HTMLInputElement | null>(null);
  const adminTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const cleanPhone = (value: string) =>
    value.replace(/\D/g, '').slice(0, 11);

  const cleanPin = (value: string) =>
    value.replace(/\D/g, '').slice(0, PIN_LENGTH);

  const handlePhoneChange = (value: string) => {
    const next = cleanPhone(value);

    setPhone(next);
    setError('');

    if (next.length === 11) {
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 80);
    }
  };

  const handlePinChange = (value: string) => {
    const next = cleanPin(value);

    setPin(next);
    setError('');

    if (next.length === PIN_LENGTH) {
      setTimeout(() => {
        void handleLogin(next);
      }, 120);
    }
  };

  const handlePinKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (
      event.key === 'Backspace' &&
      pin.length === 0
    ) {
      pinInputRef.current?.blur();
    }
  };

  async function handleLogin(pinOverride?: string) {
    if (loading) return;

    const finalPin = pinOverride ?? pin;

    setError('');

    if (phone.length !== 11) {
      setError('Enter your 11-digit phone number.');
      return;
    }

    if (finalPin.length !== PIN_LENGTH) {
      setError('Enter your 6-digit PIN.');
      return;
    }

    setLoading(true);

    try {
      const result = await login(phone, finalPin);

      if (result.error) {
        setError(result.error);
        setPin('');
        return;
      }

      navigate('/', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to login. Please try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  const startAdminPress = () => {
    if (adminTimerRef.current) {
      clearTimeout(adminTimerRef.current);
    }

    adminTimerRef.current = setTimeout(() => {
      navigate('/super-admin-login');
      adminTimerRef.current = null;
    }, 3000);
  };

  const cancelAdminPress = () => {
    if (adminTimerRef.current) {
      clearTimeout(adminTimerRef.current);
      adminTimerRef.current = null;
    }
  };

  const canContinue =
    phone.length === 11 &&
    pin.length === PIN_LENGTH &&
    !loading;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f6f8fb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-[#071d49]/15 border-t-[#071d49] animate-spin" />
          <p className="text-sm font-semibold text-slate-500">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f8fb]">

      {/* BACKGROUND DECORATION */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute -right-28 -top-24 h-80 w-80 rounded-full bg-[#071d49]/10" />

        <div className="absolute -left-28 bottom-[-80px] h-80 w-80 rounded-full bg-[#ff9736]/10" />

        <div className="absolute right-8 top-40 h-16 w-16 rounded-full bg-[#ff9736]/20" />

        <div className="absolute left-8 top-72 h-10 w-10 rounded-full bg-[#071d49]/5" />

        <Star
          className="absolute right-20 top-24 h-5 w-5 text-[#ff9736]/25"
          fill="currentColor"
        />

        <Star
          className="absolute left-10 bottom-44 h-4 w-4 text-[#071d49]/10"
          fill="currentColor"
        />

        <div className="absolute bottom-24 right-16 h-3 w-3 rounded-full bg-[#ff9736]/20" />

        <div className="absolute left-20 top-32 h-2 w-2 rounded-full bg-[#071d49]/15" />
      </div>

      {/* MAIN */}

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-8">

        {/* BRAND */}

        <div className="pt-10 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_8px_25px_rgba(7,29,73,0.08)]">
            <Logo />
          </div>

          <h1 className="mt-3 text-xl font-black tracking-tight text-[#071d49]">
            GY DATA
          </h1>

          <p className="mt-1 text-xs font-medium text-slate-400">
            Endless Joy
          </p>

        </div>

        {/* LOGIN CARD */}

        <section className="mt-7 rounded-[28px] border border-slate-100 bg-white p-5 shadow-[0_18px_55px_rgba(7,29,73,0.10)]">

          <div className="mb-6">
            <h2 className="text-[25px] font-black tracking-tight text-[#071d49]">
              Welcome Back
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Login to continue to your account
            </p>
          </div>

          {/* PHONE */}

          <label className="mb-2 block text-xs font-bold text-slate-700">
            Phone Number
          </label>

          <div className="flex h-14 overflow-hidden rounded-2xl border border-slate-200 bg-[#f8fafc] transition focus-within:border-[#071d49] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#071d49]/5">

            <div className="flex items-center border-r border-slate-200 px-4 text-sm font-black text-[#071d49]">
              +234
            </div>

            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(event) =>
                handlePhoneChange(event.target.value)
              }
              placeholder="080 1234 5678"
              maxLength={11}
              className="min-w-0 flex-1 bg-transparent px-4 text-base font-semibold text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>

          {/* PIN */}

          <div className="mt-6">

            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Login PIN
              </label>

              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                6 digits
              </span>
            </div>

            <div className="relative">

              <input
                ref={pinInputRef}
                type={showPin ? 'text' : 'password'}
               
