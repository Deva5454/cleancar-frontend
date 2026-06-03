/**
 * Dev-Only Route Guard
 * Prevents access to demo/test/diagnostic routes in production
 *
 * Usage:
 * <DevOnlyRoute element={<TestComponent />} />
 */

import { Navigate } from "react-router-dom";
import { logger } from "../../services/logger";

interface DevOnlyRouteProps {
  element: React.ReactElement;
}

export function DevOnlyRoute({ element }: DevOnlyRouteProps) {
  // Check if running in development mode
  const isDevelopment = import.meta.env.MODE === "development" || import.meta.env.DEV;

  if (!isDevelopment) {
    logger.warn("[DevOnlyRoute] Access denied: Route is only available in development mode");
    return <Navigate to="/" replace />;
  }

  return element;
}

/**
 * USAGE EXAMPLE:
 *
 * In routes.tsx:
 *
 * { path: "test-feature", element: <DevOnlyRoute element={<TestFeature />} /> }
 * { path: "demo-workflow", element: <DevOnlyRoute element={<WorkflowDemo />} /> }
 * { path: "diagnostics", element: <DevOnlyRoute element={<Diagnostics />} /> }
 */
