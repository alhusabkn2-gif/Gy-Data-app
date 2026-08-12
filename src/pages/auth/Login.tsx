import { useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const superAdminTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startSuperAdminPress = () => {
    superAdminTimer.current = setTimeout(() => {
      navigate("/super-admin");
      superAdminTimer.current = null;
    }, 2000);
  };

  const cancelSuperAdminPress = () => {
    if (superAdminTimer.current) {
      clearTimeout(superAdminTimer.current);
      superAdminTimer.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-[#020b2d] flex flex-col items-center relative overflow-hidden">

      {/* =========================
          GY DATA LOGO / NAME
      ========================== */}
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

      {/* =========================
          WHITE LOGIN CARD
          DESIGN / SIZE KEPT
      ========================== */}
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

        <h1 className="text-center text-[#061442] text-xl font-bold">
          Welcome Back
        </h1>

        <p className="text-center text-gray-400 text-xs mt-1">
          Enter your phone number to continue
        </p>

        {/* PHONE */}
        <label className="block mt-4 text-xs text-gray-700">
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
          "
        >
          <span className="px-2 border-r">
            +234
          </span>

          <input
            type="tel"
            className="flex-1 outline-none px-2 w-full"
            placeholder="801 234 5678"
          />
        </div>

        {/* CONTINUE */}
        <button
          type="button"
          onClick={() => {
            const pin = document.getElementById("pin-section");

            if (pin) {
              pin.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }}
          className="
            w-full
            h-10
            bg-[#062c85]
            text-white
            rounded-lg
            mt-4
            text-sm
            font-semibold
            active:scale-[0.98]
            transition
          "
        >
          Continue →
        </button>

        {/* OR */}
        <div
          className="
            flex
            items-center
            gap-2
            my-4
            text-gray-400
            text-xs
          "
        >
          <span className="flex-1 h-px bg-gray-300" />

          OR

          <span className="flex-1 h-px bg-gray-300" />
        </div>

        {/* PIN */}
        <div id="pin-section">

          <h2 className="text-center text-[#061442] text-sm font-bold">
            Enter PIN
          </h2>

          <p className="text-center text-gray-400 text-xs">
            Enter your 6-digit Login PIN
          </p>

          <div className="flex justify-center gap-2 mt-3">

            {[1, 2, 3, 4, 5, 6].map((i) => (
              <input
                key={i}
                type="password"
                maxLength={1}
                inputMode="numeric"
                className="
                  w-7
                  h-8
                  border
                  rounded-md
                  text-center
                  outline-none
                  text-blue-900
                  text-xs
                  focus:border-blue-500
                "
                aria-label={`PIN digit ${i}`}
              />
            ))}

          </div>

          {/* FORGOT PIN */}
          <button
            type="button"
            onClick={() => {
              alert(
                "Please contact GY DATA support to reset your PIN."
              );
            }}
            className="
              block
              mx-auto
              text-blue-600
              mt-3
              text-xs
              bg-transparent
              border-0
            "
          >
            Forgot PIN?
          </button>

        </div>
      </div>

      {/* ==================================================
          BOTTOM DECORATIVE CIRCLES + STARS
          VISUAL ONLY
      =================================================== */}
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
            bg-[radial-gradient(circle_at_35%_25%,#fff6a3_0%,#ffd21c_45%,#e69b00_100%)]
            shadow-[inset_-3px_-4px_6px_rgba(0,0,0,0.18),inset_3px_3px_5px_rgba(255,255,255,0.5),0_5px_10px_rgba(0,0,0,0.2)]
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
            bg-[radial-gradient(circle_at_32%_25%,#d7fbff_0%,#5dd0e3_35%,#168ca8_100%)]
            shadow-[inset_-3px_-4px_6px_rgba(0,0,0,0.18),inset_3px_3px_5px_rgba(255,255,255,0.45),0_4px_9px_rgba(0,0,0,0.18)]
          "
        />

        {/* ==================================================
            LARGE RIGHT CIRCLE
            2 SECOND LONG PRESS = SUPER ADMIN
        =================================================== */}
        <div
          className="
            absolute
            right-[8%]
            bottom-8
            w-20
            h-20
            rounded-full
            bg-[radial-gradient(circle_at_32%_25%,#fff0c9_0%,#ffc45b_25%,#f39a17_58%,#b95d00_100%)]
            shadow-[inset_-9px_-11px_16px_rgba(0,0,0,0.2),inset_9px_8px_13px_rgba(255,255,255,0.45),0_9px_20px_rgba(0,0,0,0.22)]
            pointer-events-auto
            touch-none
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
            bg-[radial-gradient(circle_at_35%_25%,#ffd8ff_0%,#ee72d8_38%,#b22aa6_72%,#73156f_100%)]
            shadow-[inset_-5px_-6px_9px_rgba(0,0,0,0.2),inset_5px_5px_8px_rgba(255,255,255,0.45),0_7px_14px_rgba(0,0,0,0.22)]
          "
          style={{
            clipPath:
              "polygon(50% 0%,61% 32%,98% 24%,70% 50%,98% 76%,61% 68%,50% 100%,39% 68%,2% 76%,30% 50%,2% 24%,39% 32%)",
          }}
        />

      </div>

      {/* ORIGINAL BOTTOM CIRCLE */}
      <div
        className="
          absolute
          -bottom-24
          -right-20
          w-64
          h-64
          rounded-full
          bg-blue-900/40
        "
      />

    </div>
  );
}
