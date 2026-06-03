import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BackButton } from "../ui/back-button";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  DollarSign,
  Users,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const marketingSummary = {
  totalSpend: 495000,
  customersAcquired: 795,
  averageCAC: 622,
  totalRevenue: 14725000,
  roi: 2875,
  conversionRate: 4.2,
};

const channelPerformance = [
  {
    id: "ch-1",
    channel: "Google Ads",
    spend: 145000,
    customers: 185,
    cac: 784,
    revenue: 3417500,
    roi: 2256,
    conversion: 3.2,
    status: "good",
  },
  {
    id: "ch-2",
    channel: "Meta Ads",
    spend: 125000,
    customers: 210,
    cac: 595,
    revenue: 3885000,
    roi: 3008,
    conversion: 4.5,
    status: "excellent",
  },
  {
    id: "ch-3",
    channel: "Offline Events",
    spend: 85000,
    customers: 95,
    cac: 895,
    revenue: 1757500,
    roi: 1968,
    conversion: 2.1,
    status: "average",
  },
  {
    id: "ch-4",
    channel: "Referral Program",
    spend: 45000,
    customers: 180,
    cac: 250,
    revenue: 3330000,
    roi: 7300,
    conversion: 12.5,
    status: "excellent",
  },
  {
    id: "ch-5",
    channel: "Influencer Marketing",
    spend: 95000,
    customers: 125,
    cac: 760,
    revenue: 2312500,
    roi: 2334,
    conversion: 3.8,
    status: "good",
  },
];

const monthlyMarketingTrend = [
  { id: "m1", month: "Jan", spend: 385000, customers: 650, cac: 592 },
  { id: "m2", month: "Feb", spend: 412000, customers: 695, cac: 593 },
  { id: "m3", month: "Mar", spend: 445000, customers: 725, cac: 614 },
  { id: "m4", month: "Apr", spend: 458000, customers: 745, cac: 615 },
  { id: "m5", month: "May", spend: 475000, customers: 775, cac: 613 },
  { id: "m6", month: "Jun", spend: 495000, customers: 795, cac: 622 },
];

const campaignPerformance = [
  { id: "camp-1", campaign: "Summer Subscription Sale", channel: "Meta Ads", spend: 45000, customers: 85, revenue: 1572500, roi: 3394 },
  { id: "camp-2", campaign: "Referral Bonus Program", channel: "Referral", spend: 25000, customers: 95, revenue: 1757500, roi: 6930 },
  { id: "camp-3", campaign: "Google Search - Car Wash", channel: "Google Ads", spend: 65000, customers: 78, revenue: 1443000, roi: 2120 },
  { id: "camp-4", campaign: "Corporate Outreach", channel: "Offline", spend: 55000, customers: 45, revenue: 832500, roi: 1414 },
  { id: "camp-5", campaign: "Instagram Influencer", channel: "Influencer", spend: 48000, customers: 62, revenue: 1147000, roi: 2290 },
];

const channelROIComparison = [
  { id: "roi-1", channel: "Referral", roi: 7300, cac: 250, ltv: 18500 },
  { id: "roi-2", channel: "Meta Ads", roi: 3008, cac: 595, ltv: 18500 },
  { id: "roi-3", channel: "Influencer", roi: 2334, cac: 760, ltv: 18500 },
  { id: "roi-4", channel: "Google Ads", roi: 2256, cac: 784, ltv: 18500 },
  { id: "roi-5", channel: "Offline", roi: 1968, cac: 895, ltv: 18500 },
];

const channelRadarData = [
  { subject: "ROI", "Meta Ads": 85, "Google Ads": 65, Referral: 95, Influencer: 70, Offline: 55 },
  { subject: "Conversion", "Meta Ads": 90, "Google Ads": 65, Referral: 100, Influencer: 75, Offline: 50 },
  { subject: "Cost Efficiency", "Meta Ads": 80, "Google Ads": 60, Referral: 100, Influencer: 70, Offline: 50 },
  { subject: "Scale", "Meta Ads": 85, "Google Ads": 75, Referral: 70, Influencer: 60, Offline: 45 },
  { subject: "Quality", "Meta Ads": 80, "Google Ads": 75, Referral: 95, Influencer: 75, Offline: 70 },
];

