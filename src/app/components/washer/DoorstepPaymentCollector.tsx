/**
 * DoorstepPaymentCollector
 *
 * Shown to washer (and supervisor) at the job site.
 * Three tabs: UPI QR · Cash · Send Link
 * Integrates with JobContext to gate job completion on payment when required.
 */
import { useState } from "react";
import {
  Smartphone, Banknote, Send, CheckCircle2,
  Copy, AlertTriangle, QrCode, IndianRupee,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  doorstepPaymentService,
  isPaymentRequired,
  canCompleteWithoutPayment,
  BUSINESS_UPI,
  type PaymentMode,
} from "../../services/doorstepPaymentService";
import { useRole } from "../../contexts/RoleContext";

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  job: {
    jobId: string;
    jobType: string;
    subscriptionId?: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    packageName: string;
    amount?: number;
    paymentStatus?: string;
    isComplimentary?: boolean;
    supervisorId?: string;
    cityId: string;
  };
  onPaymentComplete: () => void;   // called after successful collection
  onSkip?: () => void;             // only available for pre-paid subscription jobs
  compact?: boolean;               // washer mobile view = true
}

// ── UPI QR display ────────────────────────────────────────────────────────────
function UPIQRDisplay({ amount, packageName }: { amount: number; packageName: string }) {
  const upiString = `upi://pay?pa=${BUSINESS_UPI.id}&pn=${encodeURIComponent(BUSINESS_UPI.name)}&am=${amount}&cu=INR&tn=${encodeURIComponent("249 CarWash - " + packageName)}`;

  const copyUPI = () => {
    navigator.clipboard?.writeText(BUSINESS_UPI.id).then(() =>
      toast.success("UPI ID copied to clipboard")
    ).catch(() => toast.info(`UPI ID: ${BUSINESS_UPI.id}`));
  };

  return (
    <div className="space-y-3">
      {/* QR code area — renders a visual QR using CSS patterns as placeholder */}
      {/* In production, replace with <QRCode value={upiString} /> from 'qrcode.react' */}
      <div className="flex flex-col items-center bg-white border-2 border-gray-100 rounded-2xl p-4">
        <div className="w-44 h-44 bg-white border border-gray-200 rounded-xl flex items-center justify-center mb-3 relative overflow-hidden">
          {/* QR visual placeholder — replace with actual QR library in production */}
          <div className="grid grid-cols-7 gap-0.5 p-2 opacity-90">
            {Array.from({ length: 49 }).map((_, i) => {
              const pattern = [0,1,2,4,6,7,8,14,16,18,20,21,22,24,26,28,30,32,34,35,36,38,40,42,43,44,46,48];
              return <div key={i} className={`w-4 h-4 rounded-[1px] ${pattern.includes(i) ? "bg-gray-900" : "bg-white"}`} />;
            })}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white p-1 rounded-lg shadow">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">UPI</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center">Customer scans with any UPI app</p>
        <p className="text-sm font-bold text-gray-900 mt-1">{BUSINESS_UPI.name}</p>
      </div>

      {/* UPI ID copy */}
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <div className="flex-1">
          <p className="text-xs text-blue-600 font-medium">UPI ID</p>
          <p className="text-sm font-mono font-bold text-blue-900">{BUSINESS_UPI.id}</p>
        </div>
        <button onClick={copyUPI} className="text-blue-600 hover:text-blue-800">
          <Copy className="w-4 h-4" />
        </button>
      </div>

      {/* Amount */}
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <span className="text-sm text-green-700 font-medium">Amount</span>
        <span className="text-xl font-bold text-green-800">₹{amount.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function DoorstepPaymentCollector({ job, onPaymentComplete, onSkip, compact = true }: Props) {
  const { currentUser } = useRole();
  const empId   = currentUser?.employeeId ?? currentUser?.id ?? "";
  const empName = currentUser?.name ?? "Team";

  const amount        = job.amount ?? 0;
  const payRequired   = isPaymentRequired({ jobType: job.jobType, paymentStatus: job.paymentStatus, subscriptionId: job.subscriptionId, isComplimentary: job.isComplimentary });
  const canSkip       = canCompleteWithoutPayment({ jobType: job.jobType, subscriptionId: job.subscriptionId });
  const today         = new Date().toISOString().slice(0, 10);

  const [tab, setTab]                   = useState<"upi" | "cash" | "link">("upi");
  const [utrLast4, setUtrLast4]         = useState("");
  const [cashAmount, setCashAmount]     = useState(String(amount));
  const [changeAmount, setChangeAmount] = useState("0");
  const [done, setDone]                 = useState(false);
  const [collecting, setCollecting]     = useState(false);

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-6 space-y-2">
        <CheckCircle2 className="w-12 h-12 text-green-500" />
        <p className="font-bold text-green-800">Payment Recorded</p>
        <p className="text-xs text-gray-500">Tap Complete Wash to finish</p>
      </div>
    );
  }

  if (job.isComplimentary || (!payRequired && !canSkip)) {
    return null; // Nothing to collect for pre-paid + no pending status
  }

  const handleUPI = () => {
    if (!utrLast4.trim() || utrLast4.length < 4) {
      toast.error("Enter last 4 digits of customer's UTR / transaction ID");
      return;
    }
    setCollecting(true);
    doorstepPaymentService.recordUPI({
      jobId: job.jobId, customerId: job.customerId, customerName: job.customerName,
      customerPhone: job.customerPhone, amount,
      utrLast4: utrLast4.trim(),
      collectedBy: empId, collectedByName: empName, supervisorId: job.supervisorId,
      cityId: job.cityId, shiftDate: today,
    });
    toast.success(`₹${amount} UPI payment recorded`);
    setDone(true);
    setCollecting(false);
    onPaymentComplete();
  };

  const handleCash = () => {
    const cash = parseFloat(cashAmount);
    if (!cash || cash <= 0) { toast.error("Enter cash amount received"); return; }
    if (cash < amount)      { toast.error(`Amount short — job costs ₹${amount}`); return; }
    const change = cash - amount;
    setCollecting(true);
    doorstepPaymentService.recordCash({
      jobId: job.jobId, customerId: job.customerId, customerName: job.customerName,
      customerPhone: job.customerPhone, amount, cashAmount: cash, changeGiven: change,
      collectedBy: empId, collectedByName: empName, supervisorId: job.supervisorId,
      cityId: job.cityId, shiftDate: today,
    });
    toast.success(`₹${amount} cash collected${change > 0 ? ` — return ₹${change} change` : ""}`);
    setDone(true);
    setCollecting(false);
    onPaymentComplete();
  };

  const handleLink = () => {
    doorstepPaymentService.sendPaymentLink({
      jobId: job.jobId, customerId: job.customerId, customerName: job.customerName,
      customerPhone: job.customerPhone, amount, packageName: job.packageName,
      sentBy: empId, sentByName: empName, sentByRole: "Washer",
      cityId: job.cityId, shiftDate: today,
    });
    toast.success(`Payment link sent to ${job.customerName} via WhatsApp`);
    // Link sent — allow completing the job but flag as pending
    onPaymentComplete();
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
            <IndianRupee className="w-4 h-4 text-green-600" />
            Collect Payment
          </h3>
          <p className="text-xs text-gray-500">{job.customerName} · {job.packageName}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-green-700">₹{amount.toLocaleString()}</p>
          {payRequired
            ? <p className="text-[10px] text-red-600 font-medium">Required before completing</p>
            : <p className="text-[10px] text-amber-600">Pending — collect if customer agrees</p>}
        </div>
      </div>

      {/* Tab bar */}
      <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl">
        {([
          ["upi",  <QrCode    className="w-4 h-4" />, "UPI QR"],
          ["cash", <Banknote  className="w-4 h-4" />, "Cash"],
          ["link", <Send      className="w-4 h-4" />, "Send Link"],
        ] as const).map(([t, icon, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
              tab === t ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── UPI tab ── */}
      {tab === "upi" && (
        <div className="space-y-3">
          <UPIQRDisplay amount={amount} packageName={job.packageName} />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">
              UTR / Transaction ID last 4 digits *
            </label>
            <input
              type="text" maxLength={12}
              value={utrLast4} onChange={e => setUtrLast4(e.target.value)}
              placeholder="e.g. 7829 (shown on customer's screen)"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-400">Ask customer to show the payment confirmation</p>
          </div>
          <button onClick={handleUPI} disabled={collecting || utrLast4.length < 4}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-colors">
            <CheckCircle2 className="w-4 h-4" />Payment Received — ₹{amount}
          </button>
        </div>
      )}

      {/* ── Cash tab ── */}
      {tab === "cash" && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
            <p className="font-semibold text-amber-900">Cash Collection</p>
            <p className="text-xs text-amber-700 mt-0.5">
              All cash goes to your supervisor at end of shift for deposit.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Cash Received (₹) *</label>
              <input type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Change to Return (₹)</label>
              <div className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 font-semibold text-gray-700">
                ₹{Math.max(0, (parseFloat(cashAmount) || 0) - amount).toFixed(0)}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between text-sm">
            <span className="text-gray-500">Job amount</span>
            <span className="font-bold text-gray-900">₹{amount}</span>
          </div>

          <button onClick={handleCash} disabled={collecting || !cashAmount || parseFloat(cashAmount) < amount}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-colors">
            <Banknote className="w-4 h-4" />Cash Collected — ₹{amount}
          </button>
          {parseFloat(cashAmount) < amount && parseFloat(cashAmount) > 0 && (
            <p className="text-xs text-red-600 text-center">
              ₹{amount - parseFloat(cashAmount)} short — ask customer for exact amount
            </p>
          )}
        </div>
      )}

      {/* ── Send Link tab ── */}
      {tab === "link" && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1">
            <p className="font-semibold text-blue-900 text-sm">WhatsApp Payment Link</p>
            <p className="text-xs text-blue-700">
              Sends UPI payment link to {job.customerName} on WhatsApp.
              Valid for 24 hours. You can complete the wash — payment tracked separately.
            </p>
          </div>

          <div className="bg-white border rounded-xl p-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Sending to</span><span className="font-medium">{job.customerPhone}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-green-700">₹{amount}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Package</span><span>{job.packageName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">UPI ID</span><span className="font-mono text-xs">{BUSINESS_UPI.id}</span></div>
          </div>

          <button onClick={handleLink}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 transition-colors">
            <Send className="w-4 h-4" />Send Payment Link on WhatsApp
          </button>

          <p className="text-xs text-gray-400 text-center">
            TSE will confirm when customer pays. Job marked pending until then.
          </p>
        </div>
      )}

      {/* Skip option for pre-paid subscriptions with pending status */}
      {!payRequired && canSkip && onSkip && (
        <button onClick={onSkip} className="w-full text-xs text-gray-400 py-2 hover:text-gray-600 flex items-center justify-center gap-1">
          Skip — already paid via subscription <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
