// Today's Wash Schedule with Plan Deliverables
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  CheckCircle,
  Clock,
  MapPin,
  Info,
  Play,
  CheckCheck,
} from "lucide-react";
import { usePlanDefinitions } from "../../contexts/PlanDefinitionContext";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export function TodayWashSchedule() {
  const { customerSubscriptions, getPlanDeliverables } = usePlanDefinitions();
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  // Filter to show only active subscriptions
  const activeCustomers = customerSubscriptions.filter(c => c.status === "Active");

  const getDeliverables = (planType: string) => {
    return getPlanDeliverables(planType as any);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Today's Wash Schedule</span>
          <Badge variant="secondary">{activeCustomers.length} Scheduled</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeCustomers.map((customer, idx) => {
              const deliverables = getDeliverables(customer.planType);
              return (
                <TableRow key={customer.customerId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        {8 + idx}:00 AM
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{customer.customerName}</p>
                      <p className="text-xs text-gray-500">{customer.customerId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">
                        {customer.carDetails.make} {customer.carDetails.model}
                      </p>
                      <p className="text-xs text-gray-500">
                        {customer.carDetails.registrationNumber}
                      </p>
                      <p className="text-xs text-gray-400">{customer.vehicleCategory}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{customer.planType}</Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      ₹{customer.monthlyPrice}/mo
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-1">
                      <MapPin className="w-3 h-3 mt-0.5 text-gray-400" />
                      <span className="text-sm">{customer.vehicleCategory}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Info className="w-4 h-4 mr-1" />
                          View Services
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {deliverables?.planName} - Service Deliverables
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {deliverables?.tagline}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Best For: {deliverables?.bestFor}
                            </p>
                          </div>

                          <div>
                            <p className="font-medium text-sm mb-2 text-green-700">
                              ✓ Included Services
                            </p>
                            <ul className="space-y-1">
                              {deliverables?.included.map((service, i) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>{service}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {deliverables?.notIncluded && deliverables.notIncluded.length > 0 && (
                            <div>
                              <p className="font-medium text-sm mb-2 text-red-700">
                                ✗ Not Included
                              </p>
                              <ul className="space-y-1">
                                {deliverables.notIncluded.map((service, i) => (
                                  <li key={i} className="text-sm flex items-start gap-2 text-gray-500">
                                    <span className="text-red-500">✗</span>
                                    <span>{service}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {deliverables?.complimentaryBenefits && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm font-medium text-blue-900">
                                Complimentary Benefits
                              </p>
                              <p className="text-sm text-blue-700 mt-1">
                                {deliverables.complimentaryBenefits}
                              </p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default">
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                      <Button size="sm" variant="outline">
                        <CheckCheck className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
