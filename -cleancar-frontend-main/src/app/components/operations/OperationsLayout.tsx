import { Suspense } from 'react';
/**
 * OPERATIONS LAYOUT
 * Layout wrapper for operations routes with <Suspense fallback={<PageLoader />}><Outlet /></Suspense>
 */

import { Outlet } from "react-router-dom";

const PageLoader = () => (
  <div className="p-6 space-y-4 animate-pulse">
    <div className="h-7 bg-gray-200 rounded-md w-2/5" />
    <div className="h-56 bg-gray-100 rounded-xl border border-gray-200 mt-4" />
  </div>
);

export function OperationsLayout() {
  return <Suspense fallback={<PageLoader />}><Outlet /></Suspense>;
}
