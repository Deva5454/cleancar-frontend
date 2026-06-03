/**
 * Automation & Audit Layer Demo
 *
 * Showcases all Phase 3 enterprise features:
 * 1. Compliance Reports Module
 * 2. AI Compliance Bot
 * 3. Global Event Monitor (floating widget)
 * 4. Alert Banners (top notifications)
 *
 * Route: /compliance/automation-demo
 */

import { useState } from "react";
import { GlobalEventMonitor } from "../../components/compliance/GlobalEventMonitor";
import { ComplianceAlertBanner } from "../../components/compliance/ComplianceAlertBanner";
import {
  FileText,
  Bot,
  Bell,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AutomationLayerDemo() {
  const [showBanner, setShowBanner] = useState(true);
  const [showWidget, setShowWidget] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Alert Banner */}
      {showBanner && <ComplianceAlertBanner />}

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">Automation & Audit Layer</h1>
                <p className="text-purple-100 mt-2">
                  Enterprise-grade compliance automation with AI-powered monitoring
                </p>
              </div>
            </div>
          </div>

          {/* Feature Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Compliance Reports</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Generate PF, ESIC, PT, LWF, TDS reports with CA Mode
              </p>
              <Link
                to="/compliance/reports"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Open Reports Module →
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Bot className="w-6 h-6 text-purple-600" />
                <h3 className="font-semibold text-gray-900">AI Compliance Bot</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Auto-detect regulatory changes and apply updates
              </p>
              <Link
                to="/compliance/ai-bot"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Open AI Bot →
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Bell className="w-6 h-6 text-yellow-600" />
                <h3 className="font-semibold text-gray-900">Event Monitor</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Bottom-right floating widget with real-time alerts
              </p>
              <button
                onClick={() => setShowWidget(!showWidget)}
                className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
              >
                {showWidget ? "Hide" : "Show"} Widget →
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="font-semibold text-gray-900">Alert Banners</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Top notification bar for critical compliance alerts
              </p>
              <button
                onClick={() => setShowBanner(!showBanner)}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                {showBanner ? "Hide" : "Show"} Banner →
              </button>
            </div>
          </div>

          {/* Key Features */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Key Enterprise Features</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Automated Report Generation</div>
                    <p className="text-sm text-gray-600 mt-1">
                      Generate PF ECR, ESIC returns, PT challans, TDS Form 24Q with one click.
                      Export in Excel, PDF, or CSV formats.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">AI-Powered Change Detection</div>
                    <p className="text-sm text-gray-600 mt-1">
                      Automatically detects regulatory changes from government notifications.
                      Analyzes impact on employees and financials.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">One-Click Updates</div>
                    <p className="text-sm text-gray-600 mt-1">
                      Apply compliance rule changes automatically. Manual review required for
                      complex updates with detailed action plans.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">CA Mode Enhanced Reporting</div>
                    <p className="text-sm text-gray-600 mt-1">
                      Toggle CA Mode for audit-ready reports with detailed breakdowns,
                      compliance verification, and enhanced formatting.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Real-Time Alert System</div>
                    <p className="text-sm text-gray-600 mt-1">
                      Floating widget shows active compliance alerts. Dismissible top banner
                      for critical issues. Never miss a deadline.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Compliance Health Monitoring</div>
                    <p className="text-sm text-gray-600 mt-1">
                      0-100 health score with letter grade (A-F). Track pending issues by
                      severity. Get actionable recommendations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Filing Deadline Tracking</div>
                    <p className="text-sm text-gray-600 mt-1">
                      Auto-calculated deadlines for each report type. Visual indicators for
                      overdue, upcoming, and safe filings.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">Multi-State Support</div>
                    <p className="text-sm text-gray-600 mt-1">
                      Handles state-specific rules for all 10 supported states. Auto-detects
                      state from employee location.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Implementation Highlights */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Non-Disruptive Implementation
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Separate Modules</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Compliance features live in dedicated menu items. Never interfere with
                  existing payroll UI.
                </p>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Optional Overlays</h3>
                </div>
                <p className="text-sm text-green-700">
                  Floating widgets and banners are dismissible. Users control what they
                  see and when.
                </p>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Zero Migration</h3>
                </div>
                <p className="text-sm text-purple-700">
                  All features work with existing data. No schema changes or data migration
                  required.
                </p>
              </div>
            </div>
          </div>

          {/* Demo Actions */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-6 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ExternalLink className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Try the Complete System
                  </h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Explore all automation and audit features in their dedicated modules. Each
                    feature is production-ready and fully functional.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to="/compliance/reports"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                    >
                      <FileText className="w-5 h-5" />
                      Compliance Reports
                    </Link>
                    <Link
                      to="/compliance/ai-bot"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700"
                    >
                      <Bot className="w-5 h-5" />
                      AI Compliance Bot
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Event Monitor Widget */}
      {showWidget && <GlobalEventMonitor />}
    </div>
  );
}
