/**
 * Communication Templates Management (Admin Only)
 * Part 4 - Template CRUD for WhatsApp & Email
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "../ui/table";
import { 
  Plus, Edit, Eye, Power, X, FileText, MessageCircle, 
  Mail, Copy, Check 
} from "lucide-react";
import { toast } from "sonner";
import { BackButton } from "../ui/back-button";

type TemplateChannel = "WhatsApp" | "Email" | "Both";
type TemplateCategory = "Plan & Pricing" | "Demo Confirmation" | "Follow-Up" | "Booking Confirmation" | "Welcome" | "Other";

interface CommunicationTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  channel: TemplateChannel;
  whatsappContent?: string;
  emailSubject?: string;
  emailContent?: string;
  status: "Active" | "Inactive";
  lastUpdated: string;
  isDefault?: boolean;
}

const AVAILABLE_VARIABLES = [
  { key: "[Customer Name]", description: "Customer's full name" },
  { key: "[Plan Name]", description: "Subscription plan name" },
  { key: "[Vehicle Category]", description: "Vehicle type (Sedan/SUV/Hatchback)" },
  { key: "[Monthly Price]", description: "Plan monthly price" },
  { key: "[Demo Date]", description: "Scheduled demo date" },
  { key: "[Demo Time Slot]", description: "Demo time slot" },
  { key: "[TSE Name]", description: "TSE's name" },
  { key: "[Company Phone]", description: "Company contact number" },
  { key: "[Booking Link]", description: "Direct booking URL" },
];

const DEFAULT_TEMPLATES: CommunicationTemplate[] = [
  {
    id: "TPL001",
    name: "Plan & Pricing - WhatsApp",
    category: "Plan & Pricing",
    channel: "WhatsApp",
    whatsappContent: "Hi [Customer Name], Thank you for your interest in CleanCar 360°! Here are the details for the [Plan Name] plan for your [Vehicle Category]:\n\n✅ Monthly Price: ₹[Monthly Price]\n\nWhat's included:\n• Weekly exterior wash\n• Interior vacuuming\n• Dashboard cleaning\n• Tire shine\n• Complimentary air freshener\n\n🎁 Special: First wash free!\n\n📞 To book or ask questions, reply to this message or call us.\n\n— [TSE Name], CleanCar 360°",
    status: "Active",
    lastUpdated: "2026-03-15",
    isDefault: true
  },
  {
    id: "TPL002",
    name: "Plan & Pricing - Email",
    category: "Plan & Pricing",
    channel: "Email",
    emailSubject: "Your CleanCar 360° Plan Details - [Plan Name]",
    emailContent: "Dear [Customer Name],\n\nThank you for your interest in CleanCar 360°!\n\nPlan: [Plan Name] for [Vehicle Category]\nMonthly Price: ₹[Monthly Price]\n\nWhat's Included:\n• Weekly exterior wash\n• Interior vacuuming\n• Dashboard cleaning\n• Tire shine\n• Complimentary air freshener\n\nSpecial Offer: First wash absolutely free!\n\nTo book or for any questions, simply reply to this email or call us at [Company Phone].\n\nBest regards,\n[TSE Name]\nCleanCar 360°\n[Booking Link]",
    status: "Active",
    lastUpdated: "2026-03-15",
    isDefault: true
  },
  {
    id: "TPL003",
    name: "Demo Confirmation",
    category: "Demo Confirmation",
    channel: "Both",
    whatsappContent: "Hi [Customer Name], your free demo wash is confirmed for [Demo Date] at [Demo Time Slot]. Our team will arrive at your location.\n\nVehicle: [Vehicle Category]\n\nFeel free to reply with any questions.\n\n— [TSE Name], CleanCar 360°",
    emailSubject: "Demo Wash Confirmed - [Demo Date]",
    emailContent: "Dear [Customer Name],\n\nYour free demo wash is confirmed!\n\nDate: [Demo Date]\nTime: [Demo Time Slot]\nVehicle: [Vehicle Category]\n\nOur team will arrive at your location at the scheduled time.\n\nLooking forward to serving you!\n\nBest regards,\n[TSE Name]\nCleanCar 360°",
    status: "Active",
    lastUpdated: "2026-03-15",
    isDefault: true
  },
  {
    id: "TPL004",
    name: "Follow-Up after Demo",
    category: "Follow-Up",
    channel: "Both",
    whatsappContent: "Hi [Customer Name], we hope you enjoyed your free demo wash! 🚗✨\n\nWe'd love to have you as a CleanCar 360° member. The [Plan Name] for your [Vehicle Category] is just ₹[Monthly Price]/month.\n\nReply YES to confirm your booking or let us know your questions.\n\n— [TSE Name]",
    emailSubject: "Enjoyed your demo? Let's continue!",
    emailContent: "Dear [Customer Name],\n\nWe hope you enjoyed your free demo wash with CleanCar 360°!\n\nThe [Plan Name] for your [Vehicle Category] is available at just ₹[Monthly Price]/month.\n\nReply to this email to confirm your booking or if you have any questions.\n\nBest regards,\n[TSE Name]\nCleanCar 360°",
    status: "Active",
    lastUpdated: "2026-03-15",
    isDefault: true
  },
  {
    id: "TPL005",
    name: "Booking Confirmation",
    category: "Booking Confirmation",
    channel: "Both",
    whatsappContent: "Hi [Customer Name], welcome to CleanCar 360°! 🎉\n\nYour [Plan Name] subscription is confirmed. Your first wash will be on [Demo Date].\n\nSee you then!\n\n— [TSE Name]",
    emailSubject: "Welcome to CleanCar 360° - Subscription Confirmed!",
    emailContent: "Dear [Customer Name],\n\nWelcome to the CleanCar 360° family!\n\nYour [Plan Name] subscription is now active.\nFirst wash scheduled: [Demo Date]\n\nThank you for choosing us!\n\nBest regards,\n[TSE Name]\nCleanCar 360°",
    status: "Active",
    lastUpdated: "2026-03-15",
    isDefault: true
  }
];

export function CommunicationTemplates() {
  const [templates, setTemplates] = useState<CommunicationTemplate[]>(DEFAULT_TEMPLATES);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showPreview, setShowPreview] = useState<CommunicationTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<CommunicationTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "Plan & Pricing" as TemplateCategory,
    channel: "Both" as TemplateChannel,
    whatsappContent: "",
    emailSubject: "",
    emailContent: ""
  });

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      category: "Plan & Pricing",
      channel: "Both",
      whatsappContent: "",
      emailSubject: "",
      emailContent: ""
    });
    setShowDrawer(true);
  };

  const handleEditTemplate = (template: CommunicationTemplate) => {
    if (template.isDefault) {
      toast.error("Default templates can be edited but not deleted");
    }
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      channel: template.channel,
      whatsappContent: template.whatsappContent || "",
      emailSubject: template.emailSubject || "",
      emailContent: template.emailContent || ""
    });
    setShowDrawer(true);
  };

  const handleSaveTemplate = () => {
    if (!formData.name.trim()) {
      toast.error("Template name is required");
      return;
    }

    if (formData.channel === "WhatsApp" || formData.channel === "Both") {
      if (!formData.whatsappContent.trim()) {
        toast.error("WhatsApp content is required");
        return;
      }
    }

    if (formData.channel === "Email" || formData.channel === "Both") {
      if (!formData.emailSubject.trim() || !formData.emailContent.trim()) {
        toast.error("Email subject and content are required");
        return;
      }
    }

    if (editingTemplate) {
      setTemplates(templates.map(t => 
        t.id === editingTemplate.id 
          ? { 
              ...t, 
              ...formData, 
              lastUpdated: new Date().toISOString().split('T')[0] 
            }
          : t
      ));
      toast.success("Template updated successfully");
    } else {
      const newTemplate: CommunicationTemplate = {
        id: `TPL${String(templates.length + 1).padStart(3, '0')}`,
        ...formData,
        status: "Active",
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      setTemplates([...templates, newTemplate]);
      toast.success("Template created successfully");
    }

    setShowDrawer(false);
  };

  const handleToggleStatus = (templateId: string) => {
    setTemplates(templates.map(t =>
      t.id === templateId
        ? { ...t, status: t.status === "Active" ? "Inactive" : "Active" }
        : t
    ));
    toast.success("Template status updated");
  };

  const insertVariable = (variable: string) => {
    if (formData.channel === "WhatsApp" || formData.channel === "Both") {
      setFormData({
        ...formData,
        whatsappContent: formData.whatsappContent + variable
      });
    }
  };

  return (
    <div className="space-y-6">
      <BackButton to="/settings" />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Communication Templates</h2>
          <p className="text-gray-600">Manage WhatsApp and Email message templates</p>
        </div>
        <Button onClick={handleAddTemplate} className="bg-[#00C896] hover:bg-[#00B085]">
          <Plus className="w-4 h-4 mr-2" />
          Add Template
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{template.name}</span>
                      {template.isDefault && (
                        <Badge variant="outline" className="text-xs">Default</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{template.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {(template.channel === "WhatsApp" || template.channel === "Both") && (
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      )}
                      {(template.channel === "Email" || template.channel === "Both") && (
                        <Mail className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="text-sm">{template.channel}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(template.lastUpdated).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.status === "Active" ? "default" : "secondary"}>
                      {template.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowPreview(template)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus(template.id)}
                      >
                        <Power className={`w-4 h-4 ${template.status === "Active" ? "text-green-600" : "text-gray-400"}`} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Template Editor Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
            <div className="bg-[#00C896] text-white p-4 flex items-center justify-between sticky top-0">
              <h3 className="text-lg font-bold">
                {editingTemplate ? "Edit Template" : "Add New Template"}
              </h3>
              <button onClick={() => setShowDrawer(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
              <div>
                <Label>Template Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Plan & Pricing - WhatsApp"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label>Category *</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as TemplateCategory })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="Plan & Pricing">Plan & Pricing</option>
                    <option value="Demo Confirmation">Demo Confirmation</option>
                    <option value="Follow-Up">Follow-Up</option>
                    <option value="Booking Confirmation">Booking Confirmation</option>
                    <option value="Welcome">Welcome</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <Label>Channel *</Label>
                  <select
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value as TemplateChannel })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>

              {/* Variable Placeholders */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">Available Variables</h4>
                <p className="text-xs text-gray-600 mb-3">Click to insert into message</p>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_VARIABLES.map((variable) => (
                    <button
                      key={variable.key}
                      onClick={() => insertVariable(variable.key)}
                      className="text-left p-2 bg-white border rounded hover:bg-blue-50 transition-colors"
                    >
                      <code className="text-xs text-blue-600 font-mono">{variable.key}</code>
                      <p className="text-xs text-gray-500">{variable.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {(formData.channel === "WhatsApp" || formData.channel === "Both") && (
                <div>
                  <Label>WhatsApp Message *</Label>
                  <Textarea
                    value={formData.whatsappContent}
                    onChange={(e) => setFormData({ ...formData, whatsappContent: e.target.value })}
                    placeholder="Enter WhatsApp message with variables..."
                    rows={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.whatsappContent.length} characters
                  </p>
                </div>
              )}

              {(formData.channel === "Email" || formData.channel === "Both") && (
                <>
                  <div>
                    <Label>Email Subject *</Label>
                    <Input
                      value={formData.emailSubject}
                      onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                      placeholder="Enter email subject..."
                    />
                  </div>

                  <div>
                    <Label>Email Content *</Label>
                    <Textarea
                      value={formData.emailContent}
                      onChange={(e) => setFormData({ ...formData, emailContent: e.target.value })}
                      placeholder="Enter email content with variables..."
                      rows={10}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDrawer(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate} className="bg-[#00C896] hover:bg-[#00B085]">
                  <Check className="w-4 h-4 mr-2" />
                  {editingTemplate ? "Update" : "Create"} Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-100 p-4 flex items-center justify-between border-b">
              <h3 className="font-bold">{showPreview.name}</h3>
              <button onClick={() => setShowPreview(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              {showPreview.whatsappContent && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <h4 className="font-semibold">WhatsApp Preview</h4>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm font-sans">
                      {showPreview.whatsappContent}
                    </pre>
                  </div>
                </div>
              )}
              {showPreview.emailContent && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold">Email Preview</h4>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="font-semibold text-sm mb-2">Subject: {showPreview.emailSubject}</p>
                    <pre className="whitespace-pre-wrap text-sm font-sans">
                      {showPreview.emailContent}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
