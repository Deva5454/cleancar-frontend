/**
 * Customer Care Executive (CCE) - Main Application
 * Web-only interface for complaint management and customer satisfaction tracking
 *
 * 5 Primary Screens:
 * 1. Complaint Queue - SLA-ranked complaints with priority filtering
 * 2. Active Complaint - Full complaint details with supervisor assignment
 * 3. Supervisor Assignment Panel - Zone-based supervisor selection
 * 4. CRM Update - Mandatory post-action update form
 * 5. CSAT & Dashboard - Performance metrics and customer satisfaction
 *
 * Platform: Desktop/Laptop only (1024px+)
 *
 * @component
 */

import { useState, useEffect } from 'react';
import { Card } from "../ui/card";
import { toast } from "sonner";
import { useSearchParams } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Phone,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Bell,
  User,
  LogOut,
  CheckCircle2,
  XCircle,
  MessageSquare,
  FileText,
  BarChart3,
  Search,
  Calendar,
  Star,
  Send,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { CCEComplaintQueue } from './CCEComplaintQueue';
import { customerCareExecutiveService } from '../../services/customerCareExecutiveService';
import type {
  Complaint,
  ComplaintFilters,
  CCEDailyStats,
  CCEAlert,
  Supervisor,
} from '../../types/customerCareExecutive.types';
import {
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUS,
  CCE_KPI_TARGETS,
  CCE_VARIABLE_INCENTIVE,
  CSAT_SCALE,
  CCE_SCRIPTS,
} from '../../constants/customerCareExecutive.constants';

type ScreenType = 'QUEUE' | 'ACTIVE_COMPLAINT' | 'CRM_UPDATE' | 'DASHBOARD';
type TabType = 'complaints' | 'performance';

