import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { confirmForgotPassword, startForgotPassword } from "../../utils/cognito";
import InfoModal from "./InfoModal";
import "./Auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [alertmsg, setAlertmsg] = useState("");
  const [alertColor, setAlertColor] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setAlertmsg("Please enter your registered email.");
      setAlertColor("text-red-600");
      return;
    }
    try {
      setIsSubmitting(true);
      await startForgotPassword(email);
      setStep(2);
      setAlertmsg("OTP sent. Check your email to reset your password.");
      setAlertColor("text-green-600");
    } catch (error) {
      setAlertmsg(error.message || "Unable to send OTP.");
      setAlertColor("text-red-600");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      setAlertmsg("Please enter OTP and new password.");
      setAlertColor("text-red-600");
      return;
    }
    if (newPassword.length < 8) {
      setAlertmsg("Password must be at least 8 characters.");
      setAlertColor("text-red-600");
      return;
    }
    try {
      setIsSubmitting(true);
      await confirmForgotPassword(email, otp, newPassword);
      setAlertmsg("Password reset successful. Redirecting to login...");
      setAlertColor("text-green-600");
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      setAlertmsg(error.message || "Password reset failed.");
      setAlertColor("text-red-600");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container" data-theme={theme}>
      <div className="auth-background" />

      <button onClick={toggleTheme} className="theme-toggle" title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
        {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="auth-card">
        <h1 className="auth-title">Wealth Management Platform</h1>
        <h2 className="auth-welcome">Forgot Password</h2>
        <p className="auth-subtitle">
          {step === 1 ? "Get OTP on your registered email" : "Use OTP to set your new password"}
        </p>

        <form onSubmit={step === 1 ? handleSendOtp : handleResetPassword} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" autoComplete="username" required />
          </div>

          {step === 2 && (
            <>
              <div className="form-group">
                <label>OTP Code</label>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP code" required />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </>
          )}

          {alertmsg && <p className={`alert-message ${alertColor}`}>{alertmsg}</p>}

          <button type="submit" disabled={isSubmitting} className="submit-button">
            {isSubmitting ? "Please wait..." : step === 1 ? "Send OTP" : "Reset Password"}
          </button>

          <p className="auth-switch">
            Remember your password?{" "}
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