function MarketingROIDrilldown() {
  const { currentRole } = useRole();

  const hasAccess = currentRole === "Super Admin" || currentRole === "Admin";

  if (!hasAccess) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 text-lg font-semibold">Access Denied</div>
            <p className="text-gray-500 mt-2">
              You don't have permission to access Marketing ROI Drilldown.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing ROI Drilldown</h1>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive analysis of marketing effectiveness and channel performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            This Month
          </Button>
          <Button size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Total Marketing Spend</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  ₹{(marketingSummary.totalSpend / 100000).toFixed(1)}L
                </div>
                <div className="text-xs text-gray-600 mt-2">This month</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Customers Acquired</div>
                <div className="text-3xl font-bold text-blue-600 mt-2">
                  {marketingSummary.customersAcquired}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">+12.5%</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Average CAC</div>
                <div className="text-3xl font-bold text-purple-600 mt-2">
                  ₹{marketingSummary.averageCAC}
                </div>
                <div className="text-xs text-gray-600 mt-2">Per customer</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500">Marketing ROI</div>
                <div className="text-3xl font-bold text-green-600 mt-2">
                  {(marketingSummary.roi / 100).toFixed(1)}x
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <Badge className="bg-green-500 text-xs">Excellent</Badge>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Channel Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Channel</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Spend</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Customers</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">CAC</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Revenue</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">ROI</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Conversion</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Performance</th>
                </tr>
              </thead>
              <tbody>
                {channelPerformance.map((channel) => (
                  <tr key={channel.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{channel.channel}</td>
                    <td className="p-3 text-right">₹{(channel.spend / 1000).toFixed(0)}K</td>
                    <td className="p-3 text-right">{channel.customers}</td>
                    <td className="p-3 text-right">₹{channel.cac}</td>
                    <td className="p-3 text-right font-medium">₹{(channel.revenue / 100000).toFixed(1)}L</td>
                    <td className="p-3 text-right font-bold text-green-600">{(channel.roi / 100).toFixed(1)}x</td>
                    <td className="p-3 text-right">{channel.conversion}%</td>
                    <td className="p-3 text-center">
                      {channel.status === "excellent" && <Badge className="bg-green-500">Excellent</Badge>}
                      {channel.status === "good" && <Badge className="bg-blue-500">Good</Badge>}
                      {channel.status === "average" && <Badge className="bg-orange-500">Average</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Marketing Spend & CAC Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly CAC Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyMarketingTrend} id="cac-trend-chart">
                <CartesianGrid key="cac-grid" strokeDasharray="3 3" />
                <XAxis key="cac-xaxis" dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis key="cac-yaxis" tick={{ fontSize: 11 }} width={50} />
                <RechartsTooltip key="cac-tooltip" />
                <Legend key="cac-legend" />
                <Line
                  key="cac-line"
                  type="monotone"
                  dataKey="cac"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="CAC (₹)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Channel ROI Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Channel ROI Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={channelROIComparison} id="roi-comparison-chart">
                <CartesianGrid key="roi-grid" strokeDasharray="3 3" />
                <XAxis key="roi-xaxis" dataKey="channel" tick={{ fontSize: 11 }} />
                <YAxis key="roi-yaxis" tick={{ fontSize: 11 }} width={50} />
                <RechartsTooltip key="roi-tooltip" />
                <Bar key="roi-bar" dataKey="roi" fill="#10b981" name="ROI (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Top Campaigns Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Campaign</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Channel</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Spend</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Customers</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">Revenue</th>
                  <th className="text-right p-3 text-sm font-semibold text-gray-700">ROI</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {campaignPerformance.map((campaign) => (
                  <tr key={campaign.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{campaign.campaign}</td>
                    <td className="p-3">
                      <Badge variant="outline">{campaign.channel}</Badge>
                    </td>
                    <td className="p-3 text-right">₹{(campaign.spend / 1000).toFixed(0)}K</td>
                    <td className="p-3 text-right">{campaign.customers}</td>
                    <td className="p-3 text-right font-medium">₹{(campaign.revenue / 100000).toFixed(1)}L</td>
                    <td className="p-3 text-right font-bold text-green-600">{(campaign.roi / 100).toFixed(1)}x</td>
                    <td className="p-3 text-center">
                      {campaign.roi > 5000 ? (
                        <Badge className="bg-green-500">Outstanding</Badge>
                      ) : campaign.roi > 2000 ? (
                        <Badge className="bg-blue-500">Good</Badge>
                      ) : (
                        <Badge className="bg-orange-500">Average</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Channel Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Dimensional Channel Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={channelRadarData} id="channel-radar-chart">
              <PolarGrid key="radar-grid" />
              <PolarAngleAxis key="radar-angle" dataKey="subject" />
              <PolarRadiusAxis key="radar-radius" />
              <Radar key="radar-meta" name="Meta Ads" dataKey="Meta Ads" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              <Radar key="radar-google" name="Google Ads" dataKey="Google Ads" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              <Radar key="radar-referral" name="Referral" dataKey="Referral" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
              <Legend key="radar-legend" />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights & Recommendations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="text-sm font-semibold text-green-700">Top Performer</div>
            <div className="text-lg font-bold text-gray-900 mt-1">Referral Program</div>
            <div className="text-xs text-gray-600 mt-2">
              73x ROI • ₹250 CAC • 12.5% conversion
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="text-sm font-semibold text-blue-700">Recommendation</div>
            <div className="text-lg font-bold text-gray-900 mt-1">Scale Meta Ads</div>
            <div className="text-xs text-gray-600 mt-2">
              High conversion (4.5%) with good ROI potential
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="text-sm font-semibold text-orange-700">Optimization</div>
            <div className="text-lg font-bold text-gray-900 mt-1">Review Offline Events</div>
            <div className="text-xs text-gray-600 mt-2">
              Highest CAC (₹895) with lowest conversion (2.1%)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MarketingROIDrilldown;
