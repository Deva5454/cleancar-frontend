/**
 * WASHER ATTENDANCE HISTORY
 * Shows attendance records, check-in/check-out times, and monthly summary
 */

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AttendanceRecord {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "present" | "absent" | "leave" | "half-day";
  location?: string;
  totalHours?: number;
  leaveType?: string;
}

export function WasherAttendanceHistory() {
  const navigate = useNavigate();

  const currentMonth = {
    month: "April 2026",
    totalDays: 14, // Days elapsed
    present: 13,
    absent: 0,
    leave: 1,
    attendancePercentage: 92.9,
  };

  const attendanceRecords: AttendanceRecord[] = [
    {
      date: "2026-04-14",
      checkIn: "08:02 AM",
      checkOut: "06:45 PM",
      status: "present",
      location: "Adajan, Surat",
      totalHours: 10.7,
    },
    {
      date: "2026-04-13",
      checkIn: "08:15 AM",
      checkOut: "07:02 PM",
      status: "present",
      location: "Adajan, Surat",
      totalHours: 10.8,
    },
    {
      date: "2026-04-12",
      checkIn: "08:05 AM",
      checkOut: "06:30 PM",
      status: "present",
      location: "Adajan, Surat",
      totalHours: 10.4,
    },
    {
      date: "2026-04-11",
      checkIn: "08:10 AM",
      checkOut: "06:50 PM",
      status: "present",
      location: "Vesu, Surat",
      totalHours: 10.7,
    },
    {
      date: "2026-04-10",
      checkIn: null,
      checkOut: null,
      status: "leave",
      leaveType: "Casual Leave",
    },
    {
      date: "2026-04-09",
      checkIn: "08:00 AM",
      checkOut: "06:40 PM",
      status: "present",
      location: "Adajan, Surat",
      totalHours: 10.7,
    },
    {
      date: "2026-04-08",
      checkIn: "08:12 AM",
      checkOut: "06:55 PM",
      status: "present",
      location: "Adajan, Surat",
      totalHours: 10.7,
    },
    {
      date: "2026-04-07",
      checkIn: "08:08 AM",
      checkOut: "07:10 PM",
      status: "present",
      location: "Vesu, Surat",
      totalHours: 11.0,
    },
    {
      date: "2026-04-06",
      checkIn: "08:05 AM",
      checkOut: "06:35 PM",
      status: "present",
      location: "Adajan, Surat",
      totalHours: 10.5,
    },
    {
      date: "2026-04-05",
      checkIn: "08:18 AM",
      checkOut: "06:48 PM",
      status: "present",
      location: "Adajan, Surat",
      totalHours: 10.5,
    },
    {
      date: "2026-04-04",
      checkIn: "08:03 AM",
      checkOut: "06:42 PM",
      status: "present",
      location: "Adajan, Surat",
      totalHours: 10.6,
    },
    {
      date: "2026-04-03",
      checkIn: "08:07 AM",
      checkOut: "06:52 PM",
      status: "present",
      location: "Vesu, Surat",
      totalHours: 10.8,
    },
    {
      date: "2026-04-02",
      checkIn: "08:11 AM",
      checkOut: "06:38 PM",
      status: "present",
      location: "Adajan, Surat",
      totalHours: 10.4,
    },
    {
      date: "2026-04-01",
      checkIn: "08:06 AM",
      checkOut: "06:47 PM",
      status: "present",
      location: "Adajan, Surat",
      totalHours: 10.7,
    },
  ];

  const getStatusBadge = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Present
          </Badge>
        );
      case "absent":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Absent
          </Badge>
        );
      case "leave":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Calendar className="w-3 h-3 mr-1" />
            Leave
          </Badge>
        );
      case "half-day":
        return (
          <Badge className="bg-amber-100 text-amber-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Half Day
          </Badge>
        );
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
            <p className="text-sm text-gray-500 mt-1">{currentMonth.month}</p>
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{currentMonth.totalDays}</p>
              <p className="text-xs text-gray-500 mt-1">Total Days</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{currentMonth.present}</p>
              <p className="text-xs text-gray-500 mt-1">Present</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{currentMonth.absent}</p>
              <p className="text-xs text-gray-500 mt-1">Absent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{currentMonth.leave}</p>
              <p className="text-xs text-gray-500 mt-1">Leave</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-600">
                {currentMonth.attendancePercentage.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Attendance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendanceRecords.map((record, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    {getStatusBadge(record.status)}
                  </div>

                  {record.status === "present" && (
                    <div className="ml-7 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          {record.checkIn} - {record.checkOut}
                        </span>
                        {record.totalHours && (
                          <span className="text-teal-600 font-medium">
                            ({record.totalHours.toFixed(1)}h)
                          </span>
                        )}
                      </div>
                      {record.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{record.location}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {record.status === "leave" && record.leaveType && (
                    <div className="ml-7 text-sm text-gray-600">
                      <p>{record.leaveType}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
