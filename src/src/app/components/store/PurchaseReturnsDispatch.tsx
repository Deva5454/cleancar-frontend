import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TrendingDown } from "lucide-react";

export function PurchaseReturnsDispatch() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Purchase Returns Dispatch</h2>
        <p className="text-sm text-gray-500 mt-1">
          Physical dispatch of goods being returned to suppliers
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-base">Returns Pending Dispatch</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Packing checklist, dispatch photos, and tracking will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
