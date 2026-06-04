# TSM Module - Coding Standards Implementation

This document summarizes the coding standards applied to the Tele Sales Manager (TSM) module and provides patterns for completing the remaining components.

## ✅ Completed Components

### 1. Constants File (`teleSalesManager.constants.ts`)
**Status**: ✅ Complete

Created centralized constants file with:
- SLA thresholds (10min first call, 30min CRM update)
- Conversion rate thresholds (45% target, 35% warning, 30% critical)
- EBITDA thresholds (25% healthy, 20% warning, 18% critical)
- Renewal rate thresholds (70% target, 60% warning, 50% critical)
- CRM compliance thresholds (90% target, 80% warning, 70% critical)
- Revenue thresholds (100% on track, 85% warning, 80% critical)
- Auto-escalation times
- Refresh intervals
- Display limits
- Time mode hours
- Deal value defaults
- Status and severity colors
- Touch target size (44px for mobile)
- Grid system (8px)

### 2. TSMCommandDashboard.tsx
**Status**: ✅ Complete

**Applied Standards**:
- ✅ JSDoc comments on component and all functions
- ✅ Replaced magic numbers with constants (CONVERSION_THRESHOLDS, REVENUE_THRESHOLDS, DEAL_VALUE_DEFAULTS)
- ✅ Error handling (null check for metrics)
- ✅ Accessibility attributes:
  - `role="button"` on clickable cards
  - `tabIndex={0}` for keyboard navigation
  - `aria-label` with descriptive text
  - `onKeyDown` handlers for Enter and Space keys
  - `aria-hidden="true"` on decorative icons
- ✅ Edge case handling (division by zero in win rate calculation)
- ✅ Proper TypeScript types (interface with JSDoc)
- ✅ Clean helper functions (getConversionStatus, getRevenueStatus, getSLAStatus)

**Pattern Example**:
```typescript
// ✅ Good - Accessible interactive card
<Card
  className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
  onClick={onOpenSLABreaches}
  role="button"
  tabIndex={0}
  aria-label={`View SLA breaches. ${metrics.slaBreachesToday} breaches today. Status: ${slaStatus}`}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpenSLABreaches?.();
    }
  }}
>
  <Clock className="w-5 h-5 text-red-600" aria-hidden="true" />
  {/* ... */}
</Card>

// ✅ Good - Division by zero protection
{metrics.leadStages.converted + metrics.leadStages.lost > 0
  ? (
      (metrics.leadStages.converted /
        (metrics.leadStages.converted + metrics.leadStages.lost)) *
      100
    ).toFixed(1)
  : "0.0"}
```

### 3. TeleSalesManagerApp.tsx
**Status**: ✅ Complete

**Applied Standards**:
- ✅ JSDoc comments on component and all functions
- ✅ Replaced magic numbers with constants (TIME_MODE_HOURS, REFRESH_INTERVALS)
- ✅ Removed console.log statement
- ✅ Proper TypeScript types (TimeMode type)
- ✅ Accessibility attributes:
  - `role="alert"` on critical banner
  - `aria-live="assertive"` for urgent alerts
  - `aria-atomic="true"` for screen readers
  - `aria-label` on tabs with dynamic context
  - `aria-hidden="true"` on all decorative icons
- ✅ Clean helper function (getTimeMode)
- ✅ Proper useEffect cleanup

**Pattern Example**:
```typescript
// ✅ Good - Accessible alert banner
<div
  className="bg-red-600 text-white sticky top-0 z-50 animate-pulse"
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
>
  <AlertTriangle className="w-5 h-5 animate-bounce" aria-hidden="true" />
  <span className="font-semibold">
    CRITICAL PIPELINE ALERTS REQUIRE IMMEDIATE ACTION
  </span>
</div>

// ✅ Good - Constants usage
useEffect(() => {
  const timer = setInterval(() => {
    setAlerts(teleSalesManagerService.getSystemAlerts());
  }, REFRESH_INTERVALS.ALERTS); // Instead of hardcoded 30000
  return () => clearInterval(timer);
}, []);
```

---

## 📋 Remaining Components (Pattern to Follow)

