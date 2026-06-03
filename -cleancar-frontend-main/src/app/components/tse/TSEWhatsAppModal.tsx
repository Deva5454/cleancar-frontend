/**
 * TSEWhatsAppModal
 *
 * Opens when the TSE clicks "WhatsApp" on any lead row.
 * Picks a template, previews it, then opens wa.me deep-link
 * which works on both desktop (WhatsApp Web) and mobile.
 *
 * 5 templates:
 *   1. Introduction        – first contact
 *   2. Plan Price Quote    – auto-fills vehicle + pricing
 *   3. Callback Reminder   – pre-call reminder
 *   4. Special Offer       – urgency close
 *   5. Custom              – free-text
 */

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge }  from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Label }  from "../ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { MessageCircle, Send, Copy, ExternalLink, CheckCircle } from "lucide-react";
import type { TSELead } from "../../types/teleSalesExecutive.types";

// ── Types ─────────────────────────────────────────────────────────────────────
type TemplateKey = "INTRO" | "PRICE_QUOTE" | "CALLBACK_REMINDER" | "SPECIAL_OFFER" | "CUSTOM";

interface Template {
  key: TemplateKey;
  label: string;
  hint: string;
  build: (lead: TSELead) => string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const firstName = (lead: TSELead) => lead.customerName.split(" ")[0];

function vehicleLabel(lead: TSELead): string {
  if (lead.vehicleCategory) {
    return lead.vehicleCategory.charAt(0) + lead.vehicleCategory.slice(1).toLowerCase();
  }
  return lead.vehicleType === "2W" ? "bike" : "car";
}

function prices(lead: TSELead) {
  const is2W = lead.vehicleType === "2W";
  return {
    expressWash: is2W ? "₹699" : "₹1,249",
    smartWash:   is2W ? "₹899" : "₹1,599",
    eliteWash:   is2W ? "N/A" : "₹1,999",
    planNames: { p1: "Express Wash", p2: "Smart Wash", p3: "Elite Wash" },
    est:     `₹${lead.estimatedValue.toLocaleString("en-IN")}`,
  };
}

function cleanPhone(phone: string): string {
  return phone.replace(/\s+/g, "").replace(/^\+/, "");
}

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES: Template[] = [
  {
    key: "INTRO",
    label: "Introduction",
    hint: "First-time contact",
    build: (lead) => {
      const p = prices(lead);
      return `Hi ${firstName(lead)} 👋,

I'm calling from *249 Carwashing* — doorstep car wash, every day.

We noticed your interest in keeping your ${vehicleLabel(lead)} clean! 🚗✨

✅ Doorstep service daily
✅ Professional-grade products
✅ Trained & verified washers
✅ Plans starting at just *${p.expressWash}/month*

Can I take 2 minutes to share the best plan for your ${vehicleLabel(lead)}?

— 249 Carwashing Team`;
    },
  },
  {
    key: "PRICE_QUOTE",
    label: "Plan Price Quote",
    hint: "Auto-fills vehicle & pricing",
    build: (lead) => {
      const p = prices(lead);
      const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      return `Hi ${firstName(lead)},

Here are the plans for your *${vehicleLabel(lead)}* 🚗

━━━━━━━━━━━━━━━━━━
✨ *Express Wash* — ${p.expressWash}/month
   Daily water wash, tyre spray weekly, shampoo 1×/month, underbody flush

🛡️ *Smart Wash* — ${p.smartWash}/month
   + Shampoo 2×/month, interior vacuum 2×/month, tyre dressing monthly, car fragrance

👑 *Elite Wash* — ${p.eliteWash}/month
   + Shampoo weekly, dashboard fortnightly, hand wax + engine bay + premium fragrance monthly
━━━━━━━━━━━━━━━━━━

⭐ *Recommended for you:* ${p.est}/month

All plans include:
• Daily doorstep service
• Trained & verified washer
• No lock-in — cancel anytime

Ready to book? I'll set it up in 2 minutes! 🙌

— 249 Carwashing | ${today}`;
    },
  },
  {
    key: "CALLBACK_REMINDER",
    label: "Callback Reminder",
    hint: "Send before calling",
    build: (lead) => `Hi ${firstName(lead)},

Quick reminder from *249 Carwashing* 🔔

We have a callback scheduled for you today regarding your *${vehicleLabel(lead)} wash subscription*.

I'll call shortly — if it's not a good time, just reply and we'll reschedule. No problem at all! 😊

— 249 Carwashing Team`,
  },
  {
    key: "SPECIAL_OFFER",
    label: "Special Offer",
    hint: "Limited-time urgency close",
    build: (lead) => {
      const p = prices(lead);
      return `Hi ${firstName(lead)},

🎉 *Save with a Visit Pack!*

For your *${vehicleLabel(lead)}*, pre-buy visits and save 15%:

💧 *Pack of 4 Water Washes* — 15% off, valid 30 days
   ${p.planNames ? `H ₹680 · SUV ₹1,020 · Luxury ₹1,360` : "H ₹680 · SUV ₹1,020"}

🧴 *Pack of 4 Shampoo Washes* — 15% off, valid 30 days
   ${p.planNames ? `H ₹1,020 · SUV ₹1,180 · Luxury ₹1,700` : "H ₹1,020 · SUV ₹1,180"}

✨ *Pack of 4 Shampoo + Wax* — 15% off, valid 30 days
   H ₹1,360 · SUV ₹1,700 · Luxury ₹2,380

Or go daily with *Smart Wash* at ${p.smartWash}/month — same washer every morning, zero effort.
Pack of 2 also available at 8% off with 20-day validity.

Reply *YES* for details! 👇

— 249 Carwashing`;
    },
  },
  {
    key: "CUSTOM",
    label: "Custom Message",
    hint: "Write your own",
    build: (lead) => `Hi ${firstName(lead)},\n\n`,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
interface TSEWhatsAppModalProps {
  lead: TSELead | null;
  open: boolean;
  onClose: () => void;
}

export function TSEWhatsAppModal({ lead, open, onClose }: TSEWhatsAppModalProps) {
  const [selectedKey,  setSelectedKey]  = useState<TemplateKey>("PRICE_QUOTE");
  const [customText,   setCustomText]   = useState("");
  const [sent,         setSent]         = useState(false);

  const builtMessage = useMemo(() => {
    if (!lead) return "";
    return TEMPLATES.find(t => t.key === selectedKey)!.build(lead);
  }, [selectedKey, lead]);

  const displayMessage = selectedKey === "CUSTOM"
    ? (customText || (lead ? `Hi ${firstName(lead)},\n\n` : ""))
    : builtMessage;

  const handleTemplateChange = (key: TemplateKey) => {
    setSelectedKey(key);
    setSent(false);
    if (key === "CUSTOM") setCustomText(lead ? `Hi ${firstName(lead)},\n\n` : "");
  };

  const handleSend = () => {
    if (!lead) return;
    const url = `https://wa.me/${cleanPhone(lead.phone)}?text=${encodeURIComponent(displayMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSent(true);
    toast.success(`WhatsApp opened for ${lead.customerName}`, {
      description: "Message is pre-filled — press Send in WhatsApp.",
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(displayMessage).then(() => {
      toast.success("Message copied to clipboard");
    });
  };

  const handleClose = () => { onClose(); setSent(false); };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <MessageCircle className="w-5 h-5" />
            Send WhatsApp Message
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-700">{lead.customerName}</span>
            <span className="text-gray-400">·</span>
            <span className="font-mono text-sm">{lead.phone}</span>
            <span className="text-gray-400">·</span>
            <Badge variant="outline">{lead.vehicleCategory ?? lead.vehicleType}</Badge>
            <Badge variant="outline" className={
              lead.priority === "URGENT" ? "border-red-400 text-red-700" :
              lead.priority === "HIGH"   ? "border-orange-400 text-orange-700" :
              "border-gray-300 text-gray-600"
            }>
              {lead.priority}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">

          {/* Template selector */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Template</Label>
            <Select value={selectedKey} onValueChange={v => handleTemplateChange(v as TemplateKey)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map(t => (
                  <SelectItem key={t.key} value={t.key}>
                    <span className="font-medium">{t.label}</span>
                    <span className="text-xs text-gray-400 ml-2">— {t.hint}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {selectedKey === "CUSTOM" ? "Your Message" : "Preview"}
              </Label>
              <span className="text-xs text-gray-400">{displayMessage.length} chars</span>
            </div>

            {selectedKey === "CUSTOM" ? (
              <Textarea
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                placeholder="Type your message here…"
                rows={12}
                className="font-mono text-sm resize-none"
              />
            ) : (
              /* WhatsApp bubble preview */
              <div className="relative pl-3">
                <div className="bg-[#dcf8c6] border border-green-200 rounded-xl rounded-tl-none
                                p-4 text-sm whitespace-pre-wrap leading-relaxed
                                max-h-64 overflow-y-auto shadow-sm font-sans">
                  {displayMessage}
                </div>
                {/* bubble tail */}
                <div className="absolute top-0 left-0 w-0 h-0
                                border-r-[12px] border-r-[#dcf8c6]
                                border-b-[12px] border-b-transparent" />
              </div>
            )}
          </div>

          {/* Tip */}
          <p className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-md leading-relaxed">
            💡 <strong>Open WhatsApp</strong> launches WhatsApp Web (or the mobile app) with this
            message pre-filled. Review it once and press <em>Send</em> in WhatsApp.
          </p>

          {/* Success banner */}
          {sent && (
            <div className="flex items-center gap-2 text-sm text-green-700
                            bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              WhatsApp opened. Message is pre-filled — press Send there.
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              onClick={handleSend}
              className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
            >
              {sent
                ? <><CheckCircle className="w-4 h-4" />Open Again</>
                : <><ExternalLink className="w-4 h-4" />Open WhatsApp</>
              }
            </Button>
            <Button variant="outline" onClick={handleCopy} className="gap-2">
              <Copy className="w-4 h-4" />Copy
            </Button>
            <Button variant="ghost" onClick={handleClose}>Close</Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
