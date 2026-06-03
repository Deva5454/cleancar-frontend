/**
 * Payslip Explainer Drawer
 *
 * Right-side drawer that explains payslip components in simple terms
 * Opens from payslip view with "[ Explain My Payslip ]" button
 *
 * NON-DISRUPTIVE: Overlay only - does not navigate away
 */

import { useState, useEffect } from "react";
import { X, Info, HelpCircle, TrendingDown, TrendingUp } from "lucide-react";

interface PayslipExplainerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  payslipData?: {
    earnings: {
      basic: number;
      hra: number;
      conveyance: number;
      medical: number;
      special: number;
      other: number;
    };
    deductions: {
      pf: number;
      esi: number;
      pt: number;
      lwf: number;
      tds: number;
      advance: number;
    };
    gross: number;
    totalDeductions: number;
    netPay: number;
  };
}

export function PayslipExplainerDrawer({
  isOpen,
  onClose,
  payslipData,
}: PayslipExplainerDrawerProps) {
  const [activeSection, setActiveSection] = useState<"earnings" | "deductions" | "summary">(
    "earnings"
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !payslipData) return null;

  const earningsExplained = [
    {
      label: "Basic Salary",
      value: payslipData.earnings.basic,
      explanation:
        "Core salary component, typically 40-50% of gross. Used to calculate PF and other benefits.",
    },
    {
      label: "HRA (House Rent Allowance)",
      value: payslipData.earnings.hra,
      explanation:
        "Rent allowance. 50% of HRA is tax-exempt if you live in rented accommodation.",
    },
    {
      label: "Conveyance Allowance",
      value: payslipData.earnings.conveyance,
      explanation: "Travel allowance for commuting to work. Partially tax-exempt up to ₹1,600/month.",
    },
    {
      label: "Medical Allowance",
      value: payslipData.earnings.medical,
      explanation:
        "Healthcare reimbursement. Tax-exempt up to ₹1,250/month with bills.",
    },
    {
      label: "Special Allowance",
      value: payslipData.earnings.special,
      explanation: "Additional allowance. Fully taxable but flexible for structuring.",
    },
    {
      label: "Other Allowances",
      value: payslipData.earnings.other,
      explanation: "Miscellaneous allowances like food, mobile, internet, etc.",
    },
  ];

  const deductionsExplained = [
    {
      label: "PF (Provident Fund)",
      value: payslipData.deductions.pf,
      explanation:
        "Retirement savings. You contribute 12%, employer matches 12%. Tax-free on withdrawal after 5 years.",
      type: "statutory" as const,
    },
    {
      label: "ESI (Employee State Insurance)",
      value: payslipData.deductions.esi,
      explanation:
        "Health insurance for salary ≤ ₹21,000. You pay 0.75%, employer pays 3.25%. Free medical care.",
      type: "statutory" as const,
    },
    {
      label: "PT (Professional Tax)",
      value: payslipData.deductions.pt,
      explanation: "State-level tax based on salary slab. Varies by state (max ₹2,500/year).",
      type: "statutory" as const,
    },
    {
      label: "LWF (Labour Welfare Fund)",
      value: payslipData.deductions.lwf,
      explanation: "State welfare contribution for workers. Small fixed amount.",
      type: "statutory" as const,
    },
    {
      label: "TDS (Tax Deducted at Source)",
      value: payslipData.deductions.tds,
      explanation:
        "Income tax deducted monthly based on annual projection. You can claim refund while filing ITR.",
      type: "statutory" as const,
    },
    {
      label: "Advance Deduction",
      value: payslipData.deductions.advance,
      explanation: "Salary advance recovery. Deducted as per agreed schedule.",
      type: "other" as const,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HelpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Payslip Explainer
              </h2>
              <p className="text-sm text-gray-500">
                Understand your salary components
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Quick Summary */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Gross Salary</span>
              <span className="text-lg font-bold text-gray-900">
                ₹{(payslipData?.gross ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Total Deductions</span>
              <span className="text-lg font-bold text-red-600">
                -₹{(payslipData?.totalDeductions ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="pt-3 border-t border-blue-200 flex items-center justify-between">
              <span className="text-base font-semibold text-gray-900">Net Pay</span>
              <span className="text-2xl font-bold text-green-600">
                ₹{(payslipData?.netPay ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveSection("earnings")}
              className={`py-3 px-4 text-sm font-medium transition-colors ${
                activeSection === "earnings"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Earnings</span>
              </div>
            </button>
            <button
              onClick={() => setActiveSection("deductions")}
              className={`py-3 px-4 text-sm font-medium transition-colors ${
                activeSection === "deductions"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                <span>Deductions</span>
              </div>
            </button>
            <button
              onClick={() => setActiveSection("summary")}
              className={`py-3 px-4 text-sm font-medium transition-colors ${
                activeSection === "summary"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>Summary</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          {activeSection === "earnings" && (
            <>
              {earningsExplained.map((item, index) => (
                item.value > 0 && (
                  <div
                    key={index}
                    className="p-4 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-gray-900">{item.label}</div>
                      <div className="text-lg font-bold text-green-600">
                        ₹{(item?.value ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{item.explanation}</p>
                  </div>
                )
              ))}
            </>
          )}

          {activeSection === "deductions" && (
            <>
              {deductionsExplained.map((item, index) => (
                item.value > 0 && (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${
                      item.type === "statutory"
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-gray-900">{item.label}</div>
                        {item.type === "statutory" && (
                          <div className="text-xs text-blue-600 mt-0.5">Statutory</div>
                        )}
                      </div>
                      <div className="text-lg font-bold text-red-600">
                        -₹{(item?.value ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{item.explanation}</p>
                  </div>
                )
              ))}
            </>
          )}

          {activeSection === "summary" && (
            <>
              {/* Breakdown Visual */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Salary Breakdown
                  </h3>

                  {/* Gross Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Gross Salary</span>
                      <span className="font-medium">₹{(payslipData?.gross ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-green-200 rounded-full">
                      <div className="h-2 bg-green-500 rounded-full w-full" />
                    </div>
                  </div>

                  {/* Deductions Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Deductions</span>
                      <span className="font-medium text-red-600">
                        -₹{(payslipData?.totalDeductions ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-red-500 rounded-full"
                        style={{
                          width: `${(payslipData.totalDeductions / payslipData.gross) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Net Pay Bar */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-900 font-semibold">Net Pay</span>
                      <span className="font-bold text-lg text-green-600">
                        ₹{(payslipData?.netPay ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full">
                      <div
                        className="h-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                        style={{
                          width: `${(payslipData.netPay / payslipData.gross) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Key Facts */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Key Facts
                  </h3>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-900">
                        <strong>Statutory Deductions</strong> (PF, ESI, PT, LWF) are
                        mandatory by law. They provide social security and retirement
                        benefits.
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-green-900">
                        <strong>PF Contributions</strong> are matched by your employer
                        (12% + 12%). This doubles your retirement savings!
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-900">
                        <strong>TDS</strong> is an advance tax payment. You can claim
                        refund or adjust when filing your annual Income Tax Return.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
