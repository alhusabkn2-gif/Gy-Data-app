import { useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startSecretPress = () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => {
      navigate("/super-admin-login");
      timer.current = null;
    }, 2000);
  };

  const stopSecretPress = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

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
      {/* Logo */}
      <div
        className="
          mt-8
          text-center
          z-10
        "
      >
        <img
          src="/logo.png"
          alt="GY DATA"
          className="w-24 mx-auto"
        />

        <h3
          className="
            text-blue-500
            text-lg
            font-semibold
            mt-1
          "
        >
          Endless Joy
        </h3>
      </div>

      {/* Login Card */}
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
          "
        >
          <span className="px-2 border-r">
            +234
          </span>

          <input
            className="
              flex-1
              outline-none
              px-2
              w-full
            "
            placeholder="801 234 5678"
          />
        </div>

        <button
          className="
            w-full
            h-10
            bg-[#062c85]
            text-white
            rounded-lg
            mt-4
            text-sm
            font-semibold
          "
        >
          Continue →
        </button>

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
          <span
            className="
              flex-1
              h-px
              bg-gray-300
            "
          />

          OR

          <span
            className="
              flex-1
              h-px
              bg-gray-300
            "
          />
        </div>

        <h2
          className="
            text-center
            text-[#061442]
            text-sm
            font-bold
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

        <div
          className="
            flex
            justify-center
            gap-2
            mt-3
          "
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="
                w-7
                h-8
                border
                rounded-md
                flex
                items-center
                justify-center
                text-blue-900
                text-xs
              "
            >
              ●
            </div>
          ))}
        </div>

        <p
          className="
            text-center
            text-blue-600
            mt-3
            text-xs
          "
        >
          Forgot PIN?
        </p>
      </div>

      {/* Hidden Super Admin Trigger
          Long press the large right-side circle for 2 seconds */}
      <div
        className="
          fixed
          right-5
          bottom-16
          w-20
          h-20
          rounded-full
          z-50
        "
        onPointerDown={startSecretPress}
        onPointerUp={stopSecretPress}
        onPointerLeave={stopSecretPress}
        onPointerCancel={stopSecretPress}
      />

      {/* Bottom Circle */}
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
