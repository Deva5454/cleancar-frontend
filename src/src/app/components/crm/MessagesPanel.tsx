/**
 * In-App WhatsApp & Email Communication Center
 * Part 3 - Messages Panel with Conversation Threads
 */

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { 
  X, Search, Send, MessageCircle, Mail, Check, CheckCheck, 
  ChevronLeft, FileText, Clock, Filter
} from "lucide-react";
import { toast } from "sonner";

type MessageChannel = "WhatsApp" | "Email" | "Both";
type MessageStatus = "Sent" | "Delivered" | "Read" | "Opened";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  channel: "WhatsApp" | "Email";
  status: MessageStatus;
  isOutbound: boolean;
  templateUsed?: string;
}

interface ConversationThread {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  leadStage: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  channel: "WhatsApp" | "Email";
  messages: Message[];
}

interface CommunicationTemplate {
  id: string;
  name: string;
  category: "Plan & Pricing" | "Demo Confirmation" | "Follow-Up" | "Booking Confirmation" | "Welcome";
  channel: MessageChannel;
  whatsappContent?: string;
  emailContent?: string;
  emailSubject?: string;
}

const DEMO_TEMPLATES: CommunicationTemplate[] = [
  {
    id: "TPL001",
    name: "Plan & Pricing - WhatsApp",
    category: "Plan & Pricing",
    channel: "WhatsApp",
    whatsappContent: "Hi [Customer Name], Thank you for your interest in CleanCar 360°! Here are the details for the [Plan Name] plan for your [Vehicle Category]:\n\n✅ Monthly Price: ₹[Monthly Price]\n\nWhat's included:\n• Weekly exterior wash\n• Interior vacuuming\n• Dashboard cleaning\n• Tire shine\n• Complimentary air freshener\n\n🎁 Special: First wash free!\n\n📞 To book or ask questions, reply to this message or call us.\n\n— [TSE Name], CleanCar 360°"
  },
  {
    id: "TPL002",
    name: "Demo Confirmation",
    category: "Demo Confirmation",
    channel: "Both",
    whatsappContent: "Hi [Customer Name], your free demo wash is confirmed for [Demo Date] at [Demo Time Slot]. Our team will arrive at your location.\n\nVehicle: [Vehicle Category]\n\nFeel free to reply with any questions.\n\n— [TSE Name], CleanCar 360°",
    emailSubject: "Demo Wash Confirmed - [Demo Date]",
    emailContent: "Dear [Customer Name],\n\nYour free demo wash is confirmed!\n\nDate: [Demo Date]\nTime: [Demo Time Slot]\nVehicle: [Vehicle Category]\n\nOur team will arrive at your location at the scheduled time.\n\nLooking forward to serving you!\n\nBest regards,\n[TSE Name]\nCleanCar 360°"
  },
  {
    id: "TPL003",
    name: "Follow-Up after Demo",
    category: "Follow-Up",
    channel: "Both",
    whatsappContent: "Hi [Customer Name], we hope you enjoyed your free demo wash! 🚗✨\n\nWe'd love to have you as a CleanCar 360° member. The [Plan Name] for your [Vehicle Category] is just ₹[Monthly Price]/month.\n\nReply YES to confirm your booking or let us know your questions.\n\n— [TSE Name]",
    emailSubject: "Enjoyed your demo? Let's continue!",
    emailContent: "Dear [Customer Name],\n\nWe hope you enjoyed your free demo wash with CleanCar 360°!\n\nThe [Plan Name] for your [Vehicle Category] is available at just ₹[Monthly Price]/month.\n\nReply to this email to confirm your booking or if you have any questions.\n\nBest regards,\n[TSE Name]\nCleanCar 360°"
  },
  {
    id: "TPL004",
    name: "Booking Confirmation",
    category: "Booking Confirmation",
    channel: "Both",
    whatsappContent: "Hi [Customer Name], welcome to CleanCar 360°! 🎉\n\nYour [Plan Name] subscription is confirmed. Your first wash will be on [Demo Date].\n\nSee you then!\n\n— [TSE Name]",
    emailSubject: "Welcome to CleanCar 360° - Subscription Confirmed!",
    emailContent: "Dear [Customer Name],\n\nWelcome to the CleanCar 360° family!\n\nYour [Plan Name] subscription is now active.\nFirst wash scheduled: [Demo Date]\n\nThank you for choosing us!\n\nBest regards,\n[TSE Name]\nCleanCar 360°"
  }
];

const DEMO_CONVERSATIONS: ConversationThread[] = [
  {
    id: "CONV001",
    customerId: "LD001",
    customerName: "Arjun Patel",
    customerPhone: "+91 99887 76655",
    customerEmail: "arjun.patel@example.com",
    leadStage: "Demo Scheduled",
    lastMessage: "Thanks! Looking forward to the demo.",
    lastMessageTime: "2026-03-16 14:30",
    unreadCount: 1,
    channel: "WhatsApp",
    messages: [
      {
        id: "MSG001",
        content: "Hi Arjun Patel, your free demo wash is confirmed for 2026-03-18 at Morning 7–9 AM. Our team will arrive at your location. Vehicle: Sedan. Feel free to reply with any questions. — Neha Singh, CleanCar 360°",
        timestamp: "2026-03-16 10:15",
        channel: "WhatsApp",
        status: "Read",
        isOutbound: true,
        templateUsed: "Demo Confirmation"
      },
      {
        id: "MSG002",
        content: "Thanks! Looking forward to the demo.",
        timestamp: "2026-03-16 14:30",
        channel: "WhatsApp",
        status: "Delivered",
        isOutbound: false
      }
    ]
  },
  {
    id: "CONV002",
    customerId: "LD002",
    customerName: "Sneha Desai",
    customerPhone: "+91 99887 76656",
    customerEmail: "sneha.desai@example.com",
    leadStage: "Qualified",
    lastMessage: "Can you send me the pricing details?",
    lastMessageTime: "2026-03-16 16:45",
    unreadCount: 2,
    channel: "WhatsApp",
    messages: [
      {
        id: "MSG003",
        content: "Hi Sneha Desai, Thank you for your interest in CleanCar 360°! Here are the details for the Gold Monthly plan for your SUV: ✅ Monthly Price: ₹4999 | What's included: Weekly exterior wash, Interior vacuuming, Dashboard cleaning, Tire shine, Complimentary air freshener | 🎁 Special: First wash free! — Neha Singh, CleanCar 360°",
        timestamp: "2026-03-16 11:20",
        channel: "WhatsApp",
        status: "Read",
        isOutbound: true,
        templateUsed: "Plan & Pricing"
      },
      {
        id: "MSG004",
        content: "Can you send me the pricing details?",
        timestamp: "2026-03-16 16:45",
        channel: "WhatsApp",
        status: "Delivered",
        isOutbound: false
      }
    ]
  }
];

