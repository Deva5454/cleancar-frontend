/**
 * Hook to initialize attendance data on app load
 */

import { useEffect, useState } from "react";
import { initializeAttendanceData } from "../services/seedAttendanceData";

export function useAttendanceDataInit() {
  const [initialized, setInitialized] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!initialized) {
      try {
        const result = initializeAttendanceData();
        setSeeded(result.seeded);
        setInitialized(true);
      } catch (error) {
        console.error("Error initializing attendance data:", error);
        setInitialized(true); // Mark as initialized even on error to prevent retry loops
      }
    }
  }, [initialized]);

  return { initialized, seeded };
}
