import { useState, useEffect, ComponentType } from "react";

/**
 * SupervisorAppLazy — loads SupervisorAppConnected via useEffect instead of
 * React.lazy/Suspense to avoid circular module TDZ errors when bundled into main.
 */
export function SupervisorAppLazy() {
  const [Comp, setComp] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    import("./SupervisorAppConnected")
      .then(m => setComp(() => m.default || m.SupervisorAppConnected))
      .catch(e => setError(e.message));
  }, []);

  if (error) return (
    <div className="p-6 text-red-600">Failed to load Supervisor App: {error}</div>
  );
  if (!Comp) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
  return <Comp />;
}

export default SupervisorAppLazy;