interface MessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MessagesPanel({ isOpen, onClose }: MessagesPanelProps) {
  const [conversations] = useState<ConversationThread[]>(DEMO_CONVERSATIONS);
  const [selectedConversation, setSelectedConversation] = useState<ConversationThread | null>(null);
  const [messageText, setMessageText] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<MessageChannel>("Both");
  const [showTemplates, setShowTemplates] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState<"All" | "WhatsApp" | "Email">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Unread" | "Awaiting Reply">("All");

  if (!isOpen) return null;

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      toast.error("Please enter a message");
      return;
    }

    toast.success("Message sent via " + selectedChannel, {
      description: "Your message has been delivered to the customer"
    });
    setMessageText("");
  };

  const handleUseTemplate = (template: CommunicationTemplate) => {
    const content = selectedChannel === "Email" 
      ? template.emailContent 
      : template.whatsappContent;
    setMessageText(content || "");
    setShowTemplates(false);
    toast.success("Template loaded", {
      description: "You can edit the message before sending"
    });
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchTerm || 
      conv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = channelFilter === "All" || conv.channel === channelFilter;
    const matchesStatus = statusFilter === "All" || 
      (statusFilter === "Unread" && conv.unreadCount > 0) ||
      (statusFilter === "Awaiting Reply" && conv.messages[conv.messages.length - 1].isOutbound);
    
    return matchesSearch && matchesChannel && matchesStatus;
  });

  const getStatusIcon = (status: MessageStatus, channel: string) => {
    if (channel === "WhatsApp") {
      if (status === "Read") return <CheckCheck className="w-3 h-3 text-blue-500" />;
      if (status === "Delivered") return <CheckCheck className="w-3 h-3 text-gray-400" />;
      return <Check className="w-3 h-3 text-gray-400" />;
    }
    return status === "Opened" ? <Check className="w-3 h-3 text-blue-500" /> : <Clock className="w-3 h-3 text-gray-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="w-full max-w-[480px] bg-white shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="bg-[#00C896] text-white p-4 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {selectedConversation && (
              <button onClick={() => setSelectedConversation(null)}>
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <MessageCircle className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold">
                {selectedConversation ? selectedConversation.customerName : "Messages"}
              </h2>
              {selectedConversation && (
                <p className="text-xs text-white/80">
                  {selectedConversation.customerPhone} • {selectedConversation.customerEmail}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation List View */}
        {!selectedConversation && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Search & Filters */}
            <div className="p-4 border-b space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value as any)}
                  className="text-xs border rounded px-2 py-1 flex-1"
                >
                  <option value="All">All Channels</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs border rounded px-2 py-1 flex-1"
                >
                  <option value="All">All Status</option>
                  <option value="Unread">Unread</option>
                  <option value="Awaiting Reply">Awaiting Reply</option>
                </select>
              </div>
            </div>

            {/* Conversation Threads */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageCircle className="w-16 h-16 mb-2" />
                  <p>No conversations found</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className="w-full p-4 border-b hover:bg-gray-50 text-left flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                      {conv.channel === "WhatsApp" ? (
                        <MessageCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Mail className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm truncate">{conv.customerName}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(conv.lastMessageTime).toLocaleTimeString('en-IN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate mb-1">{conv.lastMessage}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{conv.leadStage}</Badge>
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-red-500 text-white text-xs">
                            {conv.unreadCount} new
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Conversation View */}
        {selectedConversation && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Conversation Header */}
            <div className="p-3 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{selectedConversation.leadStage}</Badge>
                <Button size="sm" variant="outline" className="text-xs">
                  View Lead
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isOutbound ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.isOutbound
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div className="flex items-center justify-end gap-1 mt-2">
                      <span className="text-xs opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {msg.isOutbound && getStatusIcon(msg.status, msg.channel)}
                    </div>
                    {msg.templateUsed && (
                      <div className="text-xs opacity-70 mt-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {msg.templateUsed}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Template Selector */}
            {showTemplates && (
              <div className="border-t bg-gray-50 p-4 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Message Templates</h3>
                  <button onClick={() => setShowTemplates(false)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {DEMO_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleUseTemplate(template)}
                      className="w-full p-3 border rounded-lg hover:bg-white text-left"
                    >
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {template.whatsappContent?.substring(0, 100)}...
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {template.category}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Composer */}
            <div className="border-t p-4 space-y-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={showTemplates ? "default" : "outline"}
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-xs"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Templates
                </Button>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value as MessageChannel)}
                  className="text-xs border rounded px-2 py-1"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 min-h-[80px]"
                />
                <Button onClick={handleSendMessage} className="bg-[#00C896] hover:bg-[#00B085]">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
