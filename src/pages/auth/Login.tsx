import { useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {

  const navigate = useNavigate();
  const timer = useRef<any>(null);

  const startSecretPress = () => {
    timer.current = setTimeout(() => {
      navigate("/super-admin-login");
    }, 2000);
  };

  const stopSecretPress = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };


  return (
    <div className="
      min-h-screen
      bg-[#020b2d]
      flex
      flex-col
      items-center
      relative
      overflow-hidden
    ">


      {/* Logo */}
      <div className="
        mt-16
        text-center
        z-10
      ">

        <img
          src="/logo.png"
          alt="GY DATA"
          className="w-32 mx-auto"
        />

        <h3 className="
          text-blue-500
          text-xl
          font-semibold
          mt-2
        ">
          Endless Joy
        </h3>

      </div>



      {/* Login Card */}
      <div className="
        bg-white
        w-[88%]
        max-w-md
        rounded-[30px]
        mt-10
        p-8
        z-10
        shadow-xl
      ">


        <h1 className="
          text-center
          text-[#061442]
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
          Enter your phone number to continue
        </p>



        <label className="
          block
          mt-8
          text-gray-700
        ">
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

          <span className="
            px-4
            border-r
          ">
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




        <div className="
          flex
          items-center
          gap-3
          my-8
          text-gray-400
        ">

          <span className="
            flex-1
            h-px
            bg-gray-300
          />

          OR

          <span className="
            flex-1
            h-px
            bg-gray-300
          />

        </div>




        <h2 className="
          text-center
          text-[#061442]
          font-bold
        ">
          Enter PIN
        </h2>


        <p className="
          text-center
          text-gray-400
          text-sm
        ">
          Enter your 6-digit Login PIN
        </p>




        <div className="
          flex
          justify-center
          gap-3
          mt-5
        ">

          {[1,2,3,4,5,6].map(i => (

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
              ●
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




      {/* Invisible Secret Admin Area */}
      <div

        className="
          fixed
          right-8
          bottom-20
          w-24
          h-24
          rounded-full
          z-50
        "

        onMouseDown={startSecretPress}
        onMouseUp={stopSecretPress}
        onMouseLeave={stopSecretPress}

        onTouchStart={startSecretPress}
        onTouchEnd={stopSecretPress}

      />



      {/* Background Circle */}
      <div className="
        absolute
        -bottom-32
        -right-24
        w-80
        h-80
        rounded-full
        bg-blue-900/40
      "/>


    </div>
  );
}