### Component Checklist

For each remaining component, apply these standards:

#### 1. **Functionality & Logic**
- [ ] Remove all `console.log()` statements
- [ ] Remove all `// TODO` comments
- [ ] Add error handling for all data fetching
- [ ] Handle loading states
- [ ] Handle empty states
- [ ] Handle null/undefined edge cases

#### 2. **JSDoc Documentation**
```typescript
/**
 * Component Name - Brief Description
 *
 * Detailed description of what this component does and its purpose.
 * Include any important usage notes or context.
 *
 * @component
 */

/**
 * Props for ComponentName
 */
interface ComponentNameProps {
  /** Description of what this prop does */
  propName: PropType;
}

/**
 * Calculates something important
 * @param value - The input value
 * @returns Calculated result
 */
const helperFunction = (value: number): number => {
  // implementation
};
```

#### 3. **Constants Usage**
Replace all magic numbers and strings:
```typescript
// ❌ Bad
if (score >= 90) { ... }
if (leads.new > 30) { ... }
setTimeout(() => {}, 30000);

// ✅ Good
import { CRM_COMPLIANCE_THRESHOLDS, REFRESH_INTERVALS } from "../../constants/teleSalesManager.constants";

if (score >= CRM_COMPLIANCE_THRESHOLDS.TARGET) { ... }
if (leads.new > DISPLAY_LIMITS.HIGH_VOLUME_THRESHOLD) { ... }
setTimeout(() => {}, REFRESH_INTERVALS.ALERTS);
```

#### 4. **Accessibility**
Every interactive element must have:
```typescript
// ✅ Clickable cards
<Card
  onClick={handleClick}
  role="button"
  tabIndex={0}
  aria-label="Descriptive label of what happens on click"
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }}
>
  {/* content */}
</Card>

// ✅ Decorative icons
<Icon className="w-5 h-5" aria-hidden="true" />

// ✅ Alert regions
<div role="alert" aria-live="polite">
  {alertMessage}
</div>

// ✅ Buttons with icons
<Button aria-label="Descriptive action">
  <Icon className="w-4 h-4" aria-hidden="true" />
  Button Text
</Button>
```

#### 5. **Error Handling**
```typescript
// ✅ Null checks
const data = service.getData();
if (!data) {
  return (
    <Card className="p-8 text-center">
      <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
      <p className="text-gray-700">Unable to load data. Please try again.</p>
    </Card>
  );
}

// ✅ Empty state handling
if (items.length === 0) {
  return (
    <Card className="p-8 text-center">
      <div className="text-gray-500">No items to display</div>
    </Card>
  );
}

// ✅ Division by zero protection
const percentage = total > 0 ? (value / total) * 100 : 0;
```

#### 6. **TypeScript Types**
```typescript
// ✅ Explicit prop types
interface ComponentProps {
  data: DataType;
  onAction?: (id: string) => void;
}

// ✅ Typed state
const [selected, setSelected] = useState<string | null>(null);

// ✅ Typed functions
const handleClick = (id: string): void => {
  // implementation
};

// ❌ Avoid 'any'
const process = (data: any) => { ... } // BAD

// ✅ Use specific types
const process = (data: TSMMetrics) => { ... } // GOOD
```

#### 7. **Responsive Design**
```typescript
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* content */}
</div>

// Touch targets minimum 44x44px on mobile
<button className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0">
  {/* content */}
</button>

// Prevent horizontal scroll on mobile
<div className="overflow-x-auto">
  <table className="min-w-full">
    {/* content */}
  </table>
</div>
```

---

## 🔧 Specific Component Guidance

### TSMTeamPerformance.tsx
- Add error handling for empty TSE list
- Add aria-labels to TSE cards
- Replace hardcoded thresholds with constants
- Add JSDoc to getStatusIcon, getStatusColor, getHealthColor

### TSMLeadPipeline.tsx
- Add error handling for empty leads
- Add aria-labels to filter buttons
- Replace magic numbers (10 attempts, 30 leads warning)
- Add keyboard navigation to lead cards
- Handle division by zero in stats calculations

