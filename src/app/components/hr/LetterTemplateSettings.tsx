/**
 * LetterTemplateSettings.tsx — real, previously-missing screen: HR or
 * Super Admin can replace the real letterhead image (applies to both
 * Offer and Confirmation letters immediately, no code change needed),
 * and edit the real template-level default wording for each letter
 * type - genuinely separate from editing one specific letter, which
 * already exists elsewhere and stays untouched.
 *
 * The offer letter side edits the same real values
 * offerLetterPolicyConfig.ts's buildOfferLetterDefaults() already used -
 * not a second, separate set of defaults.
 */

import { useState, useRef } from "react";
import { useRole } from "../../contexts/RoleContext";
import {
  getLetterheadImage, setLetterheadImage, resetLetterheadToDefault,
  getEffectiveCompanyInfo, getEffectiveSignee, getEffectiveTierTerms,
  getEffectiveConditionsOfOffer, getEffectiveConditionalNote, getEffectiveClosingText,
  getEffectiveAcceptanceDeadlineDays, getEffectiveWorkingHours, saveOfferLetterPolicyOverride,
  getEffectiveDocumentChecklist, type DocumentChecklistCategory,
  getConfirmationLetterTemplate, saveConfirmationLetterTemplate, type ConfirmationLetterTemplate,
  type OfferRoleTier,
} from "../../services/letterTemplateService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { ImageIcon, FileText, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";

const TIERS: OfferRoleTier[] = ["Entry", "Supervisory", "Management"];

