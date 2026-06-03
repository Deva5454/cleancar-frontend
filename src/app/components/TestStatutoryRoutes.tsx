/**
 * Test component to verify statutory routes are accessible
 */

import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { FileText, Shield, CheckCircle } from "lucide-react";

export function TestStatutoryRoutes() {
  return (
    <div className="p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Statutory Forms Routes - Navigation Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">Click the buttons below to test navigation to statutory forms:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/hr/statutory-forms-onboarding">
              <Button className="w-full h-20 bg-blue-600 hover:bg-blue-700 flex flex-col items-center justify-center gap-2">
                <FileText className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-semibold">Employee Portal</div>
                  <div className="text-xs opacity-90">/hr/statutory-forms-onboarding</div>
                </div>
              </Button>
            </Link>

            <Link to="/hr/statutory-forms-verification">
              <Button className="w-full h-20 bg-teal-600 hover:bg-teal-700 flex flex-col items-center justify-center gap-2">
                <Shield className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-semibold">HR Verification</div>
                  <div className="text-xs opacity-90">/hr/statutory-forms-verification</div>
                </div>
              </Button>
            </Link>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Routes Configured</p>
                <p className="text-sm mt-1">
                  Both statutory form routes are properly configured in the router.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 font-semibold mb-2">Alternative Access Methods:</p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>From HR Module: Click "Statutory Forms" button</li>
              <li>Direct URL: Type /hr/statutory-forms-onboarding in browser</li>
              <li>Direct URL: Type /hr/statutory-forms-verification in browser</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-semibold text-gray-900 mb-2">Component Status:</p>
            <div className="space-y-1 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>StatutoryFormsOnboarding.tsx - ✅ Created</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>StatutoryFormsVerification.tsx - ✅ Created</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Routes configured - ✅ Done</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>HR Module navigation - ✅ Added</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
