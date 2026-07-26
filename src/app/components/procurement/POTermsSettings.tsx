import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from "lucide-react";
import { toast } from "sonner";
import {
  getTermsTemplate,
  saveTermsTemplate,
  type POTermTerm,
} from "../../services/poTermsTemplateService";

/**
 * Real, editable "Other Terms & Conditions" template screen.
 *
 * Editing here only affects POs created AFTER a save — every PO already
 * issued keeps the exact terms it was created with (a real snapshot,
 * copied at creation time, not a live link to this template). See
 * poTermsTemplateService.ts for why that matters: an already-issued PO is
 * a real, signed business document and must not silently reword itself
 * later just because the template changed.
 */
export function POTermsSettings() {
  const [terms, setTerms] = useState<POTermTerm[]>(() => getTermsTemplate().terms);
  const [dirty, setDirty] = useState(false);

  const genId = () => `term-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const handleAdd = () => {
    setTerms([...terms, { id: genId(), text: "" }]);
    setDirty(true);
  };

  const handleDelete = (id: string) => {
    setTerms(terms.filter((t) => t.id !== id));
    setDirty(true);
  };

  const handleTextChange = (id: string, text: string) => {
    setTerms(terms.map((t) => (t.id === id ? { ...t, text } : t)));
    setDirty(true);
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= terms.length) return;
    const updated = [...terms];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setTerms(updated);
    setDirty(true);
  };

  const handleSave = () => {
    const cleaned = terms.filter((t) => t.text.trim().length > 0);
    if (cleaned.length === 0) {
      toast.error("At least one term is required before saving.");
      return;
    }
    saveTermsTemplate(cleaned, "Admin");
    setTerms(cleaned);
    setDirty(false);
    toast.success("PO Terms & Conditions updated. This applies to POs created from now on — already-issued POs are unaffected.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">PO Terms &amp; Conditions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edit the "Other Terms &amp; Conditions" text that appears on every new Purchase Order PDF.
          Changes here do not alter any PO that has already been created.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Terms (in order)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {terms.map((term, index) => (
            <div key={term.id} className="flex items-start gap-2">
              <span className="text-sm text-gray-500 mt-2 w-6">{index + 1}.</span>
              <Textarea
                value={term.text}
                onChange={(e) => handleTextChange(term.id, e.target.value)}
                rows={2}
                className="flex-1"
                placeholder="Enter term text..."
              />
              <div className="flex flex-col gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleMove(index, -1)} disabled={index === 0}>
                  <ArrowUp className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleMove(index, 1)} disabled={index === terms.length - 1}>
                  <ArrowDown className="w-3.5 h-3.5" />
                </Button>
              </div>
              <Button variant="outline" size="icon" className="h-7 w-7 text-red-600" onClick={() => handleDelete(term.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}

          {terms.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No terms yet — add at least one before saving.</p>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <Button variant="outline" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Term
            </Button>
            <Button onClick={handleSave} disabled={!dirty}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
