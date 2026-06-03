Update GSTTransactionEntry.tsx to add the cascading sub-type selector
and integrate the TransactionTypeConfigurator modal.
 
Open src/app/components/gst/GSTTransactionEntry.tsx.
 
STEP 1 — Add new imports at the top:
  import { getSubTypesForParent, getSubTypeById } from "../../config/gstTransactionTypes";
  import type { TransactionSubType } from "../../config/gstTransactionTypes";
  import { TransactionTypeConfigurator } from "./TransactionTypeConfigurator";
 
STEP 2 — Add state variables inside the component function
(after the existing useState declarations):
  const [selectedSubType, setSelectedSubType] = useState<TransactionSubType | null>(null);
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [availableSubTypes, setAvailableSubTypes] = useState<TransactionSubType[]>([]);
 
STEP 3 — Add a useEffect that reloads sub-types when transactionType changes:
  useEffect(() => {
    if (formData.transactionType) {
      const subTypes = getSubTypesForParent(formData.transactionType);
      setAvailableSubTypes(subTypes);
      setSelectedSubType(null);  // reset sub-type when parent type changes
      setFormData(prev => ({
        ...prev,
        transactionSubType: undefined,
        transactionCategory: undefined,
        // Reset ITC eligibility based on new type — will be set when sub-type is chosen
      }));
    }
  }, [formData.transactionType]);
 
STEP 4 — Add a handler for sub-type selection:
  const handleSubTypeSelect = (subTypeId: string) => {
    if (subTypeId === "__configure__") {
      setShowConfigurator(true);
      return;
    }
    const subType = availableSubTypes.find(st => st.id === subTypeId) || null;
    setSelectedSubType(subType);
    if (subType) {
      setFormData(prev => ({
        ...prev,
        transactionSubType: subType.label,
        transactionCategory: subType.id,
        // Auto-set ITC eligibility based on sub-type
        itcEligible: subType.itcEligible,
        itcAmount: subType.itcEligible ? prev.totalTax : 0,
        // Auto-set HSN hint if provided
        hsnSacCode: subType.hsnHint && !prev.hsnSacCode ? subType.hsnHint : prev.hsnSacCode,
      }));
    }
  };
 
STEP 5 — Find the existing Transaction Type <select> in the JSX.
It is around line 248-258 in the file and looks like:
 
  <select
    value={formData.transactionType}
    onChange={e => setFormData(prev => ({...prev, transactionType: e.target.value as any}))}
  >
    <option value="Sale">Sale</option>
    <option value="Purchase">Purchase</option>
    <option value="Credit Note">Credit Note</option>
    <option value="Debit Note">Debit Note</option>
  </select>
 
Update the options to include "Expense" and add a label:
  <option value="Sale">Sale</option>
  <option value="Purchase">Purchase</option>
  <option value="Expense">Expense</option>
  <option value="Credit Note">Credit Note</option>
  <option value="Debit Note">Debit Note</option>
 
STEP 6 — Add the sub-type selector IMMEDIATELY AFTER the Transaction Type selector.
Insert this block right after the closing </div> of the Transaction Type field:
 
  {/* Sub-Type Selector — only shows if sub-types exist for this parent */}
  {availableSubTypes.length > 0 && (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        Sub-Type <span className="text-red-500">*</span>
        {selectedSubType && (
          <span className="ml-2 text-xs text-gray-500 font-normal">
            — {selectedSubType.accountHead}
          </span>
        )}
      </label>
      <select
        value={selectedSubType?.id || ""}
        onChange={e => handleSubTypeSelect(e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select sub-type...</option>
        {/* Group system defaults and custom types */}
        <optgroup label="Standard Categories">
          {availableSubTypes.filter(st => !st.isCustom).map(st => (
            <option key={st.id} value={st.id}>{st.label}</option>
          ))}
        </optgroup>
        {availableSubTypes.filter(st => st.isCustom).length > 0 && (
          <optgroup label="Custom Categories">
            {availableSubTypes.filter(st => st.isCustom).map(st => (
              <option key={st.id} value={st.id}>{st.label} ★</option>
            ))}
          </optgroup>
        )}
        <option value="__configure__">+ Configure New Sub-Type...</option>
      </select>
 
      {/* ITC eligibility indicator — shows after sub-type is selected */}
      {selectedSubType && (
        <div className={`mt-1 p-2 rounded text-xs flex items-start gap-2 ${
          selectedSubType.itcEligible
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-amber-50 border border-amber-200 text-amber-800"
        }`}>
          <span className="text-base leading-none">
            {selectedSubType.itcEligible ? "✓" : "⚠"}
          </span>
          <span>
            <strong>ITC: </strong>{selectedSubType.itcRule}
          </span>
        </div>
      )}
 
      {/* Description tooltip */}
      {selectedSubType?.description && (
        <p className="text-xs text-gray-500 mt-0.5 italic">
          {selectedSubType.description}
        </p>
      )}
    </div>
  )}
 
STEP 7 — Add TransactionTypeConfigurator modal to the JSX return.
Just before the closing </div> of the entire form, add:
 
  <TransactionTypeConfigurator
    open={showConfigurator}
    parentType={formData.transactionType || "Expense"}
    onClose={() => setShowConfigurator(false)}
    onConfirm={(newSubType) => {
      setAvailableSubTypes(prev => [...prev, newSubType]);
      setSelectedSubType(newSubType);
      setShowConfigurator(false);
      handleSubTypeSelect(newSubType.id);
    }}
  />
 
STEP 8 — Add "CUSTOM_TRANSACTION_SUB_TYPES" to DataService STORAGE_KEYS.
Open src/app/services/DataService.ts.
Add: CUSTOM_TRANSACTION_SUB_TYPES: "custom_transaction_sub_types",
