path = r"src/app/components/washer/WasherCoreScreensConnected.tsx"
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Add import
old_imp = 'import { mockWasherDataService, computePeriodicFlagsB } from "../../services/mockWasherDataService";'
new_imp = old_imp + '\nimport { fieldTrackingService } from "../../services/fieldTrackingService";'
c = c.replace(old_imp, new_imp)

# Bridge check-in
old_ci = '    } catch (_) {}\n\n    // Fix: start GPS tracking on check-in'
new_ci = '''    } catch (_) {}

    // FIELD TRACKING: Bridge washer check-in to unified field tracking
    try {
      const washerName = profile?.name || (currentUser as any)?.employeeName || "Car Washer";
      const doCheckIn = (lat: number, lng: number, accuracy: number) => {
        fieldTrackingService.checkIn({
          employeeId: washerId || "WASHER-DEMO",
          employeeName: washerName,
          role: "Car Washer",
          selfieBase64: checkInPhoto || "",
          shiftStartTime: "05:00",
          shiftEndTime: "09:00",
        });
      };
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => doCheckIn(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
          () => doCheckIn(21.1702, 72.8311, 999)
        );
      } else { doCheckIn(21.1702, 72.8311, 999); }
    } catch (_) {}

    // Fix: start GPS tracking on check-in'''
c = c.replace(old_ci, new_ci)

# Bridge check-out
old_co = '  const handleSubmitCheckOut = () => {\n    setCheckedOut(true);\n    setShowDaySummary(true);\n  };'
new_co = '''  const handleSubmitCheckOut = () => {
    setCheckedOut(true);
    setShowDaySummary(true);
    try { fieldTrackingService.checkOut(checkOutPhoto || ""); } catch (_) {}
  };'''
c = c.replace(old_co, new_co)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("WasherCoreScreensConnected.tsx done:", "fieldTrackingService" in c)
