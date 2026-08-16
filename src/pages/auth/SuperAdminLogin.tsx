import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  LockKeyhole,
} from 'lucide-react';

import {
  motion,
} from 'framer-motion';

import Logo from '../../components/Logo';
import PinInput from '../../components/ui/PinInput';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';


export const SUPER_ADMIN_SESSION =
  'gydata_super_admin_session';


export const SUPER_ADMIN_SESSION_EXPIRY =
  'gydata_super_admin_session_expiry';


export default function SuperAdminLogin() {
  const navigate =
    useNavigate();

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    pin,
    setPin,
  ] = useState('');

  const [
    error,
    setError,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(false);


  /*
   * Check existing signed session.
   */
  useEffect(() => {
    const token =
      localStorage.getItem(
        SUPER_ADMIN_SESSION
      );

    const expiry =
      Number(
        localStorage.getItem(
          SUPER_ADMIN_SESSION_EXPIRY
        ) || 0
      );

    if (
      token &&
      expiry > Date.now()
    ) {
      navigate(
        '/super-admin',
        {
          replace: true,
        }
      );
    } else {
      localStorage.removeItem(
        SUPER_ADMIN_SESSION
      );

      localStorage.removeItem(
        SUPER_ADMIN_SESSION_EXPIRY
      );
    }
  }, [
    navigate,
  ]);


  /*
   * LOGIN
   */
  const handleLogin =
    async () => {
      const cleanEmail =
        email
          .trim()
          .toLowerCase();

      if (!cleanEmail) {
        setError(
          'Enter your Super Admin email'
        );
        return;
      }

      if (
        !/^\d{4}$/.test(pin)
      ) {
        setError(
          'Enter your 4-digit Super Admin PIN'
        );
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response =
          await fetch(
            '/api/auth/super-admin-login',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  email:
                    cleanEmail,

                  pin,
                }),
            }
          );

        const result =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (
          !response.ok ||
          result.success !==
            true ||
          !result.token
        ) {
          throw new Error(
            result.message ||
              'Invalid Super Admin credentials'
          );
        }

        /*
         * Store ONLY signed session token.
         *
         * Never store PIN.
         */
        localStorage.setItem(
          SUPER_ADMIN_SESSION,
          result.token
        );

        localStorage.setItem(
          SUPER_ADMIN_SESSION_EXPIRY,
          String(
            result.expiresAt ||
              Date.now() +
                12 *
                  60 *
                  60 *
                  1000
          )
        );

        navigate(
          '/super-admin',
          {
            replace: true,
          }
        );
      } catch (err) {
        console.error(
          'Super Admin login error:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Super Admin login failed'
        );

        setPin('');
      } finally {
        setLoading(false);
      }
    };


  /*
   * AUTO SUBMIT WHEN 4 PIN DIGITS
   */
  useEffect(() => {
    if (
      pin.length === 4 &&
      email.trim() &&
      !loading
    ) {
      handleLogin();
    }

    // Intentionally depend only on pin.
    // This prevents repeated submit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pin,
  ]);


  return (
    <div
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-[#020b2b]
        px-5
        py-8
        flex
        items-center
        justify-center
      "
    >

      {/* Background */}
      <div
        className="
          absolute
          inset-0
          pointer-events-none
          overflow-hidden
        "
      >

        <div
          className="
            absolute
            -left-28
            top-[25%]
            w-80
            h-80
            rounded-full
            bg-blue-600/10
            blur-3xl
          "
        />

        <div
          className="
            absolute
            -right-28
            bottom-[5%]
            w-96
            h-96
            rounded-full
            bg-blue-500/10
            blur-3xl
          "
        />

        <div
          className="
            absolute
            inset-0
            opacity-[0.025]
          "
          style={{
            backgroundImage:
              `
                linear-gradient(
                  white 1px,
                  transparent 1px
                ),
                linear-gradient(
                  90deg,
                  white 1px,
                  transparent 1px
                )
              `,
            backgroundSize:
              '28px 28px',
          }}
        />

      </div>


      <div
        className="
          relative
          z-10
          w-full
          max-w-md
        "
      >

        {/* Back */}
        <button
          type="button"
          onClick={() =>
            navigate(
              '/login'
            )
          }
          className="
            flex
            items-center
            gap-2
            text-white/50
            hover:text-white
            text-sm
            mb-5
            transition-colors
          "
        >
          <ArrowLeft
            className="w-4 h-4"
          />

          Back to Login
        </button>


        <motion.div
          initial={{
            opacity: 0,
            y: 25,
            scale: 0.97,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.5,
          }}
          className="
            bg-white
            rounded-[30px]
            px-6
            sm:px-10
            py-10
            shadow-[0_20px_70px_rgba(0,0,0,0.25)]
          "
        >

          {/* Logo */}
          <div
            className="
              flex
              justify-center
              mb-7
            "
          >
            <Logo
              size="lg"
            />
          </div>


          {/* Badge */}
          <div
            className="
              flex
              justify-center
              mb-5
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                px-4
                py-2
                rounded-full
                bg-blue-50
                border
                border-blue-100
              "
            >

              <ShieldCheck
                className="
                  w-4
                  h-4
                  text-blue-600
                "
              />

              <span
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-blue-700
                "
              >
                Super Admin
              </span>

            </div>
          </div>


          {/* Heading */}
          <div
            className="
              text-center
              mb-7
            "
          >

            <h1
              className="
                text-[27px]
                sm:text-3xl
                font-bold
                font-display
                text-[#07143d]
              "
            >
              Super Admin Login
            </h1>

            <p
              className="
                text-slate-500
                text-sm
                mt-2
              "
            >
              Secure access to the
              GY Data control center
            </p>

          </div>


          <div
            className="
              space-y-5
            "
          >

            {/* Email */}
            <Input
              label="Email Address"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Super Admin email"
              value={email}
              onChange={(e) => {
                setEmail(
                  e.target.value
                );

                setError('');
              }}
              error={
                error &&
                pin.length === 0
                  ? error
                  : ''
              }
              autoFocus
              className="
                !border-slate-200
                !rounded-2xl
                !bg-slate-50/70
                focus:!border-blue-500
                focus:!ring-blue-500/20
              "
            />


            {/* PIN */}
            <div>

              <div
                className="
                  flex
                  items-center
                  justify-between
                  mb-3
                "
              >

                <label
                  className="
                    text-sm
                    font-medium
                    text-slate-700
                  "
                >
                  Super Admin PIN
                </label>

                <span
                  className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  4 digits
                </span>

              </div>


              <div
                className="
                  relative
                "
              >

                <PinInput
                  length={4}
                  value={pin}
                  onChange={(
                    value
                  ) => {
                    setPin(
                      value
                    );

                    setError('');
                  }}
                  onComplete={(
                    value
                  ) => {
                    setPin(
                      value
                    );
                  }}
                  error={
                    !!error &&
                    pin.length > 0
                  }
                />

              </div>


              {error &&
                pin.length > 0 && (
                  <motion.p
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    className="
                      text-center
                      text-sm
                      text-red-500
                      mt-3
                    "
                  >
                    {error}
                  </motion.p>
                )}


              {loading && (
                <p
                  className="
                    text-center
                    text-sm
                    text-blue-600
                    mt-3
                    font-medium
                  "
                >
                  Verifying
                  Super Admin...
                </p>
              )}

            </div>


            {/* Security note */}
            <div
              className="
                flex
                gap-3
                rounded-2xl
                bg-slate-50
                border
                border-slate-100
                p-4
              "
            >

              <LockKeyhole
                className="
                  w-5
                  h-5
                  text-blue-600
                  shrink-0
                  mt-0.5
                "
              />

              <p
                className="
                  text-xs
                  leading-5
                  text-slate-500
                "
              >
                Your Super Admin
                credentials are
                verified securely
                on the server.
                Your PIN is never
                stored in the
                browser.
              </p>

            </div>


            {/* Button */}
            <Button
              type="button"
              fullWidth
              size="lg"
              onClick={
                handleLogin
              }
              loading={
                loading
              }
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

              Enter
              Super Admin

              <ArrowRight
                className="
                  w-5
                  h-5
                "
              />

            </Button>

          </div>

        </motion.div>


        <p
          className="
            text-center
            text-white/20
            text-[9px]
            uppercase
            tracking-[0.3em]
            mt-6
          "
        >
          GY DATA · SUPER ADMIN
          CONTROL CENTER
        </p>

      </div>

    </div>
  );
}
