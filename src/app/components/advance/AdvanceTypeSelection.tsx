/**
 * Advance Type Selection Screen
 * Entry point for advance application
 * Financial Control > Ease of Use
 */

import { useNavigate } from "react-router-dom";
import { useRole } from "../../contexts/RoleContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  FileText,
  Zap,
  ArrowLeft,
} from "lucide-react";

export function AdvanceTypeSelection() {
  const navigate = useNavigate();
  const { currentRole } = useRole();

  const handleBack = () => {
    // Navigate based on role - washers go back to car washer module, others to home
    if (currentRole === "Car Washer" || currentRole === "washer") {
      navigate("/car-washer");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Apply for Advance</h1>
          <p className="text-gray-600 mt-2">
            Check the type of advance based on your requirement
          </p>
        </div>

        {/* Type Selection Cards */}
        <div className="max-w-2xl mx-auto">
          {/* Short-Term Advance */}
          <Card className="border-2 border-green-200 hover:border-green-400 transition-all cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-bl-full opacity-50" />

            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Short-Term Advance</CardTitle>
                    <Badge variant="outline" className="mt-2 border-green-300 text-green-700">
                      Quick / Instant
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Definition */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-700 font-medium">
                  Quick advance based on earned salary. Recovered in the same salary cycle. No
                  security required.
                </p>
              </div>

              {/* Key Rules */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Single Deduction</p>
                    <p className="text-xs text-gray-600">
                      Recovered in current salary cycle • No EMI
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Auto-Calculated Limit</p>
                    <p className="text-xs text-gray-600">
                      Max 60% of earned salary • System-driven calculation
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Auto-Approved</p>
                    <p className="text-xs text-gray-600">
                      Within limit: instant approval • Over limit: requires override
                    </p>
                  </div>
                </div>
              </div>

              {/* Eligibility */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-1">Eligibility:</p>
                <p className="text-xs text-gray-600">
                  All employees • No pending short-term advance • Based on attendance
                </p>
              </div>

              {/* CTA */}
              <Button
                onClick={() => navigate("/advance/short-term/apply")}
                className="w-full mt-4 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Apply for Short-Term Advance
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Important Notice */}
        <Card className="border-red-200 bg-red-50 max-w-2xl mx-auto mt-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900 text-sm mb-1">Important Notice</p>
                <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                  <li>
                    <strong>Short-term advances:</strong> Must be within your role-based limit •
                    Full recovery in next month's salary
                  </li>
                  <li>
                    <strong>Auto-deduction:</strong> Approved advance amount automatically deducted
                    in the next month's payroll
                  </li>
                  <li>
                    <strong>Exit settlement:</strong> Outstanding advances deducted from F&F
                    settlement
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
