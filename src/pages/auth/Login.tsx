import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";

export default function Login() {

  const navigate = useNavigate();
  const timer = useRef<any>(null);

  const startHold = () => {
    timer.current = setTimeout(() => {
      navigate("/super-admin-login");
    }, 2000);
  };

  const cancelHold = () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
  };


  return (
    <div className="
      min-h-screen
      bg-[#020b2d]
      flex
      flex-col
      items-center
      overflow-hidden
      relative
    ">


      {/* Logo */}
      <div className="mt-16 text-center">
        <Logo />

        <p className="
          text-blue-500
          text-lg
          mt-2
          font-semibold
        ">
          Endless Joy
        </p>
      </div>



      {/* Login Card */}
      <div className="
        bg-white
        w-[86%]
        max-w-md
        rounded-[30px]
        mt-12
        p-8
        shadow-[0_0_35px_rgba(20,100,255,0.35)]
        z-10
      ">


        <h1 className="
          text-center
          text-[#071442]
          text-3xl
          font-bold
        ">
          Welcome Back
        </h1>


        <p className="
          text-center
          text-gray-400
          mt-2
        ">
          Enter your details to continue
        </p>



        <div className="mt-8">

          <label className="text-sm text-gray-700">
            Phone Number
          </label>


          <div className="
            flex
            items-center
            border
            rounded-xl
            h-14
            mt-2
          ">

            <span className="px-4 border-r">
              +234
            </span>

            <input
              className="
                flex-1
                outline-none
                px-3
              "
              placeholder="801 234 5678"
            />

          </div>



          <button className="
            w-full
            h-14
            bg-[#062c85]
            text-white
            rounded-xl
            mt-6
            text-lg
            font-semibold
          ">
            Continue →
          </button>


        </div>




        <div className="
          flex
          items-center
          gap-3
          my-8
          text-gray-400
        ">

          <span className="h-px bg-gray-300 flex-1"/>
          OR
          <span className="h-px bg-gray-300 flex-1"/>

        </div>




        <h2 className="
          text-center
          text-[#071442]
          font-bold
        ">
          Enter PIN
        </h2>


        <p className="
          text-center
          text-gray-400
          text-sm
        ">
          Enter your 6 digit login PIN
        </p>



        <div className="
          flex
          justify-center
          gap-3
          mt-5
        ">

          {[1,2,3,4,5,6].map(i=>(
            <div
              key={i}
              className="
                w-10
                h-12
                border
                rounded-xl
                flex
                items-center
                justify-center
                text-blue-900
              "
            >
              •
            </div>
          ))}

        </div>



        <p className="
          text-center
          text-blue-600
          mt-6
          text-sm
        ">
          Forgot PIN?
        </p>


      </div>




      {/* Invisible Secret Super Admin Circle */}

      <div

        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}

        onTouchStart={startHold}
        onTouchEnd={cancelHold}


        className="
          fixed
          right-8
          bottom-20
          w-24
          h-24
          rounded-full
          bg-transparent
          z-50
        "

      />


      {/* Background Circle */}

      <div className="
        absolute
        -bottom-32
        -right-20
        w-80
        h-80
        rounded-full
        bg-blue-900/30
      "/>


    </div>
  );
}
