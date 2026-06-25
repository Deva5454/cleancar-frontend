import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { FileText, Download, TrendingDown, TrendingUp, Package, Wrench, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const INVENTORY = [
  { itemId:"INV-SUR-001", itemName:"Car Shampoo 5L",         unit:"L",   centralStock:45, reorderLevel:20, category:"Cleaning Supplies" },
  { itemId:"INV-SUR-002", itemName:"Microfiber Cloth Large", unit:"Pcs", centralStock:120,reorderLevel:50, category:"Equipment" },
  { itemId:"INV-SUR-003", itemName:"Tyre Shine 500ml",       unit:"L",   centralStock:30, reorderLevel:15, category:"Cleaning Supplies" },
  { itemId:"INV-SUR-004", itemName:"Dashboard Polish",       unit:"L",   centralStock:8,  reorderLevel:20, category:"Cleaning Supplies" },
  { itemId:"INV-SUR-005", itemName:"Pressure Washer Nozzle", unit:"Pcs", centralStock:6,  reorderLevel:4,  category:"Equipment" },
  { itemId:"INV-SUR-006", itemName:"Washer Uniform Set",     unit:"Pcs", centralStock:25, reorderLevel:15, category:"Consumables" },
  { itemId:"INV-SUR-007", itemName:"Wheel Cleaner 1L",       unit:"L",   centralStock:18, reorderLevel:12, category:"Cleaning Supplies" },
  { itemId:"INV-SUR-008", itemName:"Glass Cleaner 500ml",    unit:"L",   centralStock:0,  reorderLevel:10, category:"Cleaning Supplies" },
];

const loadData = (key: string, def: any[]) => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : def; } catch { return def; } };

