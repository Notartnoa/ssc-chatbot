import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./admin.css";
import logoTelkom from "../assets/Logo Telkom.svg";

const ADMIN_USER = "admin";
const ADMIN_PASS = "ssc2024";

function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Override App.css overflow:hidden — tanpa ini halaman login tidak bisa di-scroll
    document.documentElement.style.overflowY = "auto";
    document.body.style.overflowY = "auto";
    const root = document.getElementById("root");
    if (root) { root.style.height = "auto"; root.style.overflowY = "auto"; }

    return () => {
      document.documentElement.style.overflowY = "";
      document.body.style.overflowY = "";
      if (root) { root.style.height = ""; root.style.overflowY = ""; }
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setTimeout(() => {
      if (username === ADMIN_USER && password === ADMIN_PASS) {
        sessionStorage.setItem("ssc_admin_auth", "true");
        navigate("/admin/dashboard");
      } else {
        setError("Username atau password salah.");
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="admin-page login-layout-centered">
      {/* Efek pendaran cahaya di background agar tidak sepi */}
      <div className="login-ambient-glow"></div>
      
      <div className="login-card">
        {/* Branding */}
        <div className="login-brand">
          <img src={logoTelkom} alt="Telkom University" className="login-telkom-logo" />
          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">Enter your account details below to continue</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="username"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          {/* Opsi Tambahan */}
          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" disabled={isLoading} />
              <span>Remember for 30 days</span>
            </label>
            <a href="#forgot" className="forgot-pass" onClick={(e) => e.preventDefault()}>
              Forgot password?
            </a>
          </div>

          {error && (
            <div className="login-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.55 18.47 1.55 19.05 1.82 19.52C2.09 19.99 2.59 20.28 3.13 20.28H20.87C21.41 20.28 21.91 19.99 22.18 19.52C22.45 19.05 22.45 18.47 22.18 18L13.71 3.86C13.44 3.39 12.94 3.1 12.4 3.1C11.86 3.1 11.36 3.39 11.09 3.86H10.29Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={isLoading || !username || !password}
          >
            {isLoading ? (
              <span className="login-loading">
                <span className="login-dot" />
                <span className="login-dot" />
                <span className="login-dot" />
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;