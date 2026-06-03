import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, FileText } from "lucide-react";

export function StoreRequisitions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Material Requisitions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Raise MRs for central store replenishment
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Raise Requisition
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            <CardTitle className="text-base">My Requisitions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Requisition creation with auto-fill from reorder alerts will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
