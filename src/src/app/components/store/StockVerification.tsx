import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, ClipboardCheck } from "lucide-react";

export function StockVerification() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Central Store Stock Verification</h2>
          <p className="text-sm text-gray-500 mt-1">
            Periodic physical counts of central store inventory
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Start Verification
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-green-600" />
            <CardTitle className="text-base">Verification History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Physical count workflow, variance tracking, photo evidence, and approval process will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
