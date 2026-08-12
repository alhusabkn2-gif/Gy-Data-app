import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState(["", "", "", "", "", ""]);

  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const superAdminTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ==========================================
  // PHONE NUMBER
  // ==========================================

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 11);

    setPhone(cleaned);

    // Automatically move to PIN after 11 digits
    if (cleaned.length === 11) {
      setTimeout(() => {
        pinRefs.current[0]?.focus();
      }, 100);
    }
  };

  // ==========================================
  // PIN
  // ==========================================

  const handlePinChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);

    // Automatically move to next PIN box
    if (digit && index < 5) {
      setTimeout(() => {
        pinRefs.current[index + 1]?.focus();
      }, 20);
    }
  };

  const handlePinKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    // Backspace automatically moves backwards
    if (event.key === "Backspace" && !pin[index] && index > 0) {
      const newPin = [...pin];

      newPin[index - 1] = "";
      setPin(newPin);

      setTimeout(() => {
        pinRefs.current[index - 1]?.focus();
      }, 20);
    }
  };

  // ==========================================
  // LOGIN
  // ==========================================

  const handleContinue = () => {
    if (phone.length !== 11) {
      alert("Please enter your 11-digit phone number.");
      return;
    }

    const fullPin = pin.join("");

    if (fullPin.length !== 6) {
      alert("Please enter your 6-digit PIN.");
      return;
    }

    /*
      CONNECT YOUR EXISTING LOGIN/AUTH FUNCTION HERE.

      We are NOT changing your backend/authentication system here.
    */

    console.log("Login attempt:", {
      phone,
      pin: fullPin,
    });
  };

  // ==========================================
  // SUPER ADMIN
  // 3 SECOND LONG PRESS
  // ==========================================

  const startSuperAdminPress = () => {
    if (superAdminTimer.current) {
      clearTimeout(superAdminTimer.current);
    }

    superAdminTimer.current = setTimeout(() => {
      navigate("/super-admin");
      superAdminTimer.current = null;
    }, 3000);
  };

  const cancelSuperAdminPress = () => {
    if (superAdminTimer.current) {
      clearTimeout(superAdminTimer.current);
      superAdminTimer.current = null;
    }
  };

  const phoneComplete = phone.length === 11;
  const pinComplete = pin.join("").length === 6;

  return (
    <div
      className="
        min-h-screen
        bg-[#020b2d]
        flex
        flex-col
        items-center
        relative
        overflow-hidden
      "
    >

      {/* ==========================================
          GY DATA
      =========================================== */}

      <div className="mt-8 text-center z-10">

        <img
          src="/logo.png"
          alt="GY DATA"
          className="w-24 mx-auto"
        />

        <h1 className="text-blue-500 text-lg font-bold mt-1">
          GY DATA
        </h1>

        <p className="text-white/70 text-xs mt-1">
          Endless Joy
        </p>

      </div>

      {/* ==========================================
          WHITE LOGIN CARD - 70%
      =========================================== */}

      <div
        className="
          bg-white
          w-[70%]
          max-w-sm
          rounded-[24px]
          mt-6
          p-4
          z-10
          shadow-xl
        "
      >

        {/* TITLE */}

        <h1
          className="
            text-center
            text-[#061442]
            text-xl
            font-bold
          "
        >
          Welcome Back
        </h1>

        <p
          className="
            text-center
            text-gray-400
            text-xs
            mt-1
          "
        >
          Enter your phone number to continue
        </p>

        {/* ==========================================
            PHONE NUMBER
        =========================================== */}

        <label
          className="
            block
            mt-4
            text-xs
            text-gray-700
          "
        >
          Phone Number
        </label>

        <div
          className="
            flex
            items-center
            border
            rounded-lg
            h-10
            mt-1
            text-xs
            bg-white
          "
        >

          <span className="px-2 border-r text-gray-700">
            +234
          </span>

          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(event) =>
              handlePhoneChange(event.target.value)
            }
            maxLength={11}
            className="
              flex-1
              outline-none
              px-2
              w-full
              text-gray-800
              bg-transparent
            "
            placeholder="80327320007"
          />

        </div>

        {/* ==========================================
            PIN SECTION
        =========================================== */}

        <div
          className={`
            transition-all
            duration-300
            ${
              phoneComplete
                ? "opacity-100"
                : "opacity-50"
            }
          `}
        >

          <h2
            className="
              text-center
              text-[#061442]
              text-sm
              font-bold
              mt-5
            "
          >
            Enter PIN
          </h2>

          <p
            className="
              text-center
              text-gray-400
              text-xs
            "
          >
            Enter your 6-digit Login PIN
          </p>

          {/* PIN BOXES */}

          <div
            className="
              flex
              justify-center
              gap-2
              mt-3
            "
          >

            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  pinRefs.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={
                  index === 0
                    ? "one-time-code"
                    : "off"
                }
                maxLength={1}
                value={digit ? "•" : ""}
                disabled={!phoneComplete}
                onChange={(event) =>
                  handlePinChange(
                    index,
                    event.target.value
                  )
                }
                onKeyDown={(event) =>
                  handlePinKeyDown(
                    index,
                    event
                  )
                }
                className="
                  w-9
                  h-10
                  border
                  rounded-lg
                  text-center
                  outline-none
                  text-blue-900
                  text-xl
                  font-bold
                  bg-white
                  focus:border-blue-500
                  focus:ring-1
                  focus:ring-blue-300
                  disabled:bg-gray-100
                "
                aria-label={`PIN digit ${index + 1}`}
              />
            ))}

          </div>

          {/* FORGOT PIN */}

          <button
            type="button"
            onClick={() => {
              navigate("/forgot-pin");
            }}
            className="
              block
              mx-auto
              text-blue-600
              mt-3
              text-xs
              bg-transparent
              border-0
              cursor-pointer
            "
          >
            Forgot PIN?
          </button>

          {/* ==========================================
              CONTINUE - UNDER PIN
          =========================================== */}

          <button
            type="button"
            onClick={handleContinue}
            disabled={!phoneComplete || !pinComplete}
            className="
              w-full
              h-10
              bg-[#062c85]
              text-white
              rounded-lg
              mt-4
              text-sm
              font-semibold
              disabled:opacity-40
              active:scale-[0.98]
              transition
              cursor-pointer
            "
          >
            Continue →
          </button>

        </div>

      </div>

      {/* ==========================================
          CREATE ACCOUNT
      =========================================== */}

      <div
        className="
          z-10
          mt-5
          text-center
          text-sm
        "
      >

        <span className="text-white/70">
          Don't have an account?{" "}
        </span>

        <button
          type="button"
          onClick={() => navigate("/signup")}
          className="
            text-blue-400
            font-semibold
            bg-transparent
            border-0
            cursor-pointer
          "
        >
          Sign up
        </button>

      </div>

      {/* ==========================================
          SUPPORT
      =========================================== */}

      <button
        type="button"
        onClick={() => navigate("/support")}
        className="
          z-10
          mt-2
          text-white/60
          text-xs
          bg-transparent
          border-0
          cursor-pointer
        "
      >
        Need help? Contact Support
      </button>

      {/* ==========================================
          FADED DECORATIVE CIRCLES + STARS
      =========================================== */}

      <div
        className="
          absolute
          inset-x-0
          bottom-0
          h-52
          z-[2]
          pointer-events-none
          overflow-hidden
        "
      >

        {/* CYAN CIRCLE */}

        <div
          className="
            absolute
            left-[8%]
            bottom-24
            w-16
            h-16
            rounded-full
            opacity-55
            bg-[radial-gradient(circle_at_32%_25%,#d9fbff_0%,#75d9ea_24%,#16a8c7_58%,#08738f_100%)]
            shadow-[inset_-8px_-10px_14px_rgba(0,0,0,0.18),inset_8px_8px_12px_rgba(255,255,255,0.45),0_8px_18px_rgba(0,0,0,0.22)]
          "
        />

        {/* PURPLE CIRCLE */}

        <div
          className="
            absolute
            left-[22%]
            bottom-8
            w-11
            h-11
            rounded-full
            opacity-50
            bg-[radial-gradient(circle_at_32%_25%,#f0d9ff_0%,#b76be8_28%,#792bc0_65%,#4b1680_100%)]
            shadow-[inset_-6px_-7px_10px_rgba(0,0,0,0.2),inset_6px_6px_9px_rgba(255,255,255,0.4),0_7px_15px_rgba(0,0,0,0.2)]
          "
        />

        {/* YELLOW STAR */}

        <div
          className="
            absolute
            left-[48%]
            bottom-16
            w-8
            h-8
            opacity-50
            bg-[radial-gradient(circle_at_35%_25%,#fff6a3_0%,#ffd21c_45%,#e69b00_100%)]
          "
          style={{
            clipPath:
              "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 94%,50% 71%,21% 94%,32% 57%,2% 35%,39% 35%)",
          }}
        />

        {/* SMALL CYAN CIRCLE */}

        <div
          className="
            absolute
            left-[58%]
            bottom-2
            w-6
            h-6
            rounded-full
            opacity-45
            bg-[radial-gradient(circle_at_32%_25%,#d7fbff_0%,#5dd0e3_35%,#168ca8_100%)]
          "
        />

        {/* ==========================================
            SMALL ORANGE CIRCLE
            3 SECOND LONG PRESS
        =========================================== */}

        <div
          className="
            absolute
            right-[9%]
            bottom-8
            w-16
            h-16
            rounded-full
            opacity-55
            pointer-events-auto
            touch-none
            bg-[radial-gradient(circle_at_32%_25%,#fff0c9_0%,#ffc45b_25%,#f39a17_58%,#b95d00_100%)]
            shadow-[inset_-7px_-9px_13px_rgba(0,0,0,0.2),inset_7px_7px_11px_rgba(255,255,255,0.45),0_7px_16px_rgba(0,0,0,0.22)]
          "
          onPointerDown={startSuperAdminPress}
          onPointerUp={cancelSuperAdminPress}
          onPointerLeave={cancelSuperAdminPress}
          onPointerCancel={cancelSuperAdminPress}
          role="button"
          aria-label="Super Admin"
        />

        {/* PINK STAR */}

        <div
          className="
            absolute
            right-[8%]
            bottom-28
            w-12
            h-12
            opacity-50
            bg-[radial-gradient(circle_at_35%_25%,#ffd8ff_0%,#ee72d8_38%,#b22aa6_72%,#73156f_100%)]
          "
          style={{
            clipPath:
              "polygon(50% 0%,61% 32%,98% 24%,70% 50%,98% 76%,61% 68%,50% 100%,39% 68%,2% 76%,30% 50%,2% 24%,39% 32%)",
          }}
        />

      </div>

      {/* ==========================================
          SOFT BACKGROUND CIRCLE
      =========================================== */}

      <div
        className="
          absolute
          -bottom-24
          -right-20
          w-64
          h-64
          rounded-full
          bg-blue-900/40
          opacity-30
          pointer-events-none
        "
      />

      {/* ==========================================
          COPYRIGHT
      =========================================== */}

      <p
        className="
          absolute
          bottom-2
          z-10
          text-white/50
          text-[10px]
        "
      >
        © 2025 GY Data. All rights reserved.
      </p>

    </div>
  );
}
