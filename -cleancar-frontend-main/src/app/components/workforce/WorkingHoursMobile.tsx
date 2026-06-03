import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import {
  Clock,
  User,
  Edit,
  History,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";

export function WorkingHoursMobile() {
  const dbEmps = employeeDatabaseService.getAll();
  const [selectedEmployee, setSelectedEmployee] = useState("1");
  const [showEditSheet, setShowEditSheet] = useState(false);

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Working Hours</h1>
        <p className="text-xs text-gray-500 mt-1">Shift Configuration</p>
      </div>

      {/* System Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Audit Enabled
        </Badge>
      </div>

      {/* Employee Selector */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-sm">Select Employee</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dbEmps.map(e => (
                <SelectItem key={e.employeeId} value={e.employeeId}>
                  {e.firstName} {e.lastName} - {e.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Role Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="font-medium">Washer - Part Time</span>
            </div>
            <Badge className="text-xs">Auto-filled</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Shift Card */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="p-4 bg-blue-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Current Shift</CardTitle>
            <Badge className="bg-blue-600 text-xs">4 Hour Band</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-semibold">05:00 – 09:00</span>
            </div>
            <div className="text-sm text-blue-700">Unit Base: 25 Units</div>
            <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
              Incentive only within band
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Button */}
      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetTrigger asChild>
          <Button className="w-full">
            <Edit className="w-4 h-4 mr-2" />
            Edit Shift
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader>
            <SheetTitle>Edit Shift</SheetTitle>
            <SheetDescription>Update working hours for this employee</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" defaultValue="09:00" />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" defaultValue="17:00" />
            </div>
            <div className="space-y-2">
              <Label>Change Reason</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee-request">Employee Request</SelectItem>
                  <SelectItem value="coverage">Coverage Adjustment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Effective Date</Label>
              <Input type="date" />
            </div>

            <Button className="w-full">Save Changes</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* History Accordion */}
      <Accordion type="single" collapsible>
        <AccordionItem value="history">
          <AccordionTrigger className="text-sm">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Shift History
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {[
                {
                  date: "Jan 15, 2026",
                  old: "05:00 - 09:00",
                  new: "06:00 - 10:00",
                  status: "Applied",
                },
                {
                  date: "Jan 18, 2026",
                  old: "09:00 - 17:00",
                  new: "10:00 - 18:00",
                  status: "Approved",
                },
              ].map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="text-xs text-gray-600 mb-2">{item.date}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {item.old}
                      </Badge>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {item.new}
                      </Badge>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        item.status === "Applied"
                          ? "bg-green-100 text-green-700 border-green-200 mt-2 text-xs"
                          : "bg-blue-100 text-blue-700 border-blue-200 mt-2 text-xs"
                      }
                    >
                      {item.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
