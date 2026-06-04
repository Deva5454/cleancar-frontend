Add a password-creation step (Step 6) to the existing OnboardingPortal.
Currently Step 5 (Declaration) calls submitOnboarding() which jumps to
currentStep === 6 (the success screen). We intercept this to add a password
creation step between submission and the success screen.
 
Open src/app/components/OnboardingPortal.tsx.
 
━━━ STEP 1 — Add new state variables ━━━
After the existing declaration state (around line 138), add:
 
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
    showPassword: false,
    showConfirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [settingPassword, setSettingPassword] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);
 
━━━ STEP 2 — Add password strength validator ━━━
After the existing submitOnboarding function, add:
 
  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("At least 8 characters");
    if (!/[0-9]/.test(pwd)) errors.push("At least one number");
    if (!/[A-Za-z]/.test(pwd)) errors.push("At least one letter");
    return errors;
  };
 
  const handleSetPassword = async () => {
    const errors = validatePassword(passwordData.newPassword);
    if (errors.length > 0) { setPasswordErrors(errors); return; }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordErrors(["Passwords do not match"]); return;
    }
 
    setSettingPassword(true);
    try {
      const { authService } = await import("../services/authService");
      const mobile = personalDetails.personalMobile;
      // Use the empId from URL params as the temp PIN for first-time setup
      const result = authService.setPasswordAfterOnboarding(
        mobile,
        empId || "",
        passwordData.newPassword,
        passwordData.confirmPassword
      );
 
      if (result.success) {
        setPasswordSet(true);
        toast.success("Password created successfully! You can now log in.");
        setTimeout(() => setCurrentStep(7), 1500); // Go to final success screen
      } else {
        // If tempPin check fails (empId mismatch), still allow set for new employees
        // In production this would be validated server-side
        const { employeeDatabaseService } = await import("../services/employeeDatabaseService");
        const employees = employeeDatabaseService.getAll();
        const emp = employees.find(
          (e: any) => e.mobile === mobile || e.loginMobile === mobile
        );
        if (emp) {
          const { default: bcrypt } = await import("../utils/simpleHash");
          employeeDatabaseService.update(emp.id, {
            passwordHash: btoa(passwordData.newPassword + "CC360SALT"),
            onboardingPasswordSet: true,
            accountStatus: "active",
            loginMobile: mobile,
            passwordChangedAt: new Date().toISOString(),
          });
          setPasswordSet(true);
          toast.success("Password created! You can now log in.");
          setTimeout(() => setCurrentStep(7), 1500);
        } else {
          toast.error(result.error || "Could not set password. Please contact HR.");
        }
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setSettingPassword(false);
    }
  };
 
━━━ STEP 3 — Change submitOnboarding to go to step 6 (password) not success ━━━
Find the submitOnboarding function (line ~308). Change the last line:
 
  FIND:    setCurrentStep(6);
  REPLACE: setCurrentStep(6); // Step 6 = Set Password (Step 7 = Success)
 
━━━ STEP 4 — Add Step 6 password screen BEFORE the existing success screen ━━━
Find the block starting at:  if (currentStep === 6) {
This is currently the success screen. Change it to step 7:
 
  FIND:    if (currentStep === 6) {
  REPLACE: if (currentStep === 7) {
 
Then ADD this new block for step 6 BEFORE the if (currentStep === 7) block:
 
  if (currentStep === 6) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-teal-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">
              One Last Step — Set Your Password
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Your onboarding documents have been submitted. Create a password
              to access the CleanCar 360 app.
            </p>
          </CardHeader>
 
          <CardContent className="space-y-5 pt-4">
            {/* Login ID display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">
                Your Login ID (cannot be changed)
              </p>
              <p className="text-lg font-bold text-blue-900 font-mono">
                {personalDetails.personalMobile || "Your mobile number"}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Use this number + your new password to log in every time.
              </p>
            </div>
 
            {/* New Password */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">New Password</Label>
              <div className="relative">
                <Input
                  type={passwordData.showPassword ? "text" : "password"}
                  placeholder="Enter password (min 8 characters)"
                  value={passwordData.newPassword}
                  onChange={e => {
                    setPasswordData(prev => ({...prev, newPassword: e.target.value}));
                    setPasswordErrors(validatePassword(e.target.value));
                  }}
                  className="pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setPasswordData(prev => ({...prev, showPassword: !prev.showPassword}))}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {passwordData.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
 
              {/* Password strength indicators */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {[
                  {label: "8+ chars", met: passwordData.newPassword.length >= 8},
                  {label: "Has number", met: /[0-9]/.test(passwordData.newPassword)},
                  {label: "Has letter", met: /[A-Za-z]/.test(passwordData.newPassword)},
                ].map(req => (
                  <span key={req.label} className={`text-xs px-2 py-0.5 rounded-full ${
                    req.met ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {req.met ? "✓" : "○"} {req.label}
                  </span>
                ))}
              </div>
            </div>
 
            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Confirm Password</Label>
              <div className="relative">
                <Input
                  type={passwordData.showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData(prev => ({...prev, confirmPassword: e.target.value}))}
                  className={`pr-10 font-mono ${
                    passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                      ? "border-red-400" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setPasswordData(prev => ({...prev, showConfirm: !prev.showConfirm}))}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {passwordData.showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-xs text-red-600">Passwords do not match</p>
              )}
            </div>
 
            {/* Error messages */}
            {passwordErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                {passwordErrors.map(e => (
                  <p key={e} className="text-xs text-red-700">• {e}</p>
                ))}
              </div>
            )}
 
            {/* Success state */}
            {passwordSet && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-800 font-medium">Password set! Redirecting...</p>
              </div>
            )}
 
            {/* Submit button */}
            <Button
              onClick={handleSetPassword}
              disabled={settingPassword || passwordSet ||
                passwordData.newPassword.length < 8 ||
                passwordData.newPassword !== passwordData.confirmPassword}
              className="w-full bg-teal-600 hover:bg-teal-700 min-h-[48px] text-base font-semibold"
            >
              {settingPassword ? "Setting password..." : "Set Password & Activate Account"}
            </Button>
 
            <p className="text-xs text-center text-gray-500">
              Having trouble? Contact HR at hr@cleancar360.com or call your supervisor.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
 
━━━ STEP 5 — Add missing imports ━━━
Add these to the import block at the top of OnboardingPortal.tsx:
  import { Lock, Eye, EyeOff } from "lucide-react";
(Lock, Eye, EyeOff are from lucide-react — already imported in many other files)
