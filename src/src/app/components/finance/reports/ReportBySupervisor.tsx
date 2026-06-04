/**
 * Report By Supervisor
 * Supervisor team cost performance tracking
 * Last Updated: 2026-03-17
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { ReportPreviewModal } from "../ReportPreviewModal";

interface SupervisorData {
  id: string;
  name: string;
  assignedPINCodes: string[];
  washersManaged: number;
  totalWashes: number;
  avgActualCost: number;
  avgStandardCost: number;
  teamVariance: number;
  escalationsCount: number;
  avgQualityScore: number;
  packagesCovered: string[];
  washerBreakdown: {
    washerName: string;
    washes: number;
    actualCost: number;
    standardCost: number;
    variance: number;
    qualityScore: number;
  }[];
}

interface ReportBySupervisorProps {
  period: string;
}

export function ReportBySupervisor({ period }: ReportBySupervisorProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);

  const supervisorData: SupervisorData[] = [
    {
      id: "SUP-001",
      name: "Ramakrishnan Iyer",
      assignedPINCodes: ["560034", "560038", "560102"],
      washersManaged: 8,
      totalWashes: 785,
      avgActualCost: 91.5,
      avgStandardCost: 89.5,
      teamVariance: 2.0,
      escalationsCount: 3,
      avgQualityScore: 4.6,
      packagesCovered: ["Basic", "Premium", "Elite", "Interior"],
      washerBreakdown: [
        {
          washerName: "Rajesh Kumar",
          washes: 245,
          actualCost: 93.1,
          standardCost: 89.5,
          variance: 3.6,
          qualityScore: 4.6,
        },
        {
          washerName: "Suresh Yadav",
          washes: 198,
          actualCost: 89.3,
          standardCost: 89.5,
          variance: -0.2,
          qualityScore: 4.8,
        },
        {
          washerName: "Vijay Sharma",
          washes: 165,
          actualCost: 91.1,
          standardCost: 89.5,
          variance: 1.6,
          qualityScore: 4.7,
        },
        {
          washerName: "Anil Verma",
          washes: 152,
          actualCost: 90.1,
          standardCost: 89.5,
          variance: 0.6,
          qualityScore: 4.5,
        },
        {
          washerName: "Prakash Reddy",
          washes: 25,
          actualCost: 92.3,
          standardCost: 89.5,
          variance: 2.8,
          qualityScore: 4.4,
        },
      ],
    },
    {
      id: "SUP-002",
      name: "Sanjay Mehta",
      assignedPINCodes: ["560066", "560078"],
      washersManaged: 5,
      totalWashes: 542,
      avgActualCost: 94.2,
      avgStandardCost: 89.5,
      teamVariance: 4.7,
      escalationsCount: 7,
      avgQualityScore: 4.3,
      packagesCovered: ["Elite", "Elite Plus", "Premium"],
      washerBreakdown: [
        {
          washerName: "Ramesh Singh",
          washes: 187,
          actualCost: 96.3,
          standardCost: 89.5,
          variance: 6.8,
          qualityScore: 4.3,
        },
        {
          washerName: "Kumar Swamy",
          washes: 145,
          actualCost: 93.8,
          standardCost: 89.5,
          variance: 4.3,
          qualityScore: 4.4,
        },
        {
          washerName: "Dinesh Patil",
          washes: 125,
          actualCost: 92.5,
          standardCost: 89.5,
          variance: 3.0,
          qualityScore: 4.2,
        },
        {
          washerName: "Mohan Das",
          washes: 85,
          actualCost: 94.1,
          standardCost: 89.5,
          variance: 4.6,
          qualityScore: 4.3,
        },
      ],
    },
    {
      id: "SUP-003",
      name: "Venkatesh Naidu",
      assignedPINCodes: ["560095", "560100"],
      washersManaged: 6,
      totalWashes: 623,
      avgActualCost: 88.9,
      avgStandardCost: 89.5,
      teamVariance: -0.6,
      escalationsCount: 2,
      avgQualityScore: 4.7,
      packagesCovered: ["Basic", "Premium", "Elite"],
      washerBreakdown: [
        {
          washerName: "Santosh Kumar",
          washes: 178,
          actualCost: 87.5,
          standardCost: 89.5,
          variance: -2.0,
          qualityScore: 4.8,
        },
        {
          washerName: "Ravi Shankar",
          washes: 165,
          actualCost: 88.2,
          standardCost: 89.5,
          variance: -1.3,
          qualityScore: 4.7,
        },
        {
          washerName: "Ashok Reddy",
          washes: 148,
          actualCost: 89.8,
          standardCost: 89.5,
          variance: 0.3,
          qualityScore: 4.6,
        },
        {
          washerName: "Ganesh Babu",
          washes: 132,
          actualCost: 90.1,
          standardCost: 89.5,
          variance: 0.6,
          qualityScore: 4.7,
        },
      ],
    },
  ];

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <>
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Report by Supervisor
            </div>
            <Button
              onClick={() => setShowPreview(true)}
              variant="outline"
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Supervisor Name</TableHead>
                  <TableHead>Assigned PIN Codes</TableHead>
                  <TableHead className="text-right">Washers Managed</TableHead>
                  <TableHead className="text-right">Total Washes</TableHead>
                  <TableHead className="text-right">Avg Actual Cost</TableHead>
                  <TableHead className="text-right">Avg Standard Cost</TableHead>
                  <TableHead className="text-right">Team Variance</TableHead>
                  <TableHead className="text-right">Escalations</TableHead>
                  <TableHead className="text-right">Avg Quality Score</TableHead>
                  <TableHead>Packages Covered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supervisorData.map((supervisor) => (
                  <>
                    <TableRow key={supervisor.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(supervisor.id)}
                        >
                          {expandedRows.has(supervisor.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {supervisor.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {supervisor.assignedPINCodes.map((code) => (
                            <Badge
                              key={code}
                              variant="outline"
                              className="text-xs"
                            >
                              {code}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        {supervisor.washersManaged}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {supervisor.totalWashes}
                      </TableCell>
                      <TableCell className="text-right font-medium text-orange-600">
                        ₹{supervisor.avgActualCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        ₹{supervisor.avgStandardCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className={`flex items-center justify-end gap-1 font-medium ${
                            supervisor.teamVariance > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {supervisor.teamVariance > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {supervisor.teamVariance > 0 ? "+" : ""}₹
                          {supervisor.teamVariance.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={
                            supervisor.escalationsCount > 5
                              ? "bg-red-100 text-red-800"
                              : supervisor.escalationsCount > 2
                              ? "bg-amber-100 text-amber-800"
                              : "bg-green-100 text-green-800"
                          }
                        >
                          {supervisor.escalationsCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={
                            supervisor.avgQualityScore >= 4.5
                              ? "bg-green-100 text-green-800"
                              : supervisor.avgQualityScore >= 4.0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {supervisor.avgQualityScore.toFixed(1)} ⭐
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {supervisor.packagesCovered.map((pkg) => (
                            <Badge
                              key={pkg}
                              className="bg-purple-100 text-purple-800 text-xs"
                            >
                              {pkg}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Washer Breakdown */}
                    {expandedRows.has(supervisor.id) && (
                      <TableRow>
                        <TableCell colSpan={11} className="bg-green-50">
                          <div className="p-4">
                            <h4 className="font-medium text-sm mb-3">
                              Washer Breakdown for {supervisor.name}'s Team
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Washer Name</TableHead>
                                  <TableHead className="text-right">Washes</TableHead>
                                  <TableHead className="text-right">
                                    Actual Cost/Wash
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Standard Cost/Wash
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Variance
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Quality Score
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {supervisor.washerBreakdown.map((washer, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="font-medium">
                                      {washer.washerName}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {washer.washes}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-orange-600">
                                      ₹{washer.actualCost.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right text-gray-600">
                                      ₹{washer.standardCost.toFixed(2)}
                                    </TableCell>
                                    <TableCell
                                      className={`text-right font-medium ${
                                        washer.variance > 0
                                          ? "text-red-600"
                                          : "text-green-600"
                                      }`}
                                    >
                                      {washer.variance > 0 ? "+" : ""}₹
                                      {washer.variance.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {washer.qualityScore.toFixed(1)} ⭐
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <div className="text-xs text-blue-600 mb-1">
                  Total Supervisors
                </div>
                <div className="text-xl font-bold text-blue-900">
                  {supervisorData.length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3">
                <div className="text-xs text-green-600 mb-1">Total Washes</div>
                <div className="text-xl font-bold text-green-900">
                  {supervisorData.reduce((sum, s) => sum + s.totalWashes, 0)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-3">
                <div className="text-xs text-orange-600 mb-1">
                  Avg Team Variance
                </div>
                <div className="text-xl font-bold text-orange-900">
                  ₹
                  {(
                    supervisorData.reduce((sum, s) => sum + s.teamVariance, 0) /
                    supervisorData.length
                  ).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-3">
                <div className="text-xs text-red-600 mb-1">
                  Total Escalations
                </div>
                <div className="text-xl font-bold text-red-900">
                  {supervisorData.reduce((sum, s) => sum + s.escalationsCount, 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <ReportPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        reportTitle="Cost Report by Supervisor"
        period={period}
        filters={{}}
        data={supervisorData}
        columns={[
          { key: "name", label: "Supervisor Name" },
          { key: "washersManaged", label: "Washers Managed" },
          { key: "totalWashes", label: "Total Washes" },
          { key: "avgActualCost", label: "Avg Actual Cost", format: "currency" },
          { key: "teamVariance", label: "Team Variance", format: "currency" },
          { key: "escalationsCount", label: "Escalations" },
          { key: "avgQualityScore", label: "Avg Quality Score" },
        ]}
      />
    </>
  );
}
