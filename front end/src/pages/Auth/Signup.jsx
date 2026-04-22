import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { API_BASE_URL } from "../../config/api";
import InfoModal from "./InfoModal";
import "./Auth.css";

export default function Signup() {
  
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [alertmsg, setAlertmsg] = useState("");
  const [alertColor, setAlertColor] = useState("");
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      const res = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Registration failed.");
      }
      setAlertmsg("Registration successful! Redirecting to login...");
      setAlertColor("text-green-600");
      setTimeout(() => navigate("/login"), 2000);
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
      
      <button onClick={toggleTheme} className="theme-toggle" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

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
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
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
