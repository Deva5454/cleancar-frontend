/**
 * CCE Complaint Queue - Screen #1
 *
 * All open complaints ranked by SLA urgency
 * P1 flagged with red countdown timer
 * New unassigned complaints at the top
 */

import { Badge } from '../ui/badge';
import { Card } from "../ui/card";
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  AlertCircle,
  Clock,
  Phone,
  Mail,
  Smartphone,
  MapPin,
  Share2,
  Search,
  Filter,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import type {Complaint, ComplaintPriority, ComplaintFilters } from '../../types/customerCareExecutive.types';
import { customerCareExecutiveService } from '../../services/customerCareExecutiveService';
import { COMPLAINT_PRIORITIES, COMPLAINT_STATUS } from '../../constants/customerCareExecutive.constants';

interface CCEComplaintQueueProps {
  complaints: Complaint[];
  onSelectComplaint: (complaint: Complaint) => void;
  filters?: ComplaintFilters;
  onFilterChange?: (filters: ComplaintFilters) => void;
}

export function CCEComplaintQueue({
  complaints,
  onSelectComplaint,
  filters = {},
  onFilterChange,
}: CCEComplaintQueueProps) {
  const getChannelIcon = (channel: string) => {
    const icons = {
      phone: Phone,
      email: Mail,
      app: Smartphone,
      walk_in: MapPin,
      field: MapPin,
      social: Share2,
    };
    const Icon = icons[channel as keyof typeof icons] || Phone;
    return <Icon className="w-4 h-4" />;
  };

  const getPriorityColor = (priority: ComplaintPriority) => {
    const colors = {
      P1: 'bg-red-500 text-white border-red-600',
      P2: 'bg-orange-500 text-white border-orange-600',
      P3: 'bg-yellow-500 text-gray-900 border-yellow-600',
      P4: 'bg-gray-400 text-gray-900 border-gray-500',
    };
    return colors[priority];
  };

  const getStatusColor = (status: string) => {
    const statusInfo = Object.values(COMPLAINT_STATUS).find((s) => s.id === status);
    if (!statusInfo) return 'bg-gray-100 text-gray-900';

    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-900',
      purple: 'bg-purple-100 text-purple-900',
      yellow: 'bg-yellow-100 text-yellow-900',
      amber: 'bg-amber-100 text-amber-900',
      green: 'bg-green-100 text-green-900',
      red: 'bg-red-100 text-red-900',
      gray: 'bg-gray-100 text-gray-900',
    };

    return colors[statusInfo.color] || 'bg-gray-100 text-gray-900';
  };

  const getSLAStatusDisplay = (complaint: Complaint) => {
    const sla = customerCareExecutiveService.getSLAStatus(complaint);

    let colorClass = 'text-green-600';
    let bgClass = 'bg-green-50';

    if (sla.status === 'breached') {
      colorClass = 'text-red-600';
      bgClass = 'bg-red-50';
    } else if (sla.status === 'critical') {
      colorClass = 'text-orange-600';
      bgClass = 'bg-orange-50';
    } else if (sla.status === 'warning') {
      colorClass = 'text-yellow-600';
      bgClass = 'bg-yellow-50';
    }

    return (
      <div className={`${bgClass} px-2 py-1 rounded text-xs font-semibold ${colorClass} flex items-center gap-1`}>
        <Clock className="w-3 h-3" />
        {sla.status === 'breached' && <AlertCircle className="w-3 h-3" />}
        {sla.timeRemaining}
      </div>
    );
  };

  // Separate complaints by urgency
  const newUnassigned = complaints.filter((c) => c.status === 'new');
  const p1Complaints = complaints.filter((c) => c.priority === 'P1' && c.status !== 'new');
  const otherComplaintsActive = complaints.filter(
    (c) => c.priority !== 'P1' && c.status !== 'new' && c.status !== 'closed'
  );

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Complaint Queue</h2>
          <p className="text-sm text-gray-600">Ranked by SLA urgency - P1 complaints at top</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            {complaints.length} Total
          </Badge>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="w-4 h-4 mr-1" />
            {newUnassigned.length} New
          </Badge>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by ticket ID, customer name, or description..."
            className="pl-10"
            value={filters.searchTerm || ''}
            onChange={(e) =>
              onFilterChange?.({ ...filters, searchTerm: e.target.value })
            }
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Complaint List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {/* New & Unassigned - Highest Priority */}
        {newUnassigned.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              NEW & UNASSIGNED - REQUIRES IMMEDIATE ACTION ({newUnassigned.length})
            </div>
            {newUnassigned.map((complaint) => (
              <ComplaintCard
                key={complaint.ticketId}
                complaint={complaint}
                onSelect={onSelectComplaint}
                getChannelIcon={getChannelIcon}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                getSLAStatusDisplay={getSLAStatusDisplay}
                isNew
              />
            ))}
          </div>
        )}

        {/* P1 Critical Complaints */}
        {p1Complaints.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              P1 CRITICAL ({p1Complaints.length})
            </div>
            {p1Complaints.map((complaint) => (
              <ComplaintCard
                key={complaint.ticketId}
                complaint={complaint}
                onSelect={onSelectComplaint}
                getChannelIcon={getChannelIcon}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                getSLAStatusDisplay={getSLAStatusDisplay}
              />
            ))}
          </div>
        )}

        {/* Other Active Complaints */}
        {otherComplaintsActive.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-2">
              OTHER ACTIVE COMPLAINTS ({otherComplaintsActive.length})
            </div>
            {otherComplaintsActive.map((complaint) => (
              <ComplaintCard
                key={complaint.ticketId}
                complaint={complaint}
                onSelect={onSelectComplaint}
                getChannelIcon={getChannelIcon}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                getSLAStatusDisplay={getSLAStatusDisplay}
              />
            ))}
          </div>
        )}

        {complaints.length === 0 && (
          <Card className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-gray-600">No complaints in queue</p>
          </Card>
        )}
      </div>
    </div>
  );
}

