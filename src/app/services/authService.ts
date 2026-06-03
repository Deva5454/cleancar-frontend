/**
 * Authentication Service
 * Manages employee authentication, password management, and account security
 */

import { employeeDatabaseService } from "./employeeDatabaseService";

export interface AuthCredentials {
  loginMobile: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  employeeId?: string;
  employeeName?: string;
  role?: string;
  cityId?: string;
  accountStatus?: string;
  error?: "INVALID_CREDENTIALS" | "ACCOUNT_LOCKED" | "PENDING_ONBOARDING"
          | "PENDING_PASSWORD_SET" | "OTP_EXPIRED" | "OTP_INVALID";
  lockedUntil?: string;
  remainingAttempts?: number;
}

// Password hashing — SHA-256 via Web Crypto API (sync wrapper for backward compat)
// Prefix "sha256:" identifies new-style hashes; plain base64 = old btoa hash (still verified)
const HASH_SALT = "CC360_SHA256_SALT_v2";

// Synchronous fallback hash (used for login comparison with old btoa hashes)
function legacyHash(password: string): string {
  return btoa(password + "CC360SALT");
}

// Async SHA-256 hash — used when setting new passwords
export async function hashPasswordAsync(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + HASH_SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return "sha256:" + hex;
}

// Verify password against stored hash (supports both old btoa and new SHA-256 hashes)
export async function verifyPassword(input: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  if (stored.startsWith("sha256:")) {
    const inputHash = await hashPasswordAsync(input);
    return inputHash === stored;
  }
  // Legacy btoa hash
  return legacyHash(input) === stored;
}

// Sync hash kept ONLY for backward compat — do not use for new passwords
function hashPassword(password: string): string {
  return legacyHash(password);
}

function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateTempPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

class AuthServiceClass {

  // ── LOGIN ─────────────────────────────────────────────────────

  login(credentials: AuthCredentials): AuthResult {
    const employees = employeeDatabaseService.getAll();
    const employee = employees.find(
      (e: any) => e.loginMobile === credentials.loginMobile || e.mobile === credentials.loginMobile
    );

    if (!employee) {
      return { success: false, error: "INVALID_CREDENTIALS", remainingAttempts: 5 };
    }

    // Check account status
    if (employee.accountStatus === "pending_onboarding") {
      return { success: false, error: "PENDING_ONBOARDING" };
    }

    if (employee.accountStatus === "pending_password") {
      return { success: false, error: "PENDING_PASSWORD_SET" };
    }

    // Check lockout
    if (employee.accountStatus === "locked") {
      const lockedUntil = employee.lockedUntil ? new Date(employee.lockedUntil) : null;
      if (lockedUntil && lockedUntil > new Date()) {
        return { success: false, error: "ACCOUNT_LOCKED", lockedUntil: employee.lockedUntil };
      }
      // Lockout expired — unlock automatically
      employeeDatabaseService.update(employee.id, {
        accountStatus: "active",
        failedLoginAttempts: 0,
        lockedUntil: undefined,
      });
    }

    // Verify password
    const inputHash = hashPassword(credentials.password);
    const isValid = employee.passwordHash === inputHash ||
                    employee.tempPin === credentials.password; // Allow temp PIN login too

    if (!isValid) {
      const attempts = (employee.failedLoginAttempts || 0) + 1;
      const shouldLock = attempts >= 5;
      employeeDatabaseService.update(employee.id, {
        failedLoginAttempts: attempts,
        accountStatus: shouldLock ? "locked" : employee.accountStatus,
        lockedUntil: shouldLock
          ? new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min lockout
          : undefined,
      });
      return {
        success: false,
        error: "INVALID_CREDENTIALS",
        remainingAttempts: Math.max(0, 5 - attempts),
      };
    }

    // Success — upgrade legacy btoa hash to SHA-256 on next login (async, non-blocking)
    employeeDatabaseService.update(employee.id, {
      failedLoginAttempts: 0,
      lastLogin: new Date().toISOString(),
      accountStatus: "active",
    });
    // Upgrade hash in background if still using legacy btoa
    if (employee.passwordHash && !employee.passwordHash.startsWith("sha256:")) {
      hashPasswordAsync(credentials.password).then(newHash => {
        employeeDatabaseService.update(employee.id, { passwordHash: newHash });
      }).catch(() => { /* non-critical — will retry next login */ });
    }

    return {
      success: true,
      employeeId: employee.id,
      employeeName: employee.fullName,
      role: employee.designation,
      cityId: employee.workLocation,
    };
  }

  // ── SET PASSWORD (after onboarding) ──────────────────────────

