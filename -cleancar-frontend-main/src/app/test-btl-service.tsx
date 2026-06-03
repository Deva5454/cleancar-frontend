/**
 * DIAGNOSTIC TEST PAGE
 * Tests btlLeadService directly
 */

import { useEffect, useState } from "react";
import { btlLeadService } from "./services/btlLeadService";

export default function TestBTLService() {
  const [diagnostics, setDiagnostics] = useState<any>({});

  useEffect(() => {
    console.log("🧪 Running BTL Service Diagnostics...");

    // Test 1: Check if service exists
    const serviceExists = !!btlLeadService;
    console.log("✓ Test 1: Service exists:", serviceExists);

    // Test 2: Get all leads
    const allLeads = btlLeadService.getSupervisorLeads("SUP-001");
    console.log("✓ Test 2: Leads count:", allLeads.length);
    console.log("✓ Test 2: Leads data:", allLeads);

    // Test 3: Get metrics
    const metrics = btlLeadService.getSupervisorMetrics("SUP-001");
    console.log("✓ Test 3: Metrics:", metrics);

    // Test 4: Check individual lead data
    const firstLead = allLeads[0];
    console.log("✓ Test 4: First lead:", firstLead);

    setDiagnostics({
      serviceExists,
      leadsCount: allLeads.length,
      metricsTotal: metrics.totalLeads,
      firstLead: firstLead ? {
        id: firstLead.id,
        name: firstLead.name,
        status: firstLead.status,
      } : null,
      allLeads,
      metrics,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6">🧪 BTL Service Diagnostics</h1>

          <div className="space-y-4">
            {/* Test 1 */}
            <div className="border-2 border-gray-300 rounded p-4">
              <h2 className="text-xl font-bold mb-2">Test 1: Service Exists</h2>
              <p className={`text-2xl font-bold ${diagnostics.serviceExists ? 'text-green-600' : 'text-red-600'}`}>
                {diagnostics.serviceExists ? "✅ PASS" : "❌ FAIL"}
              </p>
            </div>

            {/* Test 2 */}
            <div className="border-2 border-gray-300 rounded p-4">
              <h2 className="text-xl font-bold mb-2">Test 2: Leads Count</h2>
              <p className={`text-2xl font-bold ${diagnostics.leadsCount === 8 ? 'text-green-600' : 'text-red-600'}`}>
                {diagnostics.leadsCount === 8 ? "✅ PASS" : "❌ FAIL"} - {diagnostics.leadsCount} leads
              </p>
              <p className="text-sm text-gray-600 mt-2">Expected: 8 leads, Got: {diagnostics.leadsCount}</p>
            </div>

            {/* Test 3 */}
            <div className="border-2 border-gray-300 rounded p-4">
              <h2 className="text-xl font-bold mb-2">Test 3: Metrics Total</h2>
              <p className={`text-2xl font-bold ${diagnostics.metricsTotal === 8 ? 'text-green-600' : 'text-red-600'}`}>
                {diagnostics.metricsTotal === 8 ? "✅ PASS" : "❌ FAIL"} - {diagnostics.metricsTotal} total
              </p>
              <p className="text-sm text-gray-600 mt-2">Expected: 8, Got: {diagnostics.metricsTotal}</p>
            </div>

            {/* Test 4 */}
            <div className="border-2 border-gray-300 rounded p-4">
              <h2 className="text-xl font-bold mb-2">Test 4: First Lead Data</h2>
              {diagnostics.firstLead ? (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-green-600 font-bold text-xl mb-2">✅ PASS</p>
                  <p className="text-sm"><strong>ID:</strong> {diagnostics.firstLead.id}</p>
                  <p className="text-sm"><strong>Name:</strong> {diagnostics.firstLead.name}</p>
                  <p className="text-sm"><strong>Status:</strong> {diagnostics.firstLead.status}</p>
                </div>
              ) : (
                <p className="text-red-600 font-bold text-xl">❌ FAIL - No lead data</p>
              )}
            </div>

            {/* Full Data */}
            <div className="border-2 border-blue-300 rounded p-4 bg-blue-50">
              <h2 className="text-xl font-bold mb-2">📊 Full Diagnostics Data</h2>
              <pre className="text-xs bg-white p-3 rounded overflow-auto max-h-96">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </div>

            {/* Console Check */}
            <div className="border-2 border-yellow-300 rounded p-4 bg-yellow-50">
              <h2 className="text-xl font-bold mb-2">🔍 Console Instructions</h2>
              <p className="text-sm mb-2">Open browser console (F12) and check for logs starting with:</p>
              <ul className="text-sm list-disc list-inside space-y-1">
                <li>✅ BTL Lead Service initialized with X leads</li>
                <li>📋 getSupervisorLeads("SUP-001"): X leads found</li>
                <li>🧪 Running BTL Service Diagnostics...</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
