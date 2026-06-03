// Holiday Management - Public Holidays with Past Date Lock
import { DataService } from "../../services/DataService";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { BackButton } from "../ui/back-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Holiday {
  id: string;
  name: string;
  date: string;
  day: string;
  type: "National" | "Regional" | "Optional";
  applicableLocation: string[];
}

const mockHolidays: Holiday[] = [
  {
    id: "HOL-001",
    name: "Republic Day",
    date: "2025-01-26",
    day: "Sunday",
    type: "National",
    applicableLocation: ["All Locations"],
  },
  {
    id: "HOL-002",
    name: "Holi",
    date: "2025-03-14",
    day: "Friday",
    type: "National",
    applicableLocation: ["All Locations"],
  },
  {
    id: "HOL-003",
    name: "Good Friday",
    date: "2025-04-18",
    day: "Friday",
    type: "National",
    applicableLocation: ["All Locations"],
  },
  {
    id: "HOL-004",
    name: "Dr. Ambedkar Jayanti",
    date: "2025-04-14",
    day: "Monday",
    type: "National",
    applicableLocation: ["All Locations"],
  },
  {
    id: "HOL-005",
    name: "Labour Day",
    date: "2025-05-01",
    day: "Thursday",
    type: "National",
    applicableLocation: ["All Locations"],
  },
  {
    id: "HOL-006",
    name: "Independence Day",
    date: "2025-08-15",
    day: "Friday",
    type: "National",
    applicableLocation: ["All Locations"],
  },
  {
    id: "HOL-007",
    name: "Ganesh Chaturthi",
    date: "2025-08-27",
    day: "Wednesday",
    type: "Regional",
    applicableLocation: ["Maharashtra", "Gujarat"],
  },
  {
    id: "HOL-008",
    name: "Gandhi Jayanti",
    date: "2025-10-02",
    day: "Thursday",
    type: "National",
    applicableLocation: ["All Locations"],
  },
  {
    id: "HOL-009",
    name: "Navratri (Day 1)",
    date: "2025-09-22",
    day: "Monday",
    type: "Regional",
    applicableLocation: ["Gujarat"],
  },
  {
    id: "HOL-010",
    name: "Dussehra",
    date: "2025-10-02",
    day: "Thursday",
    type: "National",
    applicableLocation: ["All Locations"],
  },
  {
    id: "HOL-011",
    name: "Diwali",
    date: "2025-10-20",
    day: "Monday",
    type: "National",
    applicableLocation: ["All Locations"],
  },
  {
    id: "HOL-012",
    name: "Christmas",
    date: "2025-12-25",
    day: "Thursday",
    type: "National",
    applicableLocation: ["All Locations"],
  },
  // 2026 Holidays
  {
    id: "HOL-013",
    name: "Republic Day",
    date: "2026-01-26",
    day: "Monday",
    type: "National",
    applicableLocation: ["All Locations"],
  },
  {
    id: "HOL-014",
    name: "Holi",
    date: "2026-03-05",
    day: "Thursday",
    type: "National",
    applicableLocation: ["All Locations"],
  },
  {
    id: "HOL-015",
    name: "Good Friday",
    date: "2026-04-03",
    day: "Friday",
    type: "National",
    applicableLocation: ["All Locations"],
  },
  {
    id: "HOL-016",
    name: "Independence Day",
    date: "2026-08-15",
    day: "Saturday",
    type: "National",
    applicableLocation: ["All Locations"],
  },
];

