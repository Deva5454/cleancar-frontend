import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, Truck } from "lucide-react";

export function GoodsReceipt() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Goods Receipt (GRN)</h2>
          <p className="text-sm text-gray-500 mt-1">
            Receive materials and equipment — create GRN records
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create GRN
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base">Pending Deliveries</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Full GRN creation form with photo capture, batch creation, and equipment serial number entry will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
