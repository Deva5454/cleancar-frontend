// Mobile-first Washer Module Shell with Bottom Navigation
// Optimized for field use with wet hands, bright sunlight, offline operation
import { useState } from "react";
import { Home, Camera, Package, User, Bell } from "lucide-react";
import { Badge } from "../ui/badge";
import { WasherTodayScreen } from "./WasherTodayScreen";
import { WasherDemoTab } from "./WasherDemoTab";
import { WasherMyStock } from "./WasherMyStock";
import { WasherProfile } from "./WasherProfile";
import { WasherNotifications } from "./WasherNotifications";
import { useRole } from "../../contexts/RoleContext";

type TabType = "today" | "demo" | "stock" | "profile" | "notifications";

export function WasherMobileShell() {
  const { currentUser } = useRole();
  const [activeTab, setActiveTab] = useState<TabType>("today");
  const [isOnline, setIsOnline] = useState(true); // In real app: navigator.onLine
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [unreadDemos, setUnreadDemos] = useState(1);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "today":
        return <WasherTodayScreen />;
      case "demo":
        return <WasherDemoTab />;
      case "stock":
        return <WasherMyStock />;
      case "profile":
        return <WasherProfile />;
      case "notifications":
        return <WasherNotifications unreadCount={unreadNotifications} />;
      default:
        return <WasherTodayScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Connectivity Indicator */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium ${
          isOnline
            ? "bg-green-50 text-green-800 border-b border-green-200"
            : "bg-amber-50 text-amber-800 border-b border-amber-200"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isOnline ? "bg-green-600" : "bg-amber-600 animate-pulse"
            }`}
          />
          {isOnline ? "Online" : "Offline — actions will sync when connected"}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pt-10">{renderActiveTab()}</div>

      {/* Bottom Navigation Bar - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 h-20">
          {/* Today Tab */}
          <button
            onClick={() => setActiveTab("today")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === "today"
                ? "text-teal-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Home
              className={`w-6 h-6 ${
                activeTab === "today" ? "fill-current" : ""
              }`}
            />
            <span className="text-xs font-medium">Today</span>
          </button>

          {/* Demo Tab */}
          <button
            onClick={() => setActiveTab("demo")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
              activeTab === "demo"
                ? "text-teal-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {unreadDemos > 0 && (
              <Badge className="absolute top-2 right-8 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                {unreadDemos}
              </Badge>
            )}
            <Camera
              className={`w-6 h-6 ${activeTab === "demo" ? "fill-current" : ""}`}
            />
            <span className="text-xs font-medium">Demo</span>
          </button>

          {/* My Stock Tab */}
          <button
            onClick={() => setActiveTab("stock")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === "stock"
                ? "text-teal-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Package
              className={`w-6 h-6 ${
                activeTab === "stock" ? "fill-current" : ""
              }`}
            />
            <span className="text-xs font-medium">My Stock</span>
          </button>

          {/* My Profile Tab */}
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === "profile"
                ? "text-teal-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <User
              className={`w-6 h-6 ${
                activeTab === "profile" ? "fill-current" : ""
              }`}
            />
            <span className="text-xs font-medium">Profile</span>
          </button>

          {/* Notifications Tab */}
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
              activeTab === "notifications"
                ? "text-teal-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {unreadNotifications > 0 && (
              <Badge className="absolute top-2 right-8 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                {unreadNotifications}
              </Badge>
            )}
            <Bell
              className={`w-6 h-6 ${
                activeTab === "notifications" ? "fill-current" : ""
              }`}
            />
            <span className="text-xs font-medium">Alerts</span>
          </button>
        </div>
      </div>
    </div>
  );
}