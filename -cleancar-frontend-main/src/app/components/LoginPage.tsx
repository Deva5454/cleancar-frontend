import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, Phone, Lock, AlertTriangle, ArrowRight } from "lucide-react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { authService } from "../services/authService";
import { employeeDatabaseService } from "../services/employeeDatabaseService";

type LoginView = "login" | "forgot_otp_request" | "forgot_otp_verify" | "forgot_reset";

export function LoginPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<LoginView>("login");
  const [dataReady, setDataReady] = useState(false);

  // Login form
  const [loginMobile, setLoginMobile] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password
  const [forgotMobile, setForgotMobile] = useState("");
  const [forgotOTP, setForgotOTP] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotInfo, setForgotInfo] = useState("");

  // Data is pre-loaded by main.tsx seedAllData() before React mounts
  useEffect(() => {
    // Listen for storage quota errors from DataService
    const handleQuota = (e: Event) => {
      const msg = (e as CustomEvent).detail || "Storage is full. Some data may not load correctly. Please clear your browser storage.";
      setLoginError(msg);
    };
    window.addEventListener("dataservice:quota", handleQuota);

    // Verify employee data is available
    const employees = employeeDatabaseService.getAll();
    if (employees.length > 0) {
      setDataReady(true);
    } else {
      setDataReady(true); // localStorage-only mode
    }

    return () => window.removeEventListener("dataservice:quota", handleQuota);
  }, []);

  const handleLogin = async () => {
    if (!loginMobile || !loginPassword) {
      setLoginError("Please enter your mobile number and password.");
      return;
    }
    if (!dataReady) {
      setLoginError("Loading employee data, please wait...");
      return;
    }
    setIsLoading(true);
    setLoginError("");
    try {
      const result = authService.login({ loginMobile, password: loginPassword });

      if (result.success) {
        localStorage.setItem("cc360_session", JSON.stringify({
          employeeId: result.employeeId,
          employeeName: result.employeeName,
          role: result.role,
          cityId: result.cityId,
          loginTime: new Date().toISOString(),
        }));
        toast.success(`Welcome back, ${result.employeeName}!`);
        navigate("/");
      } else {
        switch (result.error) {
          case "PENDING_ONBOARDING":
            setLoginError("Your account is pending onboarding. Please complete the onboarding form sent to you by HR.");
            break;
          case "PENDING_PASSWORD_SET":
            setLoginError("Please complete your onboarding and set your password before logging in.");
            break;
          case "ACCOUNT_LOCKED":
            const unlockTime = result.lockedUntil ? new Date(result.lockedUntil).toLocaleTimeString() : "";
            setLoginError(`Account locked after too many attempts. Try again after ${unlockTime}.`);
            break;
          case "INVALID_CREDENTIALS":
            setLoginError(`Incorrect mobile number or password. ${
              result.remainingAttempts !== undefined
                ? `${result.remainingAttempts} attempts remaining before lockout.`
                : ""
            }`);
            break;
          default:
            setLoginError(`Incorrect mobile number or password. ${
              result.remainingAttempts !== undefined
                ? `${result.remainingAttempts} attempts remaining before lockout.`
                : ""
            }`);
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOTP = () => {
    if (!forgotMobile || forgotMobile.length !== 10) {
      setForgotError("Please enter your 10-digit registered mobile number.");
      return;
    }
    const employee = employeeDatabaseService.getAll().find(
      (e: any) => e.loginMobile === forgotMobile || e.mobile === forgotMobile
    );
    if (!employee) {
      setForgotError("No account found with this mobile number.");
      return;
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    employeeDatabaseService.update(employee.id, {
      passwordResetOTP: otp,
      passwordResetOTPExpiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      passwordResetRequestedAt: new Date().toISOString(),
    });
    setForgotInfo(`OTP sent to ${forgotMobile.slice(0,3)}XXXXXXX. (Demo OTP: ${otp})`);
    setForgotError("");
    setView("forgot_otp_verify");
  };

  const handleVerifyOTP = () => {
    const employee = employeeDatabaseService.getAll().find(
      (e: any) => e.loginMobile === forgotMobile || e.mobile === forgotMobile
    );
    if (!employee) { setForgotError("Employee not found."); return; }
    if (employee.passwordResetOTP !== forgotOTP) { setForgotError("Invalid OTP. Please try again."); return; }
    const expiry = employee.passwordResetOTPExpiry;
    if (expiry && new Date(expiry) < new Date()) { setForgotError("OTP expired. Please request a new one."); return; }
    setForgotError("");
    setView("forgot_reset");
  };

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 6) { setForgotError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setForgotError("Passwords do not match."); return; }
    try {
      authService.resetPassword(forgotMobile, forgotOTP, newPassword);
      toast.success("Password reset successfully! Please log in with your new password.");
      setView("login");
      setForgotMobile(""); setForgotOTP(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      setForgotError("Failed to reset password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">CleanCar 360°</h1>
          <p className="text-blue-300 mt-1">Enterprise Resource Planning</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* ── LOGIN VIEW ── */}
          {view === "login" && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>

              {/* Loading indicator */}
              {!dataReady && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-blue-700">Loading employee data...</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="mobile" className="text-sm font-medium text-gray-700">Mobile Number</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="mobile" type="tel" placeholder="10-digit mobile number"
                      value={loginMobile} onChange={e => setLoginMobile(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleLogin()}
                      className="pl-10" maxLength={10} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter password"
                      value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleLogin()}
                      className="pl-10 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{loginError}</p>
                  </div>
                )}

                <Button onClick={handleLogin} disabled={isLoading || !dataReady}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      Sign In <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </div>

              <div className="mt-4 text-center">
                <button onClick={() => { setView("forgot_otp_request"); setLoginError(""); }}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                  Forgot password?
                </button>
              </div>
            </>
          )}

          {/* ── FORGOT PASSWORD - REQUEST OTP ── */}
          {view === "forgot_otp_request" && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
              <p className="text-gray-500 text-sm mb-6">Enter your registered mobile number to receive an OTP.</p>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Mobile Number</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input type="tel" placeholder="10-digit mobile number" value={forgotMobile}
                      onChange={e => setForgotMobile(e.target.value)} className="pl-10" maxLength={10} />
                  </div>
                </div>
                {forgotError && <p className="text-sm text-red-600">{forgotError}</p>}
                {forgotInfo && <p className="text-sm text-green-600">{forgotInfo}</p>}
                <Button onClick={handleRequestOTP} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Send OTP
                </Button>
                <button onClick={() => setView("login")} className="w-full text-sm text-gray-500 hover:text-gray-700">
                  ← Back to Sign In
                </button>
              </div>
            </>
          )}

          {/* ── FORGOT PASSWORD - VERIFY OTP ── */}
          {view === "forgot_otp_verify" && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter OTP</h2>
              <p className="text-gray-500 text-sm mb-6">{forgotInfo}</p>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">OTP</Label>
                  <Input type="text" placeholder="6-digit OTP" value={forgotOTP}
                    onChange={e => setForgotOTP(e.target.value)} maxLength={6} />
                </div>
                {forgotError && <p className="text-sm text-red-600">{forgotError}</p>}
                <Button onClick={handleVerifyOTP} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Verify OTP
                </Button>
                <button onClick={() => setView("forgot_otp_request")} className="w-full text-sm text-gray-500 hover:text-gray-700">
                  ← Resend OTP
                </button>
              </div>
            </>
          )}

          {/* ── FORGOT PASSWORD - RESET ── */}
          {view === "forgot_reset" && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Set New Password</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">New Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input type={showNew ? "text" : "password"} placeholder="Min 6 characters"
                      value={newPassword} onChange={e => setNewPassword(e.target.value)} className="pl-10 pr-10" />
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Confirm Password</Label>
                  <Input type="password" placeholder="Repeat password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} />
                </div>
                {forgotError && <p className="text-sm text-red-600">{forgotError}</p>}
                <Button onClick={handleResetPassword} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Reset Password
                </Button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">
          CleanCar 360° ERP © 2026 · Secure Login
        </p>
      </div>
    </div>
  );
}
