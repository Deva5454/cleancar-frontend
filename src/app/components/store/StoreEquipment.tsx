import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, Wrench } from "lucide-react";

export function StoreEquipment() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Equipment Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage equipment in central store — assignment, returns, and maintenance
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Assign Equipment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-teal-600" />
            <CardTitle className="text-base">Equipment In Store</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Equipment tracking, washer kit assignments, returns, and maintenance dispatch will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
