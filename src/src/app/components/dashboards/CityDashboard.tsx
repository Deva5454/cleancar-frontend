// Dashboard for City Manager role
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Users, TrendingUp, DollarSign, MapPin } from "lucide-react";

export function CityDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">City Management Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">City Operations Overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Customers</p>
                <p className="text-2xl font-bold mt-2">342</p>
              </div>
              <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-bold mt-2">₹8.5L</p>
              </div>
              <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Growth Rate</p>
                <p className="text-2xl font-bold mt-2">+18%</p>
              </div>
              <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Clusters</p>
                <p className="text-2xl font-bold mt-2">5</p>
              </div>
              <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
                <MapPin className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketing ROI */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Marketing Campaign Performance</h3>
          <div className="space-y-3">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Google Ads Campaign</p>
                  <p className="text-sm text-gray-600">Budget: ₹35,000</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">3.2x ROI</p>
                  <p className="text-xs text-gray-500">112K Revenue</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