interface ComplaintCardProps {
  complaint: Complaint;
  onSelect: (complaint: Complaint) => void;
  getChannelIcon: (channel: string) => JSX.Element;
  getPriorityColor: (priority: ComplaintPriority) => string;
  getStatusColor: (status: string) => string;
  getSLAStatusDisplay: (complaint: Complaint) => JSX.Element;
  isNew?: boolean;
}

function ComplaintCard({
  complaint,
  onSelect,
  getChannelIcon,
  getPriorityColor,
  getStatusColor,
  getSLAStatusDisplay,
  isNew = false,
}: ComplaintCardProps) {
  return (
    <Card
      className={`p-4 mb-2 cursor-pointer hover:shadow-md transition-shadow ${
        isNew ? 'border-2 border-red-400 bg-red-50' : 'border border-gray-200'
      } ${complaint.escalated ? 'border-l-4 border-l-red-600' : ''}`}
      onClick={() => onSelect(complaint)}
    >
      <div className="flex items-start gap-4">
        {/* Priority Badge */}
        <div className="flex-shrink-0">
          <Badge className={`${getPriorityColor(complaint.priority)} font-bold text-sm px-3 py-1`}>
            {complaint.priority}
          </Badge>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-gray-900">{complaint.ticketId}</span>
                {getChannelIcon(complaint.channel)}
                <Badge variant="outline" className={getStatusColor(complaint.status)}>
                  {COMPLAINT_STATUS[complaint.status.toUpperCase() as keyof typeof COMPLAINT_STATUS]?.label || complaint.status}
                </Badge>
                {complaint.escalated && (
                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Escalated
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-semibold">{complaint.customerName}</span> • {complaint.vehicle}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {complaint.complaintType}
              </div>
            </div>

            {/* SLA Status */}
            <div className="flex-shrink-0">
              {getSLAStatusDisplay(complaint)}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {complaint.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {complaint.assignedSupervisorName && (
                <span>Assigned to: {complaint.assignedSupervisorName}</span>
              )}
              {complaint.zone && (
                <span>Zone: {complaint.zone.replace('zone_', '').toUpperCase()}</span>
              )}
            </div>
            <div>
              Logged: {new Date(complaint.createdAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