export function CustomerCareExecutiveApp() {
  const [searchParams] = useSearchParams();

  // Initialize screen based on URL tab parameter
  const getInitialScreen = (): ScreenType => {
    const tab = searchParams.get('tab');
    if (tab === 'performance') return 'DASHBOARD';
    return 'QUEUE';
  };

  const [currentScreen, setCurrentScreen] = useState<ScreenType>(getInitialScreen);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filters, setFilters] = useState<ComplaintFilters>({});
  const [dailyStats, setDailyStats] = useState<CCEDailyStats | null>(null);
  const [alerts, setAlerts] = useState<CCEAlert[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // CRM Update state
  const [crmNotes, setCrmNotes] = useState('');
  const [customerMessage, setCustomerMessage] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // CSAT state
  const [csatScore, setCSATScore] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [csatFeedback, setCSATFeedback] = useState('');

  // Supervisor assignment state
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  const [showSupervisorPanel, setShowSupervisorPanel] = useState(false);

  // Update screen when URL tab parameter changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'performance') {
      setCurrentScreen('DASHBOARD');
    } else if (tab === 'complaints') {
      setCurrentScreen('QUEUE');
    }
  }, [searchParams]);

  // Load data
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setComplaints(customerCareExecutiveService.getAllComplaints(filters));
    setDailyStats(customerCareExecutiveService.getTodayStats());
    setAlerts(customerCareExecutiveService.getActiveAlerts());
  };

  const handleSelectComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setCurrentScreen('ACTIVE_COMPLAINT');

    // Auto-suggest supervisor if not assigned
    if (!complaint.assignedSupervisorId) {
      const suggested = customerCareExecutiveService.getSuggestedSupervisor(complaint);
      setSelectedSupervisor(suggested);
    }
  };

  const handleAssignSupervisor = () => {
    if (!selectedComplaint || !selectedSupervisor) return;

    const result = customerCareExecutiveService.assignComplaintToSupervisor(
      selectedComplaint.ticketId,
      selectedSupervisor.id,
      'cce_001'
    );

    if (result.success) {
      loadData();
      setShowSupervisorPanel(false);
      toast.info(result.message);

      // Log communication
      customerCareExecutiveService.logCommunication(selectedComplaint.ticketId, {
        timestamp: new Date(),
        direction: 'outbound',
        channel: 'phone',
        summary: CCE_SCRIPTS.ASSIGNMENT_CONFIRMATION
          .replace('{{ticketId}}', selectedComplaint.ticketId)
          .replace('{{tat}}', selectedComplaint.slaDeadline.toLocaleString()),
        sentBy: 'cce_001',
      });
    }
  };

  const handleSubmitCRM = () => {
    if (!selectedComplaint) return;

    customerCareExecutiveService.updateComplaint({
      ticketId: selectedComplaint.ticketId,
      notes: crmNotes,
      followUpScheduled: followUpDate ? new Date(followUpDate) : undefined,
    });

    if (customerMessage) {
      customerCareExecutiveService.logCommunication(selectedComplaint.ticketId, {
        timestamp: new Date(),
        direction: 'outbound',
        channel: 'phone',
        summary: customerMessage,
        sentBy: 'cce_001',
      });
    }

    loadData();
    toast.success('CRM updated successfully');
    setCurrentScreen('QUEUE');
    setSelectedComplaint(null);
  };

  const handleSubmitCSAT = () => {
    if (!selectedComplaint || csatScore === null) {
      toast.error('Please provide a CSAT score');
      return;
    }

    const result = customerCareExecutiveService.submitCSAT(
      selectedComplaint.ticketId,
      csatScore,
      csatFeedback
    );

    toast.info(result.message);

    if (result.requiresEscalation) {
      toast.info('⚠️ CSAT < 3.0 - Complaint auto-escalated to TSM');
    }

    loadData();
    setCurrentScreen('QUEUE');
    setSelectedComplaint(null);
    setCSATScore(null);
    setCSATFeedback('');
  };

  const handleEscalate = (reason: string) => {
    if (!selectedComplaint) return;

    const result = customerCareExecutiveService.escalateComplaint(
      selectedComplaint.ticketId,
      reason,
      'cce_001'
    );

    toast.info(result.message);
    loadData();
    setCurrentScreen('QUEUE');
    setSelectedComplaint(null);
  };

  const handleResolveComplaint = () => {
    if (!selectedComplaint) return;
    const notes = resolutionNotes.trim() || 'Issue resolved by CCE';
    const result = customerCareExecutiveService.resolveComplaint(
      selectedComplaint.ticketId,
      notes,
      'cce_001'
    );
    if (result.success) {
      toast.success(result.message);
      loadData();
      setCurrentScreen('QUEUE');
      setSelectedComplaint(null);
      setResolutionNotes('');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="bg-white/20 p-2 rounded-lg">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Customer Care Executive</h1>
              <p className="text-sm text-blue-100">
                {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Quick Stats */}
            {dailyStats && (
              <div className="flex items-center gap-4 bg-white/10 px-4 py-2 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">{dailyStats.complaintsReceived}</div>
                  <div className="text-xs text-blue-100">Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{dailyStats.complaintsClosed}</div>
                  <div className="text-xs text-blue-100">Closed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{dailyStats.csatAverage.toFixed(1)}</div>
                  <div className="text-xs text-blue-100">CSAT</div>
                </div>
              </div>
            )}

            {/* Alerts */}
            <Button
              variant="ghost"
              size="sm"
              className="relative text-white hover:bg-white/20"
            >
              <Bell className="w-5 h-5" />
              {alerts.length > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5">
                  {alerts.length}
                </Badge>
              )}
            </Button>

            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
              <User className="w-5 h-5" />
              <span className="text-sm font-medium">CCE User</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={currentScreen === 'QUEUE' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setCurrentScreen('QUEUE')}
            className={currentScreen === 'QUEUE' ? 'bg-white text-blue-700' : 'text-white hover:bg-white/20'}
          >
            <FileText className="w-4 h-4 mr-2" />
            Complaint Queue
          </Button>
          <Button
            variant={currentScreen === 'DASHBOARD' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setCurrentScreen('DASHBOARD')}
            className={currentScreen === 'DASHBOARD' ? 'bg-white text-blue-700' : 'text-white hover:bg-white/20'}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Performance Dashboard
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {currentScreen === 'QUEUE' && (
          <CCEComplaintQueue
            complaints={complaints}
            onSelectComplaint={handleSelectComplaint}
            filters={filters}
            onFilterChange={setFilters}
          />
        )}

        {currentScreen === 'ACTIVE_COMPLAINT' && selectedComplaint && (
          <div className="h-full overflow-y-auto p-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentScreen('QUEUE');
                setSelectedComplaint(null);
              }}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Queue
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Complaint Details */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedComplaint.ticketId}
                      </h2>
                      <Badge className={`${getPriorityColor(selectedComplaint.priority)} mr-2`}>
                        {selectedComplaint.priority} - {COMPLAINT_PRIORITIES[selectedComplaint.priority].label}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(selectedComplaint.status)}>
                        {COMPLAINT_STATUS[selectedComplaint.status.toUpperCase() as keyof typeof COMPLAINT_STATUS]?.label}
                      </Badge>
                    </div>

                    {/* SLA Countdown */}
                    <div className="text-right">
                      {getSLAStatusCard(selectedComplaint)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-xs text-gray-500">Customer</Label>
                      <p className="font-semibold">{selectedComplaint.customerName}</p>
                      <p className="text-sm text-gray-600">{selectedComplaint.customerPhone}</p>
                      {selectedComplaint.customerCity && selectedComplaint.customerState && (
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedComplaint.customerCity}, {selectedComplaint.customerState}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Vehicle</Label>
                      <p className="font-semibold">{selectedComplaint.vehicle}</p>
                      <p className="text-sm text-gray-600">{selectedComplaint.vehicleNumber}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label className="text-xs text-gray-500">Complaint Type</Label>
                    <p className="font-semibold">{selectedComplaint.complaintType}</p>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">Description</Label>
                    <p className="text-gray-700">{selectedComplaint.description}</p>
                  </div>
                </Card>

                {/* Actions */}
                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-4">Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Connection: CCE → Supervisor (Normal escalation path) */}
                    {!selectedComplaint.assignedSupervisorId && (
                      <Button
                        onClick={() => setShowSupervisorPanel(true)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Escalate to Supervisor
                      </Button>
                    )}
                    {selectedComplaint.assignedSupervisorId && (
                      <div className="col-span-1 p-3 bg-green-50 border border-green-200 rounded text-sm">
                        <p className="text-green-700 font-semibold">✓ Assigned to Supervisor</p>
                        <p className="text-xs text-green-600 mt-1">Escalation path: CCE → Supervisor → OM</p>
                      </div>
                    )}

                    <Button
                      onClick={() => setCurrentScreen('CRM_UPDATE')}
                      variant="outline"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Update CRM
                    </Button>

                    {selectedComplaint.status === 'resolved' && (
                      <Button
                        onClick={() => setCurrentScreen('CRM_UPDATE')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Collect CSAT
                      </Button>
                    )}

                    <Button
                      variant="destructive"
                      onClick={() => {
                          const notes = window.prompt('Resolution notes (optional):', '') || 'Issue resolved';
                          setResolutionNotes(notes);
                          setTimeout(handleResolveComplaint, 100);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded-lg font-medium"
                      >
                        ✅ Mark Resolved
                      </Button>
                      <Button
                        onClick={() => handleEscalate('Manual escalation by CCE')}
                        title="Critical cases only - skips Supervisor"
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Escalate to TSM (Critical)
                      </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    📋 Standard path: CCE → Supervisor → Operations Manager
                  </p>
                </Card>

                {/* Communication Log */}
                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-4">Communication Log</h3>
                  <div className="space-y-3">
                    {selectedComplaint.communicationLog.map((log, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700">
                            {log.direction === 'outbound' ? '→ Outbound' : '← Inbound'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{log.summary}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Right: Supervisor Assignment Panel */}
              {showSupervisorPanel && (
                <div className="lg:col-span-1">
                  <Card className="p-6">
                    <h3 className="font-bold text-lg mb-4">Assign Supervisor</h3>

                    {selectedSupervisor && (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-700">Suggested Match</span>
                        </div>
                        <p className="font-semibold">{selectedSupervisor.name}</p>
                        <p className="text-sm text-gray-600">{selectedSupervisor.zoneName}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Active: {selectedSupervisor.activeComplaintsCount} complaints
                        </p>
                        <Button
                          onClick={handleAssignSupervisor}
                          className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                        >
                          Assign to {selectedSupervisor.name}
                        </Button>
                      </div>
                    )}

                    <div className="text-sm text-gray-600">
                      <p className="font-semibold mb-2">Other Supervisors:</p>
                      <div className="space-y-2">
                        {customerCareExecutiveService
                          .getAllSupervisors()
                          .filter((s) => s.id !== selectedSupervisor?.id)
                          .slice(0, 3)
                          .map((supervisor) => (
                            <div
                              key={supervisor.id}
                              className="p-3 border rounded cursor-pointer hover:bg-gray-50"
                              onClick={() => setSelectedSupervisor(supervisor)}
                            >
                              <p className="font-medium text-sm">{supervisor.name}</p>
                              <p className="text-xs text-gray-500">
                                {supervisor.zoneName} • {supervisor.activeComplaintsCount} active
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}

        {currentScreen === 'CRM_UPDATE' && selectedComplaint && (
          <div className="h-full overflow-y-auto p-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentScreen('ACTIVE_COMPLAINT')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Card className="max-w-3xl mx-auto p-6">
              <h2 className="text-2xl font-bold mb-6">
                {selectedComplaint.status === 'resolved' ? 'Collect CSAT & Close Complaint' : 'Update CRM'}
              </h2>

              {selectedComplaint.status === 'resolved' && (
                <div className="mb-6">
                  <Label className="text-sm font-semibold mb-3 block">
                    Customer Satisfaction Score (1-5) *
                  </Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <Button
                        key={score}
                        variant={csatScore === score ? 'default' : 'outline'}
                        onClick={() => setCSATScore(score)}
                        className={`flex-1 ${
                          csatScore === score
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : ''
                        }`}
                      >
                        <Star className="w-4 h-4 mr-1" />
                        {score}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {csatScore ? CSAT_SCALE.LABELS[csatScore as keyof typeof CSAT_SCALE.LABELS] : 'Select a score'}
                  </p>

                  <div className="mt-4">
                    <Label className="text-sm font-semibold mb-2 block">Customer Feedback (Optional)</Label>
                    <Textarea
                      placeholder="Additional comments from customer..."
                      value={csatFeedback}
                      onChange={(e) => setCSATFeedback(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleSubmitCSAT}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700"
                    disabled={csatScore === null}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Submit CSAT & Close Complaint
                  </Button>
                </div>
              )}

              {selectedComplaint.status !== 'resolved' && (
                <>
                  <div className="mb-4">
                    <Label className="text-sm font-semibold mb-2 block">Internal Notes *</Label>
                    <Textarea
                      placeholder="Update on complaint status, actions taken, next steps..."
                      value={crmNotes}
                      onChange={(e) => setCrmNotes(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="mb-4">
                    <Label className="text-sm font-semibold mb-2 block">Customer Communication</Label>
                    <Textarea
                      placeholder="Message sent to customer (if any)..."
                      value={customerMessage}
                      onChange={(e) => setCustomerMessage(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="mb-6">
                    <Label className="text-sm font-semibold mb-2 block">Next Follow-up</Label>
                    <Input
                      type="datetime-local"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleSubmitCRM} className="w-full bg-blue-600 hover:bg-blue-700">
                    <Send className="w-4 h-4 mr-2" />
                    Submit CRM Update
                  </Button>
                </>
              )}
            </Card>
          </div>
        )}

        {currentScreen === 'DASHBOARD' && dailyStats && (
          <div className="h-full overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Performance Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard
                label="Complaints Today"
                value={dailyStats.complaintsReceived}
                target={CCE_KPI_TARGETS.COMPLAINTS_PER_DAY_MIN}
                icon={FileText}
                color="blue"
              />
              <MetricCard
                label="CSAT Score"
                value={dailyStats.csatAverage.toFixed(1)}
                target={CCE_KPI_TARGETS.CSAT_TARGET}
                suffix="/5.0"
                icon={Star}
                color="yellow"
              />
              <MetricCard
                label="SLA Breach Rate"
                value={dailyStats.slaBreachRate.toFixed(1)}
                target={CCE_KPI_TARGETS.SLA_BREACH_RATE_PERCENT}
                suffix="%"
                icon={Clock}
                color="red"
                inverted
              />
              <MetricCard
                label="Escalation Rate"
                value={dailyStats.escalationRate.toFixed(1)}
                target={CCE_KPI_TARGETS.ESCALATION_RATE_PERCENT}
                suffix="%"
                icon={AlertCircle}
                color="orange"
                inverted
              />
            </div>

            <Card className="p-6 mb-6">
              <h3 className="font-bold text-lg mb-4">Monthly Incentive Tracker</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-sm text-gray-600">Fixed Salary</Label>
                  <p className="text-2xl font-bold text-gray-900">₹14,000</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Estimated Variable</Label>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{dailyStats.estimatedVariablePayout.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{dailyStats.incentiveTier}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Total Estimated</Label>
                  <p className="text-2xl font-bold text-indigo-600">
                    ₹{(14000 + dailyStats.estimatedVariablePayout).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">To reach next tier:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Maintain CSAT ≥ 4.5</li>
                  <li>• Keep SLA breach rate {'<'} 2%</li>
                  <li>• Survey collection rate ≥ 80%</li>
                </ul>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getPriorityColor(priority: string) {
  const colors = {
    P1: 'bg-red-500 text-white',
    P2: 'bg-orange-500 text-white',
    P3: 'bg-yellow-500 text-gray-900',
    P4: 'bg-gray-400 text-gray-900',
  };
  return colors[priority as keyof typeof colors] || 'bg-gray-400 text-gray-900';
}

function getStatusColor(status: string) {
  const statusInfo = Object.values(COMPLAINT_STATUS).find((s) => s.id === status);
  if (!statusInfo) return 'bg-gray-100 text-gray-900';

  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-900',
    purple: 'bg-purple-100 text-purple-900',
    yellow: 'bg-yellow-100 text-yellow-900',
    green: 'bg-green-100 text-green-900',
    red: 'bg-red-100 text-red-900',
    gray: 'bg-gray-100 text-gray-900',
  };

  return colors[statusInfo.color] || 'bg-gray-100 text-gray-900';
}

function getSLAStatusCard(complaint: Complaint) {
  const sla = customerCareExecutiveService.getSLAStatus(complaint);

  let bgColor = 'bg-green-100';
  let textColor = 'text-green-700';
  let borderColor = 'border-green-300';

  if (sla.status === 'breached') {
    bgColor = 'bg-red-100';
    textColor = 'text-red-700';
    borderColor = 'border-red-300';
  } else if (sla.status === 'critical') {
    bgColor = 'bg-orange-100';
    textColor = 'text-orange-700';
    borderColor = 'border-orange-300';
  } else if (sla.status === 'warning') {
    bgColor = 'bg-yellow-100';
    textColor = 'text-yellow-700';
    borderColor = 'border-yellow-300';
  }

  return (
    <div className={`${bgColor} ${borderColor} border-2 rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Clock className={`w-5 h-5 ${textColor}`} />
        <span className={`text-sm font-semibold ${textColor}`}>SLA Status</span>
      </div>
      <p className={`text-2xl font-bold ${textColor}`}>{sla.percentComplete.toFixed(0)}%</p>
      <p className={`text-sm ${textColor}`}>{sla.timeRemaining}</p>
      {sla.shouldEscalate && (
        <Badge className="mt-2 bg-red-600 text-white">
          <AlertCircle className="w-3 h-3 mr-1" />
          Escalate Now
        </Badge>
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number | string;
  target: number;
  suffix?: string;
  icon: React.ElementType;
  color: 'blue' | 'yellow' | 'red' | 'orange' | 'green';
  inverted?: boolean;
}

function MetricCard({ label, value, target, suffix = '', icon: Icon, color, inverted = false }: MetricCardProps) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const isGood = inverted ? numValue <= target : numValue >= target;

  const colors = {
    blue: 'text-blue-600 bg-blue-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    red: 'text-red-600 bg-red-50',
    orange: 'text-orange-600 bg-orange-50',
    green: 'text-green-600 bg-green-50',
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <Label className="text-xs text-gray-600">{label}</Label>
      </div>
      <p className="text-3xl font-bold text-gray-900">
        {value}
        {suffix}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Target: {target}
        {suffix} {isGood ? <CheckCircle2 className="inline w-3 h-3 text-green-600" /> : <XCircle className="inline w-3 h-3 text-red-600" />}
      </p>
    </Card>
  );
}
