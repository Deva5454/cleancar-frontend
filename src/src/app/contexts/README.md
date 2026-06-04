# Global Contexts - Single Sources of Truth

This directory contains **all global state management** for the Car Wash ERP application.

## Quick Start

### 1. Import from AppProvider

```typescript
import { 
  useCustomers,
  useSubscriptions,
  useJobs,
  useHRData,
  useInventory,
  useFinance,
  useEvents
} from "./contexts/AppProvider";
```

### 2. Use in Components

```typescript
function MyComponent() {
  const { customers, addCustomer } = useCustomers();
  const { emit } = useEvents();

  const handleCreate = () => {
    const newCustomer = addCustomer({
      firstName: "John",
      lastName: "Doe",
      // ...
    });
    emit("LEAD_CONVERTED", { customerId: newCustomer.customerId });
  };
}
```

## Context Files

| File | Purpose |
|------|---------|
| `CustomerContext.tsx` | All customer data (CRM, Revenue, Jobs) |
| `SubscriptionContext.tsx` | All subscription data (recurring revenue) |
| `JobContext.tsx` | All jobs/work orders (operations, washers) |
| `HRDataContext.tsx` | Employees, attendance, payroll |
| `InventoryContext.tsx` | Stock across central/supervisor/washer |
| `FinanceContext.tsx` | MRR, payables, revenue, ledger |
| `EventSystem.tsx` | Cross-module event communication |
| `AppProvider.tsx` | Wrapper that combines all contexts |

## Global Identities

- `customerId` - Used across Customer, Subscription, Job, Finance
- `employeeId` - Used across HR, Job (as washerId), Inventory, Payables
- `subscriptionId` - Links subscriptions to customers and jobs
- `jobId` - Links jobs to customers, washers, and revenue
- `payrollId` - Links payroll to employees and salary payables

## Documentation

- **Full Technical Reference:** `/SHARED_DATA_ARCHITECTURE.md`
- **Migration Examples:** `/MIGRATION_EXAMPLES.md`
- **Summary:** `/ARCHITECTURE_REFACTOR_SUMMARY.md`

## Rules

1. **Never duplicate data** - Each entity exists in exactly ONE context
2. **Use global IDs** - Always use customerId, employeeId (not custom IDs)
3. **Emit events** - Use EventSystem for cross-module updates
4. **Type-safe** - All interfaces exported from each context
5. **No local state** - Read from contexts, not useState

## Testing

Test that contexts are working:

```typescript
// 1. Create customer
const customer = addCustomer({ firstName: "Test" });

// 2. Create subscription
const sub = createSubscription({ customerId: customer.customerId });

// 3. Verify both exist and are linked
console.log(getCustomerById(customer.customerId)); // Should exist
console.log(getSubscriptionsByCustomerId(customer.customerId)); // Should include sub
```

## Event System

System events trigger cross-module updates:

```typescript
// Emit event
emit("JOB_COMPLETED", { jobId, washerId });

// Listen to event
useEventListener("JOB_COMPLETED", (event) => {
  // Update payroll, send notification, etc.
});
```

## Need Help?

1. Read the documentation files in project root
2. Check migration examples for your use case
3. Review TypeScript interfaces in each context file
4. Use `getEventHistory()` to debug event flow
