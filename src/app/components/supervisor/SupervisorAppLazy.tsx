import { useState, useEffect, ComponentType } from "react";

/**
 * SupervisorAppLazy — loads SupervisorAppConnected via useEffect
 * to avoid circular module TDZ and Suspense hanging issues.
 */
export function SupervisorAppLazy() {
  const [Comp, setComp] = useState<ComponentType | null>(null);

  useEffect(() => {
    import("./SupervisorAppConnected").then(m => {
      setComp(() => m.SupervisorAppConnected || m.default);
    });
  }, []);

  if (!Comp) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return <Comp />;
}

export default SupervisorAppLazy;
