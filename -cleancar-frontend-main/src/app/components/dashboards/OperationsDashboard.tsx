// Dashboard for Operations Manager role
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Award, Users, AlertCircle, TrendingUp, Calculator, ArrowRight, Lightbulb, DollarSign, Package } from "lucide-react";
import { MASTER_KPI_DATA, MASTER_COMPLAINTS } from "../../data/masterData";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useCity } from "../../contexts/CityContext";
import { useJobs } from "../../contexts/JobContext";
import { useMemo } from "react";

export function OperationsDashboard() {
  const { city } = useCity();
  const { getJobsByCityId } = useJobs();

  // City-filtered data
  const cityJobs = useMemo(() => getJobsByCityId(city), [city, getJobsByCityId]);
  const activeComplaints = useMemo(() =>
    MASTER_COMPLAINTS.filter(c => c.status !== "Closed" && c.status !== "Resolved" && (c.cityId === city || !c.cityId)),
    [city]
  );

  // Calculate operational metrics from real data
  const totalClusters = MASTER_KPI_DATA.activeSupervisors; // 4 supervisors = 4 clusters
  const avgQualityScore = MASTER_KPI_DATA.customerSatisfaction; // 4.7/5 = 9.4/10
  const npsScore = Math.round((MASTER_KPI_DATA.customerSatisfaction - 3) / 2 * 100); // Convert 4.7/5 to NPS ~85

  const handleApproveAudit = () => {
    toast.success("Audit approved successfully");
  };

  const handleReviewComplaint = (complaintId: string) => {
    toast.info(`Reviewing complaint ${complaintId}...`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Operations Command Center</h2>
        <p className="text-sm text-gray-500 mt-1">Monitor clusters and approve operations</p>
      </div>

      {/* Cost Per Wash Intelligence Quick Access */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 border-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg shadow-lg">
                <Calculator className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">Cost Per Wash Intelligence</h3>
                  <Badge className="bg-emerald-600 text-white">Recommendations Available</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  4 high-priority recommendations • Potential monthly savings: ₹75,055
                </p>
              </div>
            </div>
            <Link to="/finance/cost-per-wash">
              <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg">
                View Recommendations
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          {/* Quick Access Grid */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <Link to="/finance/cost-per-wash" className="group">
              <div className="p-3 bg-white rounded-lg border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer">
                <Package className="w-5 h-5 text-emerald-600 mb-2" />
                <div className="text-xs font-semibold text-gray-900">Tracking Reports</div>
                <div className="text-xs text-gray-500">Washer/Zone Analysis</div>
              </div>
            </Link>
            <Link to="/finance/cost-per-wash" className="group">
              <div className="p-3 bg-white rounded-lg border border-teal-200 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer">
                <TrendingUp className="w-5 h-5 text-teal-600 mb-2" />
                <div className="text-xs font-semibold text-gray-900">Cost Trends</div>
                <div className="text-xs text-gray-500">Performance Over Time</div>
              </div>
            </Link>
            <Link to="/finance/cost-per-wash" className="group">
              <div className="p-3 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border-2 border-amber-300 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer">
                <Lightbulb className="w-5 h-5 text-amber-600 mb-2" />
                <div className="text-xs font-semibold text-gray-900">AI Recommendations</div>
                <div className="text-xs text-amber-600 font-bold">⭐ 4 Active</div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{totalClusters}</p>
              <p className="text-xs text-gray-500">Clusters</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="bg-orange-50 text-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{activeComplaints.length}</p>
              <p className="text-xs text-gray-500">Active Complaints</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="bg-green-50 text-green-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Award className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{avgQualityScore}</p>
              <p className="text-xs text-gray-500">Avg Quality</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="bg-purple-50 text-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{npsScore}</p>
              <p className="text-xs text-gray-500">NPS Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Audits */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Pending Audit Approvals</h3>
          <div className="space-y-3">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">Site Quality Check - Bandra Cluster</p>
                  <p className="text-sm text-gray-600">Suresh Yadav • Score: 8.5/10</p>
                </div>
                <Button size="sm" onClick={handleApproveAudit}>Approve</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Complaints */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Critical Complaints</h3>
          <div className="space-y-3">
            {activeComplaints.filter(c => c.severity === "Critical").map((complaint) => (
              <div key={complaint.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{complaint.id}</p>
                      <Badge variant="destructive">{complaint.severity}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{complaint.description}</p>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => handleReviewComplaint(complaint.id)}>Review</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}