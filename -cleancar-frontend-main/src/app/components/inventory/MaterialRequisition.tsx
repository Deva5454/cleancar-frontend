import { BackButton } from "../ui/back-button";
// Material Requisition System Component
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Plus, FileText, Package, CheckCircle } from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { mockMRFs, mockPurchaseRequests } from "../../lib/materialRequisition";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useEmployee } from "../../contexts/EmployeeContext";

export function MaterialRequisition() {
  const { currentRole } = useRole();
  const { stockTransactions, getPendingTransactions, procureInventory,
          getCentralStock, inventory } = useInventory();
  const { city, cityInfo } = useCity();
  const { employees } = useEmployee();

  // Derive MRFs from pending stock transactions
  const liveMRFs = getPendingTransactions(city).map(t => {
    const item = inventory.find(i => i.itemId === t.itemId && i.cityId === city);
    return {
      id: t.transactionId,
      itemName: item?.itemName || t.itemId,
      quantity: t.quantity,
      requestedBy: t.requestedBy || "Unknown",
      status: t.status,
      createdAt: t.createdAt,
      type: t.type,
    };
  });

  // Use live MRFs — fall back to mock only if empty (for demo)
  const displayMRFs = liveMRFs.length > 0 ? liveMRFs : mockMRFs;
  
  const canCreateMRF = ["Supervisor", "Operations Manager", "Store Manager"].includes(currentRole);
  const canApproveMRF = ["Store Manager"].includes(currentRole);
  const canCreatePR = ["Store Manager"].includes(currentRole);
  const canApprovePR = ["Super Admin", "Admin"].includes(currentRole);

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Material Requisition System</h2>
          <p className="text-sm text-gray-600 mt-1">Request and track material requirements</p>
        </div>
        {canCreateMRF && (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New MRF
          </Button>
        )}
      </div>

      {/* Material Requisition Forms (MRF) */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Material Requisition Forms (MRF)
          </h3>
          <div className="space-y-3">
            {displayMRFs.map((mrf) => (
              <div 
                key={mrf.id} 
                className={`p-4 rounded-lg border-2 ${
                  mrf.status === "Pending" ? "bg-orange-50 border-orange-200" :
                  mrf.status === "Approved" ? "bg-green-50 border-green-200" :
                  mrf.status === "Issued" ? "bg-blue-50 border-blue-200" :
                  "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium">{mrf.id}</p>
                      <Badge variant={mrf.priority === "High" ? "destructive" : "default"}>
                        {mrf.priority}
                      </Badge>
                      <Badge variant={
                        mrf.status === "Pending" ? "default" :
                        mrf.status === "Approved" ? "secondary" :
                        mrf.status === "Issued" ? "outline" :
                        "destructive"
                      }>
                        {mrf.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Requested by: <span className="font-medium">{mrf.requestedBy}</span> ({mrf.requestedByRole})
                    </p>
                    <p className="text-xs text-gray-500">
                      Date: {new Date(mrf.dateRequested).toLocaleDateString()}
                    </p>
                  </div>
                  {canApproveMRF && mrf.status === "Pending" && (
                    <Button size="sm">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  {canApproveMRF && mrf.status === "Approved" && (
                    <Button size="sm" variant="outline">
                      <Package className="w-4 h-4 mr-1" />
                      Issue Material
                    </Button>
                  )}
                </div>
                <div className="bg-white/50 p-3 rounded">
                  <p className="text-sm font-medium mb-2">Requested Items:</p>
                  {mrf.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 text-sm">
                      <span className="text-gray-700">{item.itemName}</span>
                      <span className="font-medium">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Purchase Requests */}
      {(canCreatePR || canApprovePR) && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                Purchase Requests
              </h3>
              {canCreatePR && (
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  New Purchase Request
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {mockPurchaseRequests.map((pr) => (
                <div 
                  key={pr.id} 
                  className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">{pr.id}</p>
                        <Badge variant={pr.priority === "High" ? "destructive" : "default"}>
                          {pr.priority}
                        </Badge>
                        <Badge variant="default">{pr.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Requested by: <span className="font-medium">{pr.requestedBy}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Date: {new Date(pr.dateRequested).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Estimated Cost</p>
                      <p className="text-xl font-bold text-purple-600">
                        ₹{(pr?.totalEstimatedCost ?? 0).toLocaleString()}
                      </p>
                      {canApprovePR && pr.status === "Pending" && (
                        <Button size="sm" className="mt-2">
                          Approve & Issue PO
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="bg-white/50 p-3 rounded">
                    <p className="text-sm font-medium mb-2">Items:</p>
                    {pr.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 text-sm border-b last:border-0">
                        <div className="flex-1">
                          <span className="text-gray-700">{item.itemName}</span>
                          {item.vendorSuggestion && (
                            <p className="text-xs text-gray-500">Vendor: {item.vendorSuggestion}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{item.quantity} {item.unit}</span>
                          <p className="text-xs text-gray-600">₹{(item?.estimatedCost ?? 0).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consumption Analytics */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Material Consumption Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-blue-600">₹45K</p>
              <p className="text-xs text-gray-500 mt-1">Material consumed</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Pending MRFs</p>
              <p className="text-2xl font-bold text-green-600">{mockMRFs.filter(m => m.status === "Pending").length}</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Active POs</p>
              <p className="text-2xl font-bold text-purple-600">2</p>
              <p className="text-xs text-gray-500 mt-1">In progress</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
