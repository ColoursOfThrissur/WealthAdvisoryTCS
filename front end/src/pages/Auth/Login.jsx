import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../config/api";
import InfoModal from "./InfoModal";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alertmsg, setAlertmsg] = useState("");
  const [alertColor, setAlertColor] = useState("");
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setAlertmsg("Please enter both email and password.");
      setAlertColor("text-red-600");
      return;
    }

    if (!isConsentChecked) {
      setAlertmsg("Please agree to the Terms of Use and Privacy Policy.");
      setAlertColor("text-red-600");
      return;
    }

    try {
      setIsSubmitting(true);
      // Mock login for now - BackendV2 doesn't have auth yet
      // TODO: Add real authentication endpoint to BackendV2
      if (email && password) {
        sessionStorage.setItem("access_token", `mock_token_${email}`);
        login();
        navigate("/");
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      setAlertmsg(error.message || "Login failed. Please try again.");
      setAlertColor("text-red-600");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container" data-theme={theme}>
      <div className="auth-background" />
      
      <button onClick={toggleTheme} className="theme-toggle" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="auth-card">
        <h1 className="auth-title">Wealth Management Platform</h1>
        <h2 className="auth-welcome">Welcome Back</h2>
        <p className="auth-subtitle">Please sign in to continue</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="off"
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" className="link-button" onClick={() => navigate("/forgot-password")}>
              Forgot password?
            </button>
          </div>

          <div className="consent-checkbox">
            <label>
              <input
                type="checkbox"
                checked={isConsentChecked}
                onChange={(e) => setIsConsentChecked(e.target.checked)}
              />
              <span>
                I agree to the{" "}
                <button type="button" className="link-inline" onClick={() => setActiveModal("terms")}>
                  Terms of Use
                </button>{" "}
                and{" "}
                <button type="button" className="link-inline" onClick={() => setActiveModal("privacy")}>
                  Privacy Policy
                </button>
              </span>
            </label>
          </div>

          {alertmsg && <p className={`alert-message ${alertColor}`}>{alertmsg}</p>}

          <button type="submit" disabled={isSubmitting} className="submit-button">
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>

          <p className="auth-switch">
            Don't have an account?{" "}
            <button type="button" className="link-inline" onClick={() => navigate("/signup")}>
              Sign Up
            </button>
          </p>
        </form>

        <footer className="auth-footer">
          <button type="button" onClick={() => setActiveModal("terms")}>Terms of Use</button>
          <span>|</span>
          <button type="button" onClick={() => setActiveModal("compatibility")}>Browser Compatibility</button>
          <span>|</span>
          <button type="button" onClick={() => setActiveModal("privacy")}>Privacy Policy</button>
          <span>|</span>
          <span>© 2026 Wealth Management</span>
        </footer>
      </div>

      <InfoModal type={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
