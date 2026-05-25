import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { signUpWithCognito } from "../../utils/cognito";
import InfoModal from "./InfoModal";
import Tooltip from "../../components/Tooltip";
import "./Auth.css";

export default function Signup() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [alertmsg, setAlertmsg] = useState("");
  const [alertColor, setAlertColor] = useState("");
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      setAlertmsg("Passwords do not match.");
      setAlertColor("text-red-600");
      return;
    }

    if (password.length < 8) {
      setAlertmsg("Password must be at least 8 characters.");
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
      await signUpWithCognito(email, password);
      setAlertmsg("Account created! Check your email for a verification code.");
      setAlertColor("text-green-600");
      setTimeout(() => navigate("/signup/verify", { state: { email, password } }), 1200);
    } catch (error) {
      setAlertmsg(error.message || "Registration failed. Please try again.");
      setAlertColor("text-red-600");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container" data-theme={theme}>
      <div className="auth-background" />

      <Tooltip content={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} placement="left">
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </Tooltip>

      <div className="auth-card">
        <h1 className="auth-title">Wealth Management Platform</h1>
        <h2 className="auth-welcome">Create Account</h2>
        <p className="auth-subtitle">Join us to manage your wealth</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              placeholder="Create a password"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
            />
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
            {isSubmitting ? "Creating Account..." : "Sign Up"}
          </button>

          <p className="auth-switch">
            Already have an account?{" "}
            <button type="button" className="link-inline" onClick={() => navigate("/login")}>
              Sign In
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
