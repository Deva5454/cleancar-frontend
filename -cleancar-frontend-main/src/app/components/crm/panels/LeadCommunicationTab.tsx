import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { MessageSquare, Mail, Send, FileText, Check } from "lucide-react";

interface LeadCommunicationTabProps {
  lead: any;
}

export function LeadCommunicationTab({ lead }: LeadCommunicationTabProps) {
  const [message, setMessage] = useState("");

  const whatsappMessages = [
    {
      id: 1,
      type: "sent",
      text: `Hi ${lead.customerName.split(" ")[0]}, thank you for your interest in CleanCar 360°! I'm Neha from the sales team. When would be a good time to discuss your car care requirements?`,
      timestamp: "Mar 15, 10:30 AM",
      status: "read",
    },
    {
      id: 2,
      type: "received",
      text: "Hello Neha, thanks for reaching out. I'm interested in a monthly subscription. Can you share the plans and pricing?",
      timestamp: "Mar 15, 11:15 AM",
      isUnread: false,
    },
    {
      id: 3,
      type: "sent",
      text: `Great! Here are our subscription plans perfect for your ${lead.vehicleCategory}:\n\n🔹 CleanCar Premium - ₹1,599/month\n✅ Daily exterior wash with foam\n✅ Interior vacuuming 2x weekly\n✅ Dashboard deep clean\n✅ Underbody wash weekly\n\nWould you like to see a demo?`,
      timestamp: "Mar 15, 11:20 AM",
      status: "read",
    },
    {
      id: 4,
      type: "received",
      text: "The pricing looks good. Can we schedule a demo for this week?",
      timestamp: "Mar 16, 4:12 PM",
      isUnread: true,
    },
  ];

  const emailThreads = [
    {
      id: 1,
      subject: "Welcome to CleanCar 360° - Car Care Subscription",
      preview: "Dear Rajesh, Thank you for showing interest in our premium car care services...",
      timestamp: "Mar 15, 10:35 AM",
      status: "opened",
    },
    {
      id: 2,
      subject: "CleanCar Premium Plan - Detailed Pricing & Features",
      preview: "Hi Rajesh, As discussed, here are the complete details of our CleanCar Premium plan...",
      timestamp: "Mar 15, 11:25 AM",
      status: "opened",
    },
  ];

  return (
    <div className="space-y-4">
      <Tabs defaultValue="whatsapp">
        <TabsList className="w-full">
          <TabsTrigger value="whatsapp" className="flex-1">
            <MessageSquare className="w-4 h-4 mr-2 text-green-600" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="email" className="flex-1">
            <Mail className="w-4 h-4 mr-2 text-blue-600" />
            Email
          </TabsTrigger>
        </TabsList>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp" className="space-y-4">
          {/* Send Plan & Price Shortcut */}
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <Button size="sm" variant="outline" className="w-full">
              <FileText className="w-4 h-4 mr-2" />
              Send Plan & Price via WhatsApp
            </Button>
          </div>

          {/* Message Thread */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto p-4 bg-gray-50 rounded-lg">
            {whatsappMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === "sent" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    msg.type === "sent"
                      ? "bg-teal-600 text-white"
                      : msg.isUnread
                      ? "bg-white border-l-4 border-teal-500 shadow-sm"
                      : "bg-white shadow-sm"
                  }`}
                >
                  {msg.isUnread && (
                    <span className="text-xs font-semibold text-teal-600 block mb-1">
                      UNREAD
                    </span>
                  )}
                  <p className={`text-sm ${msg.type === "sent" ? "text-white" : "text-gray-900"}`}>
                    {msg.text}
                  </p>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span
                      className={`text-xs ${msg.type === "sent" ? "text-teal-100" : "text-gray-500"}`}
                    >
                      {msg.timestamp}
                    </span>
                    {msg.type === "sent" && msg.status && (
                      <span className="text-xs flex items-center gap-1">
                        {msg.status === "read" && (
                          <>
                            <Check className="w-3 h-3 text-blue-300" />
                            <Check className="w-3 h-3 text-blue-300 -ml-2" />
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Composer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Send Message</label>
              <Button variant="ghost" size="sm" className="text-teal-600">
                Use Template
              </Button>
            </div>
            <Textarea
              placeholder="Type your message..."
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <Send className="w-4 h-4 mr-2" />
              Send WhatsApp
            </Button>
          </div>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-4">
          {/* Send Plan & Price Shortcut */}
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <Button size="sm" variant="outline" className="w-full">
              <FileText className="w-4 h-4 mr-2" />
              Send Plan & Price via Email
            </Button>
          </div>

          {/* Email Thread */}
          <div className="space-y-2">
            {emailThreads.map((email) => (
              <div
                key={email.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">{email.subject}</h4>
                  <span className="text-xs text-gray-500">{email.timestamp}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{email.preview}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {email.status === "opened" ? "Opened" : "Sent"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Composer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Compose Email</label>
              <Button variant="ghost" size="sm" className="text-blue-600">
                Use Template
              </Button>
            </div>
            <input
              type="text"
              placeholder="Subject"
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
            <Textarea
              placeholder="Type your email message..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 mr-2" />
              Send Email
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
