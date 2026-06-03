import { useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { MessageSquare, Mail, Send, X } from "lucide-react";
import { toast } from "sonner";
import { useCustomers } from "../../../contexts/CustomerContext";
import { useRole } from "../../../contexts/RoleContext";

interface SendMessagePanelProps {
  lead: any;
  onClose: () => void;
  onComplete: () => void;
}

export function SendMessagePanel({
  lead,
  onClose,
  onComplete,
}: SendMessagePanelProps) {
  const { appendLeadActivity } = useCustomers();
  const { currentUser } = useRole();
  const leadId = lead.leadId || lead.id;
  const [channel, setChannel] = useState<"whatsapp" | "email" | "both">("whatsapp");
  const [message, setMessage] = useState("");
  const [useTemplate, setUseTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const templates = [
    {
      name: "Welcome Message",
      whatsapp: `Hi ${lead.customerName.split(" ")[0]}, thank you for your interest in CleanCar 360°! I'm here to help you with our premium car care services. When would be a good time to discuss your requirements?`,
      email: `Dear ${lead.customerName},\n\nThank you for showing interest in CleanCar 360°. We provide comprehensive car care solutions tailored to your needs.\n\nI'd love to schedule a quick call to understand your requirements better.\n\nBest regards,\nCleanCar 360° Team`,
    },
    {
      name: "Plan Information",
      whatsapp: `Hi ${lead.customerName.split(" ")[0]}, here's information about our ${lead.planOfInterest} plan perfect for your ${lead.vehicleCategory}. Would you like to know more about the features and pricing?`,
      email: `Dear ${lead.customerName},\n\nI'm sharing details about our ${lead.planOfInterest} plan, specially designed for ${lead.vehicleCategory} owners.\n\nLet me know if you'd like detailed pricing and package information.\n\nBest regards,\nCleanCar 360° Team`,
    },
    {
      name: "Follow-up",
      whatsapp: `Hi ${lead.customerName.split(" ")[0]}, just following up on our previous conversation. Do you have any questions about our services? I'm here to help!`,
      email: `Dear ${lead.customerName},\n\nI wanted to follow up on our previous discussion about CleanCar 360° services.\n\nPlease feel free to reach out if you have any questions.\n\nBest regards,\nCleanCar 360° Team`,
    },
  ];

  const handleSend = () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    toast.success(
      channel === "both"
        ? "Message sent via WhatsApp and Email!"
        : `Message sent via ${channel === "whatsapp" ? "WhatsApp" : "Email"}!`
    );

    appendLeadActivity(leadId, {
      timestamp: new Date().toISOString(),
      type: "whatsapp",
      description: `WhatsApp sent: "${templateName || 'Custom message'}" template`,
      performedBy: currentUser?.name || "TSE",
      metadata: { templateName: templateName || 'Custom', channel: "whatsapp" },
    });

    onComplete();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-teal-600" />
          <h4 className="font-semibold text-gray-900">Send Message</h4>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Channel Toggle */}
        <div className="space-y-2">
          <Label>Channel</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setChannel("whatsapp")}
              className={`flex-1 p-3 border-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
                channel === "whatsapp"
                  ? "border-green-600 bg-green-50 text-green-700"
                  : "border-gray-200"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setChannel("email")}
              className={`flex-1 p-3 border-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
                channel === "email"
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200"
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setChannel("both")}
              className={`flex-1 p-3 border-2 rounded-lg font-medium ${
                channel === "both"
                  ? "border-purple-600 bg-purple-50 text-purple-700"
                  : "border-gray-200"
              }`}
            >
              Both
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={lead.mobile} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={lead.email} readOnly />
          </div>
        </div>

        {/* Template Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Use Template</Label>
            <button
              type="button"
              onClick={() => setUseTemplate(!useTemplate)}
              className="text-sm text-teal-600 hover:text-teal-700"
            >
              {useTemplate ? "Hide Templates" : "Show Templates"}
            </button>
          </div>
          {useTemplate && (
            <div className="grid grid-cols-1 gap-2">
              {templates.map((template, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setMessage(
                      channel === "email"
                        ? template.email
                        : template.whatsapp
                    );
                    setUseTemplate(false);
                  }}
                  className="p-3 border border-gray-200 rounded-lg text-left hover:border-teal-300 hover:bg-teal-50 transition-colors"
                >
                  <p className="font-medium text-sm text-gray-900">
                    {template.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {channel === "email"
                      ? template.email
                      : template.whatsapp}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Composer */}
        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            placeholder="Type your message here..."
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            {message.length} characters
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSend}
            className="flex-1 bg-teal-600 hover:bg-teal-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Message
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>

        {/* View Full Conversation Link */}
        <div className="text-center pt-2">
          <button className="text-sm text-teal-600 hover:text-teal-700">
            View full conversation →
          </button>
        </div>
      </div>
    </div>
  );
}