### TSMPricingAudit.tsx
- Add error handling for empty audit log
- Add aria-labels to filter buttons
- Replace EBITDA thresholds with constants
- Add keyboard navigation to audit entries

### TSMRenewalDashboard.tsx
- Add error handling for empty renewals
- Add aria-labels to urgency/status filters
- Replace renewal thresholds with constants
- Handle division by zero in success rate

### TSMIncentiveTracker.tsx
- Add error handling for empty incentive data
- Replace magic percentages with constants
- Add aria-labels to charts/visualizations
- Handle division by zero in composition percentages

### TSMReportsAnalytics.tsx
- Add error handling for empty analytics
- Add aria-labels to all charts
- Replace thresholds with constants
- Handle division by zero in all calculations

### TSMAlertSystem.tsx
- Add aria-labels to alert cards
- Replace auto-escalation times with constants
- Add keyboard dismiss (Escape key)
- Ensure alerts are announced to screen readers

---

## 🎯 Priority Fixes

1. **Remove all console.log**: Search codebase for any remaining console.log statements
2. **Replace all magic numbers**: Ensure all thresholds use constants
3. **Add error boundaries**: Wrap components in error boundaries
4. **Accessibility audit**: Run automated accessibility checker
5. **Mobile testing**: Test all screens at 375px width

---

## 📱 Responsive Design Breakpoints

Standard breakpoints to use:
- Mobile: 375px - 767px (default)
- Tablet: 768px - 1023px (md:)
- Desktop: 1024px - 1439px (lg:)
- Large Desktop: 1440px+ (xl:)

Example usage:
```typescript
<div className="
  p-4 md:p-6 lg:p-8
  text-sm md:text-base lg:text-lg
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
  gap-2 md:gap-4 lg:gap-6
">
  {/* content */}
</div>
```

---

## ♿ Accessibility Checklist

- [ ] All images have alt text
- [ ] All icons are marked aria-hidden="true"
- [ ] All interactive elements have aria-labels
- [ ] All clickable non-buttons have role="button"
- [ ] All clickable elements support keyboard navigation
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] Touch targets ≥ 44x44px on mobile
- [ ] No content is conveyed by color alone
- [ ] Focus indicators are visible
- [ ] Screen reader announcements work correctly

---

## 🧹 Final Self-Check

Before marking a component complete, verify:
- [ ] No console errors or warnings
- [ ] All magic numbers replaced with constants
- [ ] JSDoc comments on all exported functions
- [ ] Error states handled gracefully
- [ ] Empty states handled gracefully
- [ ] Null/undefined edge cases handled
- [ ] All interactive elements are accessible
- [ ] All icons marked as decorative
- [ ] Division by zero protected
- [ ] TypeScript has no 'any' types
- [ ] Component is under 250 lines (split if larger)
- [ ] Responsive at all breakpoints
- [ ] Touch targets meet minimum size on mobile

---

## 📊 Progress Tracker

| Component | JSDoc | Constants | Error Handling | Accessibility | Complete |
|-----------|-------|-----------|----------------|---------------|----------|
| teleSalesManager.constants.ts | ✅ | ✅ | N/A | N/A | ✅ |
| TSMCommandDashboard.tsx | ✅ | ✅ | ✅ | ✅ | ✅ |
| TeleSalesManagerApp.tsx | ✅ | ✅ | ✅ | ✅ | ✅ |
| TSMTeamPerformance.tsx | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TSMLeadPipeline.tsx | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TSMPricingAudit.tsx | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TSMRenewalDashboard.tsx | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TSMIncentiveTracker.tsx | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TSMReportsAnalytics.tsx | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| TSMAlertSystem.tsx | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

Legend: ✅ Complete | ⏳ Pending

---

## 🚀 Next Steps

1. Apply the patterns from TSMCommandDashboard and TeleSalesManagerApp to remaining components
2. Run accessibility audit with automated tools
3. Test all components at mobile breakpoints (375px, 768px)
4. Verify no console.log statements remain
5. Ensure all magic numbers are replaced with constants
6. Add loading states to all data-fetching components
7. Final review against coding standards document
