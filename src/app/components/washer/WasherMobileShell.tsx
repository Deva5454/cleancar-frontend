// Mobile-first Washer Module Shell with Bottom Navigation
// Optimized for field use: large touch targets, bottom nav, full-screen flow
import { useState } from "react";
import { Home, CalendarDays, TrendingUp, Package, User } from "lucide-react";
import { Badge } from "../ui/badge";
import { WasherCoreScreensConnected } from "./WasherCoreScreensConnected";
import { WasherMyStock } from "./WasherMyStock";
import { WasherProfile } from "./WasherProfile";
import { WasherIncentiveTracker } from "./WasherIncentiveTracker";
import { useWasher } from "../../contexts/WasherContext";

type TabType = "home" | "schedule" | "incentive" | "stock" | "profile";

export function WasherMobileShell() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const { stats, dayStatus, isCheckedIn } = useWasher();

  const incentiveUnits = stats.completed > 20 ? stats.completed - 20 : 0;

  const renderActiveTab = () => {
    switch (activeTab) {
      case "home":
      case "schedule":
        // WasherCoreScreensConnected handles its own internal navigation
        // (dashboard → check-in → schedule → active wash → check-out)
        // Tab "home" and "schedule" both enter the connected flow;
        // the flow itself manages which screen is shown.
        return <WasherCoreScreensConnected />;
      case "incentive":
        return (
          <WasherIncentiveTracker
            data={{
              baseUnits: 20,
              completedUnits: stats.completed,
              incentiveUnits,
              todayIncentiveEarnings: incentiveUnits * 25,
              monthlyIncentiveUnits: 0,
              monthlyIncentiveEarnings: 0,
              timeBandStatus: "ACTIVE",
              timeBandExpiry: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
              eligibilityStatus: incentiveUnits > 0 ? "ELIGIBLE" : "NOT_ELIGIBLE",
              eligibilityReason: incentiveUnits > 0 ? "Meeting all criteria" : "Complete 20 base units first",
              hasAttendanceImpact: dayStatus.isLate,
              lateMarksCount: dayStatus.isLate ? 1 : 0,
            }}
            currentDate={new Date().toISOString()}
            monthName={new Date().toLocaleString("en-IN", { month: "long" })}
          />
        );
      case "stock":
        return <WasherMyStock />;
      case "profile":
        return <WasherProfile />;
      default:
        return <WasherCoreScreensConnected />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Main Content */}
      <div className="h-full">{renderActiveTab()}</div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
        <div className="grid grid-cols-5 h-16">

          {/* Home / Dashboard */}
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === "home" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === "home" ? "fill-current" : ""}`} />
            <span className="text-xs font-medium">Home</span>
          </button>

          {/* Schedule */}
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === "schedule" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <CalendarDays className={`w-5 h-5 ${activeTab === "schedule" ? "fill-current" : ""}`} />
            <span className="text-xs font-medium">Schedule</span>
          </button>

          {/* Incentive */}
          <button
            onClick={() => setActiveTab("incentive")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
              activeTab === "incentive" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {incentiveUnits > 0 && (
              <Badge className="absolute -top-1 right-3 bg-green-500 text-white text-xs px-1 min-w-[18px] h-4 flex items-center justify-center">
                {incentiveUnits}
              </Badge>
            )}
            <TrendingUp className={`w-5 h-5 ${activeTab === "incentive" ? "fill-current" : ""}`} />
            <span className="text-xs font-medium">Earnings</span>
          </button>

          {/* My Stock */}
          <button
            onClick={() => setActiveTab("stock")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === "stock" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Package className={`w-5 h-5 ${activeTab === "stock" ? "fill-current" : ""}`} />
            <span className="text-xs font-medium">Stock</span>
          </button>

          {/* Profile */}
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === "profile" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <User className={`w-5 h-5 ${activeTab === "profile" ? "fill-current" : ""}`} />
            <span className="text-xs font-medium">Profile</span>
          </button>

        </div>
      </div>
    </div>
  );
}
