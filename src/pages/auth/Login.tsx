import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

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
    }
  };


  return (
    <div className="login-page">

      {/* Logo */}
      <div className="logo-area">
        <img src="/logo.png" className="logo" />
        <h3>Endless Joy</h3>
      </div>


      {/* Login Card */}
      <div className="login-card">

        <h1>Welcome Back</h1>

        <p>
          Enter your phone number to continue
        </p>


        <label>
          Phone Number
        </label>


        <div className="phone-box">

          <span>
            +234
          </span>

          <input 
            placeholder="801 234 5678"
          />

        </div>


        <button className="continue-btn">
          Continue
          <span>→</span>
        </button>


        <div className="divider">
          <span></span>
          OR
          <span></span>
        </div>



        <h2>
          Enter PIN
        </h2>


        <p className="pin-text">
          Enter your 6-digit Login PIN
        </p>


        <div className="pin-box">

          {[1,2,3,4,5,6].map(i=>(
            <div key={i}>
              ●
            </div>
          ))}

        </div>


        <a>
          Forgot PIN?
        </a>


      </div>



      {/* Secret Super Admin Trigger */}
      <div
        className="secret-circle"
        onMouseDown={startSecretPress}
        onMouseUp={stopSecretPress}
        onTouchStart={startSecretPress}
        onTouchEnd={stopSecretPress}
      />


    </div>
  );
}