export function LetterTemplateSettings() {
  const { currentUser, currentRole } = useRole();
  const canEdit = currentRole === "HR" || currentRole === "Super Admin";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const letterhead = getLetterheadImage();

  const handleLetterheadUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Please use an image under 3MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLetterheadImage(reader.result as string);
      toast.success("Real letterhead updated — every letter generated from now on will use this");
      setRefreshTick((t) => t + 1);
    };
    reader.readAsDataURL(file);
  };

  const handleResetLetterhead = () => {
    resetLetterheadToDefault();
    toast.success("Letterhead reset to the original default");
    setRefreshTick((t) => t + 1);
  };

  // Real, effective offer letter policy state — seeded from the actual
  // current effective values (default or existing HR override).
  const [companyInfo, setCompanyInfo] = useState(getEffectiveCompanyInfo());
  const [signee, setSignee] = useState(getEffectiveSignee());
  const [tierTerms, setTierTerms] = useState(getEffectiveTierTerms());
  const [conditions, setConditions] = useState<string[]>(getEffectiveConditionsOfOffer());
  const [conditionalNote, setConditionalNote] = useState(getEffectiveConditionalNote());
  const [workingHours, setWorkingHours] = useState(getEffectiveWorkingHours());
  const [closingText, setClosingText] = useState(getEffectiveClosingText());
  const [acceptanceDays, setAcceptanceDays] = useState(getEffectiveAcceptanceDeadlineDays());
  const [documentChecklist, setDocumentChecklist] = useState<DocumentChecklistCategory[]>(getEffectiveDocumentChecklist());

  const handleSaveOfferPolicy = () => {
    saveOfferLetterPolicyOverride({
      companyInfo, signee, tierTerms, conditionsOfOffer: conditions,
      conditionalNote, closingText, acceptanceDeadlineDays: acceptanceDays, workingHours, documentChecklist,
    }, currentUser?.name || "HR");
    toast.success("Real offer letter template saved — every new offer letter from now on uses this");
  };

  const updateChecklistCategory = (idx: number, category: string) => {
    const next = [...documentChecklist];
    next[idx] = { ...next[idx], category };
    setDocumentChecklist(next);
  };
  const updateChecklistItems = (idx: number, itemsText: string) => {
    const next = [...documentChecklist];
    next[idx] = { ...next[idx], items: itemsText.split("\n").map((s) => s.trim()).filter(Boolean) };
    setDocumentChecklist(next);
  };
  const addChecklistCategory = () => setDocumentChecklist([...documentChecklist, { category: "", items: [] }]);
  const removeChecklistCategory = (idx: number) => setDocumentChecklist(documentChecklist.filter((_, i) => i !== idx));

  const updateCondition = (idx: number, value: string) => {
    const next = [...conditions];
    next[idx] = value;
    setConditions(next);
  };
  const addCondition = () => setConditions([...conditions, ""]);
  const removeCondition = (idx: number) => setConditions(conditions.filter((_, i) => i !== idx));

  const updateTier = (tier: OfferRoleTier, field: keyof typeof tierTerms[OfferRoleTier], value: number) => {
    setTierTerms({ ...tierTerms, [tier]: { ...tierTerms[tier], [field]: value } });
  };

  // Confirmation letter template state
  const [confirmTemplate, setConfirmTemplate] = useState<ConfirmationLetterTemplate>(getConfirmationLetterTemplate());
  const handleSaveConfirmTemplate = () => {
    saveConfirmationLetterTemplate(confirmTemplate, currentUser?.name || "HR");
    toast.success("Real confirmation letter template saved — every new confirmation letter from now on uses this");
  };

  if (!canEdit) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-gray-500">
          Only HR or Super Admin can edit letter templates.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-600" /> Real Letterhead
          </CardTitle>
          <p className="text-xs text-gray-500">Used on both Offer Letters and Confirmation Letters — replace it any time, no code change needed</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <img src={letterhead} alt="Current real letterhead" className="border rounded w-48" />
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLetterheadUpload} className="hidden" />
            <Button size="sm" onClick={() => fileInputRef.current?.click()}>Upload New Letterhead</Button>
            <Button size="sm" variant="outline" onClick={handleResetLetterhead}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Offer Letter — Real Template
          </CardTitle>
          <p className="text-xs text-gray-500">
            This is the real default every NEW offer letter starts from — genuinely different from editing one specific letter already open.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Company Name</Label>
              <Input value={companyInfo.name} onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })} />
            </div>
            <div>
              <Label>Company Address (footer)</Label>
              <Input value={companyInfo.address} onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Conditional Offer Note</Label>
            <Textarea rows={2} value={conditionalNote} onChange={(e) => setConditionalNote(e.target.value)} />
          </div>

          <div>
            <Label>Probation & Notice Terms — by role tier</Label>
            <div className="space-y-2 mt-2">
              {TIERS.map((tier) => (
                <div key={tier} className="border rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">{tier}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Probation (months)</Label>
                      <Input type="number" min="0" value={tierTerms[tier].probationMonths}
                        onChange={(e) => updateTier(tier, "probationMonths", parseInt(e.target.value, 10) || 0)} />
                    </div>
                    <div>
                      <Label className="text-xs">Notice — During Probation (months)</Label>
                      <Input type="number" min="0" value={tierTerms[tier].noticeDuringProbationMonths}
                        onChange={(e) => updateTier(tier, "noticeDuringProbationMonths", parseInt(e.target.value, 10) || 0)} />
                    </div>
                    <div>
                      <Label className="text-xs">Notice — Post Confirmation (months)</Label>
                      <Input type="number" min="0" value={tierTerms[tier].noticeAfterConfirmationMonths}
                        onChange={(e) => updateTier(tier, "noticeAfterConfirmationMonths", parseInt(e.target.value, 10) || 0)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Conditions of Offer</Label>
            {conditions.map((c, idx) => (
              <div key={idx} className="flex items-start gap-2 mt-2">
                <Textarea rows={2} value={c} onChange={(e) => updateCondition(idx, e.target.value)} className="flex-1" />
                <Button size="sm" variant="ghost" onClick={() => removeCondition(idx)}><X className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button size="sm" variant="outline" className="mt-2" onClick={addCondition}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Condition
            </Button>
          </div>

          <div>
            <Label>Closing Paragraph</Label>
            <Textarea rows={2} value={closingText} onChange={(e) => setClosingText(e.target.value)} />
          </div>

          <div>
            <Label>Acceptance Deadline (working days)</Label>
            <Input type="number" min="1" className="w-32" value={acceptanceDays}
              onChange={(e) => setAcceptanceDays(parseInt(e.target.value, 10) || 2)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Signatory Name</Label>
              <Input value={signee.name} onChange={(e) => setSignee({ ...signee, name: e.target.value })} />
            </div>
            <div>
              <Label>Signatory Title</Label>
              <Input value={signee.title} onChange={(e) => setSignee({ ...signee, title: e.target.value })} />
            </div>
            <div>
              <Label>Signatory Email</Label>
              <Input value={signee.email} onChange={(e) => setSignee({ ...signee, email: e.target.value })} />
            </div>
            <div>
              <Label>Signatory Phone</Label>
              <Input value={signee.phone} onChange={(e) => setSignee({ ...signee, phone: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Documents to Bring on Joining (original + photocopy)</Label>
            {documentChecklist.map((cat, idx) => (
              <div key={idx} className="border rounded-lg p-3 mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Input value={cat.category} onChange={(e) => updateChecklistCategory(idx, e.target.value)} placeholder="Category name" className="flex-1" />
                  <Button size="sm" variant="ghost" onClick={() => removeChecklistCategory(idx)}><X className="w-4 h-4" /></Button>
                </div>
                <Textarea rows={3} value={cat.items.join("\n")} onChange={(e) => updateChecklistItems(idx, e.target.value)} placeholder="One item per line" />
              </div>
            ))}
            <Button size="sm" variant="outline" className="mt-2" onClick={addChecklistCategory}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Category
            </Button>
          </div>

          <Button onClick={handleSaveOfferPolicy}>Save Offer Letter Template</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Confirmation Letter — Real Template
          </CardTitle>
          <p className="text-xs text-gray-500">The real default every NEW confirmation letter starts from.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Introduction Paragraph</Label>
            <Textarea rows={3} value={confirmTemplate.introText} onChange={(e) => setConfirmTemplate({ ...confirmTemplate, introText: e.target.value })} />
          </div>
          <div>
            <Label>Closing Paragraph</Label>
            <Textarea rows={2} value={confirmTemplate.closingText} onChange={(e) => setConfirmTemplate({ ...confirmTemplate, closingText: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Signatory Name</Label>
              <Input value={confirmTemplate.signatoryName} onChange={(e) => setConfirmTemplate({ ...confirmTemplate, signatoryName: e.target.value })} />
            </div>
            <div>
              <Label>Signatory Title</Label>
              <Input value={confirmTemplate.signatoryTitle} onChange={(e) => setConfirmTemplate({ ...confirmTemplate, signatoryTitle: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Company Address (footer)</Label>
            <Input value={confirmTemplate.companyAddress} onChange={(e) => setConfirmTemplate({ ...confirmTemplate, companyAddress: e.target.value })} />
          </div>
          <Button onClick={handleSaveConfirmTemplate}>Save Confirmation Letter Template</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default LetterTemplateSettings;
