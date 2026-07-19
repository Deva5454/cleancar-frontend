/**
 * CustomerPortalLogin — real phone-number lookup against the real
 * Customer records already used throughout the business side of the
 * app. No real SMS/OTP service exists in this app, so this is an
 * honest, simplified login for now — enter the phone number on file,
 * and if a real customer record matches, they're in. A real OTP step
 * would need real backend/SMS infrastructure to be genuine, not
 * something safe to fake on the frontend alone.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomers } from "../../contexts/CustomerContext";
import { CUSTOMER_PORTAL_SESSION_KEY } from "./CustomerPortalAuthContext";
import { Car } from "lucide-react";
import { toast } from "sonner";

export function CustomerPortalLogin() {
  const { customers } = useCustomers();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    setSubmitting(true);
    // Real lookup against real customer records — matches on the last
    // 10 digits, so it works regardless of whether a +91 prefix is on
    // file or not.
    const match = customers.find((c: any) => c.phone.replace(/\D/g, "").endsWith(digits.slice(-10)));
    setTimeout(() => {
      if (!match) {
        toast.error("We couldn't find an account with that number. Please book a wash first, or contact support.");
        setSubmitting(false);
        return;
      }
      try {
        localStorage.setItem(CUSTOMER_PORTAL_SESSION_KEY, match.customerId);
      } catch { /* ignore */ }
      toast.success(`Welcome back, ${match.firstName}!`);
      navigate("/portal/dashboard");
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Car className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Log in with the phone number on your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="98765 43210"
              className="w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-medium disabled:opacity-60"
          >
            {submitting ? "Checking..." : "Continue"}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          New here? Book your first wash and your account will be created automatically.
        </p>
      </div>
    </div>
  );
}

export default CustomerPortalLogin;
