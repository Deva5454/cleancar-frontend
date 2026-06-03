import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Clock } from "lucide-react";

export function WorkingHoursSimple() {
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Working Hours & Shift Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure and manage employee working hours
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-semibold">Shift Time: 09:00 - 17:00</div>
              <div className="text-sm text-gray-600">Total: 8 hours</div>
            </div>
          </div>
          <Button className="mt-4">
            Edit Shift
          </Button>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-300">
        <CardContent className="p-4">
          <div className="text-green-700 font-medium">
            ✅ If you see this, the route is working correctly!
          </div>
          <div className="text-sm text-gray-600 mt-2">
            The full component should load. If not, there may be a complex component issue.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
