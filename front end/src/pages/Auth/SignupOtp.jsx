import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../contexts/AuthContext";
import { confirmSignUpWithOtp, resendSignUpOtp, signInWithCognito } from "../../utils/cognito";
import { persistAuthTokens } from "../../utils/authCookies";
import InfoModal from "./InfoModal";
import Tooltip from "../../components/Tooltip";
import "./Auth.css";

export default function SignupOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { login } = useAuth();
  const emailFromQuery = new URLSearchParams(location.search).get("email") || "";
  const [email, setEmail] = useState(location.state?.email || emailFromQuery);
  const pendingPassword = location.state?.password || "";
  const [otp, setOtp] = useState("");
  const [alertmsg, setAlertmsg] = useState("");
  const [alertColor, setAlertColor] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email || !otp) {
      setAlertmsg("Please enter both email and OTP.");
      setAlertColor("text-red-600");
      return;
    }
    try {
      setIsSubmitting(true);
      await confirmSignUpWithOtp(email, otp);
      if (pendingPassword) {
        const tokens = await signInWithCognito(email, pendingPassword);
        persistAuthTokens(tokens);
        login(email);
        navigate("/google-connect");
        return;
      }
      setAlertmsg("Account verified successfully. Please sign in.");
      setAlertColor("text-green-600");
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      setAlertmsg(error.message || "OTP verification failed. Please try again.");
      setAlertColor("text-red-600");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setAlertmsg("Enter email to resend OTP.");
      setAlertColor("text-red-600");
      return;
    }
    try {
      setIsSubmitting(true);
      await resendSignUpOtp(email);
      setAlertmsg("A new OTP has been sent to your email.");
      setAlertColor("text-green-600");
    } catch (error) {
      setAlertmsg(error.message || "Failed to resend OTP.");
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
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </Tooltip>

      <div className="auth-card">
        <h1 className="auth-title">Wealth Management Platform</h1>
        <h2 className="auth-welcome">Verify Account</h2>
        <p className="auth-subtitle">Enter the OTP sent to your email to confirm your account</p>

        <form onSubmit={handleVerify} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" autoComplete="username" required />
          </div>

          <div className="form-group">
            <label>OTP Code</label>
            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP code" required />
          </div>

          {alertmsg && <p className={`alert-message ${alertColor}`}>{alertmsg}</p>}

          <button type="submit" disabled={isSubmitting} className="submit-button">
            {isSubmitting ? "Verifying..." : "Verify OTP"}
          </button>

          <div className="form-actions">
            <button type="button" className="link-button" onClick={handleResend} disabled={isSubmitting}>
              Resend OTP
            </button>
          </div>

          <p className="auth-switch">
            Back to{" "}
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
