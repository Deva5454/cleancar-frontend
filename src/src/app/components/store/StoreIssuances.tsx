import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, Package } from "lucide-react";

export function StoreIssuances() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Material Issuances</h2>
          <p className="text-sm text-gray-500 mt-1">
            Issue materials to washers and supervisors with FIFO enforcement
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Issue Materials
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-base">Issuance Requests</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            FIFO batch allocation, bulk monthly kits, and issuance tracking will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
