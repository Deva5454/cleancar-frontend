/**
 * Input Validation Utilities — CleanCar 360°
 * Central validation layer for all user-submitted data
 */
export const validate = {
  sanitize(v: string): string {
    return v.replace(/<[^>]*>/g, "").replace(/[<>"'&]/g, c =>
      ({"<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","&":"&amp;"}[c]||c)).trim();
  },
  mobile(v: string): { valid: boolean; message?: string } {
    const c = v.replace(/\D/g, "");
    if (c.length !== 10) return { valid: false, message: "Mobile must be 10 digits" };
    if (!/^[6-9]\d{9}$/.test(c)) return { valid: false, message: "Invalid Indian mobile number" };
    return { valid: true };
  },
  pinCode(v: string): { valid: boolean; message?: string } {
    if (!/^[1-9][0-9]{5}$/.test(v)) return { valid: false, message: "Invalid PIN code" };
    return { valid: true };
  },
  email(v: string): { valid: boolean; message?: string } {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { valid: false, message: "Invalid email" };
    return { valid: true };
  },
  amount(v: string | number): { valid: boolean; message?: string } {
    const n = Number(v);
    if (isNaN(n) || n < 0) return { valid: false, message: "Amount must be positive" };
    if (n > 10000000) return { valid: false, message: "Exceeds ₹1 crore limit" };
    return { valid: true };
  },
  required(v: string, field: string): { valid: boolean; message?: string } {
    if (!v?.trim()) return { valid: false, message: `${field} is required` };
    return { valid: true };
  },
  dateRange(s: string, e: string): { valid: boolean; message?: string } {
    if (!s || !e) return { valid: false, message: "Both dates required" };
    if (new Date(s) > new Date(e)) return { valid: false, message: "Start must be before end" };
    return { valid: true };
  },
  password(v: string): { valid: boolean; strength: "weak"|"medium"|"strong"; message?: string } {
    if (v.length < 6) return { valid: false, strength: "weak", message: "Min 6 characters" };
    const s = /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v) ? "strong" : "medium";
    return { valid: true, strength: s };
  },
  sanitizeForLog(obj: Record<string, unknown>): Record<string, unknown> {
    const r = { ...obj };
    ["password","passwordHash","token","key","secret","otp"].forEach(f => { if (r[f]) r[f] = "[REDACTED]"; });
    return r;
  },
};
export default validate;