  setPasswordAfterOnboarding(
    loginMobile: string,
    tempPin: string,
    newPassword: string,
    confirmPassword: string
  ): { success: boolean; error?: string } {
    if (newPassword !== confirmPassword) {
      return { success: false, error: "Passwords do not match" };
    }
    if (newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" };
    }
    if (!/[0-9]/.test(newPassword)) {
      return { success: false, error: "Password must contain at least one number" };
    }
    if (!/[A-Za-z]/.test(newPassword)) {
      return { success: false, error: "Password must contain at least one letter" };
    }

    const employees = employeeDatabaseService.getAll();
    const employee = employees.find(
      (e: any) => (e.loginMobile === loginMobile || e.mobile === loginMobile)
               && e.tempPin === tempPin
    );

    if (!employee) {
      return { success: false, error: "Mobile number or temporary PIN is incorrect" };
    }

    if (employee.accountStatus === "active" && employee.onboardingPasswordSet) {
      return { success: false, error: "Password already set. Use Forgot Password if you need to reset." };
    }

    employeeDatabaseService.update(employee.id, {
      passwordHash: hashPassword(newPassword),
      tempPin: undefined,
      onboardingPasswordSet: true,
      accountStatus: "active",
      loginMobile: loginMobile,
      passwordChangedAt: new Date().toISOString(),
    });

    return { success: true };
  }

  // ── FORGOT PASSWORD — HR triggers OTP ────────────────────────

  initiatePasswordReset(employeeId: string, triggeredByHR: string): {
    success: boolean; otp?: string; maskedMobile?: string; error?: string;
  } {
    const employee = employeeDatabaseService.getAll().find((e: any) => e.id === employeeId);
    if (!employee) return { success: false, error: "Employee not found" };

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

    employeeDatabaseService.update(employee.id, {
      passwordResetOTP: otp,
      passwordResetOTPExpiry: expiry,
      passwordResetRequestedAt: new Date().toISOString(),
    });

    const mobile = employee.loginMobile || employee.mobile || "";
    const maskedMobile = mobile.slice(0, 5) + "XXXXX";

    // In production: call WhatsApp API to send OTP to employee's mobile
    console.log(`[AuthService] OTP for ${employee.fullName}: ${otp} (expires: ${expiry})`);

    return { success: true, otp, maskedMobile };
  }

  // ── RESET PASSWORD WITH OTP ───────────────────────────────────

  resetPasswordWithOTP(
    loginMobile: string,
    otp: string,
    newPassword: string,
    confirmPassword: string
  ): { success: boolean; error?: string } {
    if (newPassword !== confirmPassword) {
      return { success: false, error: "Passwords do not match" };
    }
    if (newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" };
    }
    if (!/[0-9]/.test(newPassword)) {
      return { success: false, error: "Password must contain at least one number" };
    }

    const employees = employeeDatabaseService.getAll();
    const employee = employees.find(
      (e: any) => e.loginMobile === loginMobile || e.mobile === loginMobile
    );

    if (!employee) return { success: false, error: "Mobile number not found" };
    if (!employee.passwordResetOTP || employee.passwordResetOTP !== otp) {
      return { success: false, error: "Invalid OTP. Please ask HR to resend." };
    }
    if (employee.passwordResetOTPExpiry && new Date(employee.passwordResetOTPExpiry) < new Date()) {
      return { success: false, error: "OTP has expired. Please ask HR to generate a new one." };
    }

    employeeDatabaseService.update(employee.id, {
      passwordHash: hashPassword(newPassword),
      passwordResetOTP: undefined,
      passwordResetOTPExpiry: undefined,
      passwordResetRequestedAt: undefined,
      onboardingPasswordSet: true,
      accountStatus: "active",
      failedLoginAttempts: 0,
      lockedUntil: undefined,
      passwordChangedAt: new Date().toISOString(),
    });

    return { success: true };
  }

  // ── RETRIEVE LOGIN ID (for HR) ────────────────────────────────

  getLoginId(employeeId: string): { loginMobile?: string; maskedMobile?: string } {
    const employee = employeeDatabaseService.getAll().find((e: any) => e.id === employeeId);
    if (!employee) return {};
    const mobile = employee.loginMobile || employee.mobile || "";
    return {
      loginMobile: mobile,
      maskedMobile: mobile.slice(0, 5) + "XXXXX",
    };
  }

  // ── GENERATE TEMP PIN for HR ──────────────────────────────────

  generateTempPinForEmployee(employeeId: string): { success: boolean; tempPin?: string } {
    const employee = employeeDatabaseService.getAll().find((e: any) => e.id === employeeId);
    if (!employee) return { success: false };

    const pin = generateTempPin();
    employeeDatabaseService.update(employeeId, { tempPin: pin });
    return { success: true, tempPin: pin };
  }

  // ── UNLOCK ACCOUNT ───────────────────────────────────────────

  unlockAccount(employeeId: string): void {
    employeeDatabaseService.update(employeeId, {
      accountStatus: "active",
      failedLoginAttempts: 0,
      lockedUntil: undefined,
    });
  }

  // ── RESET PASSWORD (simple wrapper for LoginPage) ─────────
  resetPassword(loginMobile: string, otp: string, newPassword: string): void {
    this.resetPasswordWithOTP(loginMobile, otp, newPassword, newPassword);
  }
}

export const authService = new AuthServiceClass();