export function HolidayManagement() {
  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    const stored = DataService.get<Holiday>("PUBLIC_HOLIDAYS");
    return stored.length > 0 ? stored : (typeof mockHolidays !== "undefined" ? mockHolidays : []);
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState<Partial<Holiday>>({
    type: "National",
    applicableLocation: ["All Locations"],
  });

  const today = new Date().toISOString().split("T")[0];

  const isPastDate = (date: string) => {
    return date < today;
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { weekday: "long" });
  };

  const handleAddHoliday = () => {
    if (!formData.name || !formData.date) {
      toast.error("Please fill all required fields");
      return;
    }

    const newHoliday: Holiday = {
      id: `HOL-${String(holidays.length + 1).padStart(3, "0")}`,
      name: formData.name!,
      date: formData.date!,
      day: getDayName(formData.date!),
      type: formData.type as Holiday["type"],
      applicableLocation: formData.applicableLocation || ["All Locations"],
    };

    setHolidays((prev) => {
    const next = [...prev, newHoliday];
    localStorage.setItem("cleancar_holidays", JSON.stringify(next));
    return next;
  });
    setShowAddModal(false);
    setFormData({ type: "National", applicableLocation: ["All Locations"] });
    toast.success("Holiday added successfully");
  };

  const handleEditHoliday = (holiday: Holiday) => {
    if (isPastDate(holiday.date)) {
      // Should not happen as button is disabled, but extra safety
      return;
    }
    setEditingHoliday(holiday);
    setFormData(holiday);
  };

  const handleUpdateHoliday = () => {
    if (!editingHoliday) return;

    const updated = holidays.map((h) =>
      h.id === editingHoliday.id
        ? {
            ...h,
            ...formData,
            day: formData.date ? getDayName(formData.date) : h.day,
          }
        : h
    );

    setHolidays(updated);
    setEditingHoliday(null);
    setFormData({ type: "National", applicableLocation: ["All Locations"] });
    toast.success("Holiday updated successfully");
  };

  const handleDeleteHoliday = (holiday: Holiday) => {
    if (isPastDate(holiday.date)) {
      // Should not happen as button is disabled
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${holiday.name}?`
    );
    if (confirmed) {
      const remaining = holidays.filter((h) => h.id !== holiday.id);
      setHolidays(remaining);
      DataService.setAll("PUBLIC_HOLIDAYS", remaining);
      toast.success("Holiday deleted successfully");
    }
  };

  return (
    <div className="space-y-6">
      <BackButton to="/hr" label="Back to HR Dashboard" />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Holiday Management</h2>
          <p className="text-gray-600">
            Manage public holidays and leave calendar
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Holiday
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Holiday Calendar (2025-2026)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Past Date Lock</p>
                <p className="text-blue-700">
                  Holidays with dates in the past cannot be edited or deleted.
                  These are displayed in gray with disabled action buttons.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="min-w-[700px] sm:min-w-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Holiday Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Applicable Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
            <TableBody>
              {holidays.map((holiday) => {
                const isPast = isPastDate(holiday.date);
                return (
                  <TableRow
                    key={holiday.id}
                    className={isPast ? "opacity-50" : ""}
                  >
                    <TableCell className="font-medium">
                      {holiday.name}
                    </TableCell>
                    <TableCell>
                      {new Date(holiday.date).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell>{holiday.day}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          holiday.type === "National"
                            ? "default"
                            : holiday.type === "Regional"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {holiday.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {holiday.applicableLocation.join(", ")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditHoliday(holiday)}
                          disabled={isPast}
                          className={
                            isPast ? "cursor-not-allowed opacity-50" : ""
                          }
                          title={
                            isPast
                              ? "Past holidays cannot be edited"
                              : "Edit holiday"
                          }
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteHoliday(holiday)}
                          disabled={isPast}
                          className={
                            isPast ? "cursor-not-allowed opacity-50" : ""
                          }
                          title={
                            isPast
                              ? "Past holidays cannot be deleted"
                              : "Delete holiday"
                          }
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Holiday Modal */}
      {(showAddModal || editingHoliday) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">
                {editingHoliday ? "Edit Holiday" : "Add New Holiday"}
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingHoliday(null);
                  setFormData({
                    type: "National",
                    applicableLocation: ["All Locations"],
                  });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div>
                <Label>Holiday Name *</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Independence Day"
                />
              </div>

              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      type: value as Holiday["type"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="National">National</SelectItem>
                    <SelectItem value="Regional">Regional</SelectItem>
                    <SelectItem value="Optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Applicable Locations</Label>
                <Input
                  value={formData.applicableLocation?.join(", ") || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      applicableLocation: e.target.value
                        .split(",")
                        .map((l) => l.trim()),
                    })
                  }
                  placeholder="e.g., All Locations or Gujarat, Maharashtra"
                />
              </div>
            </div>

            <div className="border-t px-6 py-4 flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingHoliday(null);
                  setFormData({
                    type: "National",
                    applicableLocation: ["All Locations"],
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={editingHoliday ? handleUpdateHoliday : handleAddHoliday}
              >
                <Save className="w-4 h-4 mr-2" />
                {editingHoliday ? "Update" : "Add"} Holiday
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