export function StoreReports() {
  const [reportType, setReportType] = useState("daily-stock");
  const [from, setFrom] = useState("2026-06-01");
  const [to,   setTo]   = useState(new Date().toISOString().split("T")[0]);
  const [showPreview, setShowPreview] = useState(false);

  const grns         = loadData("cleancar_grn_records",           []);
  const issuances    = loadData("cleancar_issuance_records",      []);
  const equipment    = loadData("cleancar_equipment",             []);
  const verifications= loadData("cleancar_stock_verifications",   []);
  const requisitions = loadData("cleancar_requisitions",          []);

  const handlePreview = () => { setShowPreview(true); toast.success("Report generated"); };
  const handleDownload = () => {
    const rows = getReportRows();
    const csv  = [Object.keys(rows[0]??{}).join(","), ...rows.map(r=>Object.values(r).join(","))].join("\n");
    const a    = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `${reportType}-${to}.csv`;
    a.click();
    toast.success("Report downloaded as CSV");
  };

  const getReportRows = (): any[] => {
    switch (reportType) {
      case "daily-stock": return INVENTORY.map(i=>({ "Item":i.itemName, "Category":i.category, "Unit":i.unit, "Central Stock":i.centralStock, "Reorder Level":i.reorderLevel, "Status": i.centralStock===0?"Out of Stock":i.centralStock<=i.reorderLevel?"Below Reorder":"Adequate" }));
      case "grn":         return grns.filter((g:any)=>g.grnDate>=from&&g.grnDate<=to).map((g:any)=>({ "GRN No":g.grnNumber, "Date":g.grnDate, "Supplier":g.supplierName, "Challan":g.challanNumber, "Accepted":g.totalAccepted, "Rejected":g.totalRejected, "Status":g.status }));
      case "issuance":    return issuances.filter((i:any)=>i.issuanceDate>=from&&i.issuanceDate<=to).map((i:any)=>({ "Issuance No":i.issuanceId, "Date":i.issuanceDate, "Issued To":i.issuedTo, "Type":i.recipientType, "Purpose":i.purpose, "Total Qty":i.totalQty, "Status":i.status }));
      case "equipment":   return equipment.map((e:any)=>({ "Equipment ID":e.equipmentId, "Name":e.name, "Serial No":e.serialNo, "Category":e.category, "Status":e.status, "Assigned To":e.assignedTo??"—", "Condition":e.condition }));
      case "verification":return verifications.map((v:any)=>({ "Verification ID":v.verificationId, "Date":v.verificationDate, "Type":v.type, "Status":v.status, "Conducted By":v.conductedBy, "Total Variance":v.totalVariance }));
      case "dead-stock":  return INVENTORY.filter(i=>i.centralStock===0).map(i=>({ "Item":i.itemName, "Unit":i.unit, "Stock":i.centralStock, "Reorder Level":i.reorderLevel, "Status":"Out of Stock" }));
      case "expiry":      return [{ "Note":"Expiry tracking based on GRN batch dates", "Items to Check":"Car Shampoo, Dashboard Polish, Tyre Shine" }];
      default:            return INVENTORY.map(i=>({ "Item":i.itemName, "Stock":i.centralStock, "Unit":i.unit }));
    }
  };

  const renderPreview = () => {
    const rows = getReportRows();
    if (rows.length === 0) return <p className="text-sm text-gray-500 text-center py-6">No data for selected period</p>;
    const cols = Object.keys(rows[0]);
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead><tr className="bg-gray-100">{cols.map(c=><th key={c} className="text-left px-3 py-2 border border-gray-200 font-semibold">{c}</th>)}</tr></thead>
          <tbody>{rows.map((row,i)=>(
            <tr key={i} className={i%2===0?"bg-white":"bg-gray-50"}>
              {cols.map(c=><td key={c} className={`px-3 py-1.5 border border-gray-200 ${row[c]==="Out of Stock"||row[c]==="Below Reorder"?"text-red-600 font-medium":row[c]==="Adequate"?"text-green-600":""}`}>{String(row[c]??"—")}</td>)}
            </tr>
          ))}</tbody>
        </table>
        <p className="text-xs text-gray-400 mt-2">Showing {rows.length} records · Quantities only (no monetary values)</p>
      </div>
    );
  };

  const reportTypes = [
    { value:"daily-stock",  label:"Daily Stock Position",    icon:"📦" },
    { value:"grn",          label:"GRN Receipt Report",       icon:"🚚" },
    { value:"issuance",     label:"Issuance Report",          icon:"📤" },
    { value:"equipment",    label:"Equipment Register",       icon:"🔧" },
    { value:"verification", label:"Verification History",     icon:"✅" },
    { value:"dead-stock",   label:"Dead / Zero Stock Report", icon:"⚠️" },
    { value:"expiry",       label:"Expiry Tracker",           icon:"📅" },
    { value:"stock-movement","label":"Stock Movement",        icon:"📊" },
  ];

  const dateReports = ["grn","issuance","stock-movement"];
  const showDateRange = dateReports.includes(reportType);

  // Quick summary stats
  const belowReorder = INVENTORY.filter(i=>i.centralStock<=i.reorderLevel).length;
  const outOfStock   = INVENTORY.filter(i=>i.centralStock===0).length;
  const totalGRNs    = grns.length;
  const totalIssued  = issuances.reduce((s:number,i:any)=>s+(i.totalQty||0),0);

  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-gray-900">Store Reports</h2><p className="text-sm text-gray-500 mt-1">Quantity-only reports — no monetary values</p></div>

      {/* Quick KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:"Items Below Reorder", value:belowReorder, color:"text-orange-600", icon:<AlertTriangle className="w-4 h-4 text-orange-400"/> },
          { label:"Out of Stock",        value:outOfStock,   color:"text-red-600",    icon:<TrendingDown  className="w-4 h-4 text-red-400"/> },
          { label:"Total GRNs",          value:totalGRNs,    color:"text-blue-700",   icon:<TrendingUp    className="w-4 h-4 text-blue-400"/> },
          { label:"Total Units Issued",  value:totalIssued,  color:"text-purple-700", icon:<Package       className="w-4 h-4 text-purple-400"/> },
        ].map(k=>(
          <div key={k.label} className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between"><p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>{k.icon}</div>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Report Config */}
      <Card>
        <CardHeader><CardTitle className="text-base">Report Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Report Type</Label>
              <Select value={reportType} onValueChange={v=>{setReportType(v);setShowPreview(false);}}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  {reportTypes.map(r=><SelectItem key={r.value} value={r.value}>{r.icon} {r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {showDateRange && (<>
              <div className="space-y-1.5"><Label className="text-xs">From</Label><Input type="date" value={from} onChange={e=>{setFrom(e.target.value);setShowPreview(false);}}/></div>
              <div className="space-y-1.5"><Label className="text-xs">To</Label><Input type="date" value={to} onChange={e=>{setTo(e.target.value);setShowPreview(false);}}/></div>
            </>)}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePreview}><FileText className="w-4 h-4 mr-2"/>Preview</Button>
            <Button onClick={handleDownload}><Download className="w-4 h-4 mr-2"/>Download CSV</Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4"/>{reportTypes.find(r=>r.value===reportType)?.label} Preview</CardTitle></CardHeader>
          <CardContent>{renderPreview()}</CardContent>
        </Card>
      )}

      {/* Alert: items needing attention */}
      {(belowReorder > 0 || outOfStock > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader><div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-600"/><CardTitle className="text-sm text-orange-800">Items Needing Attention</CardTitle></div></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {INVENTORY.filter(i=>i.centralStock<=i.reorderLevel).map(i=>(
                <div key={i.itemId} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{i.itemName}</span>
                  <span className={i.centralStock===0?"text-red-600 font-semibold":"text-orange-700"}>{i.centralStock===0?"OUT OF STOCK":`${i.centralStock} ${i.unit} (reorder: ${i.reorderLevel})`}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
