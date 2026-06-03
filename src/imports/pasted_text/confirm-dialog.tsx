Open src/app/routes.tsx.
 
Find the route for "car-washer":
  { path: "car-washer", element: <CarWasherExecution /> },
 
Change it to:
  { path: "car-washer", element: <Navigate to="/washer-core-screens" replace /> },
 
This redirects the old static-mock washer module to the new fully functional
WasherCoreScreensConnected module.
 
You may also remove the import for CarWasherExecution at the top of routes.tsx
if it is no longer used anywhere else.



Create a new file: src/app/components/shared/ConfirmDialog.tsx
 
The content should be:
 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "../ui/alert-dialog";
 
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "default" | "destructive";
}
 
export function ConfirmDialog({
  open, title, description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm, onCancel, variant = "default",
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>


     <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={variant === "destructive" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
 



In each of the following files, replace every window.confirm() and alert()
call with the new ConfirmDialog component created in P2-B.
 
The pattern for each file:
 
1. Add import at top:
   import { ConfirmDialog } from "../shared/ConfirmDialog";
 
2. Add state near top of component:
   const [confirmState, setConfirmState] = useState<{
     open: boolean; title: string; description: string; onConfirm: () => void;
   }>({ open: false, title: "", description: "", onConfirm: () => {} });
 
3. Replace each confirm() call:
   BEFORE: if (confirm("Are you sure you want to delete this shift?")) { deleteShift(); }
   AFTER:  setConfirmState({ open: true, title: "Delete Shift",
             description: "Are you sure you want to delete this shift?",
             onConfirm: () => { deleteShift(); setConfirmState(s => ({...s,open:false})); }
           });
 
4. Add ConfirmDialog to JSX return (just before closing tag):
   <ConfirmDialog
     open={confirmState.open}
     title={confirmState.title}
     description={confirmState.description}
     onConfirm={confirmState.onConfirm}
     onCancel={() => setConfirmState(s => ({...s, open: false}))}
   />
 
Apply this to these files:
- src/app/components/admin/ShiftManagementPage.tsx
- src/app/components/payroll/CreateSalaryStructure.tsx
- src/app/components/subscription/PlanEditor.tsx
- src/app/components/admin/AttendanceDataManager.tsx
- src/app/components/admin/SystemConfigurationManager.tsx
- src/app/components/washer/QAAuditDrawer.tsx
- src/app/components/layouts/RootLayout.tsx (the logout confirm)



Open src/app/components/finance/ActualCostInputs.tsx.
 
Find all buttons that call toast.info("Edit coming soon") or
toast.info("Delete coming soon"). There are 10 of them at approximately
lines 270, 277, 374, 381, 480, 487, 591, 598, 701, 708.
 
For each one, wrap the button in a conditional that hides it entirely:
Replace each:
  <Button onClick={() => toast.info("Edit coming soon")} ...>
    <Edit className="w-4 h-4" />
  </Button>
 
With:
  {/* TODO: Implement edit handler — hidden until backend is wired */}
 
And each:
  <Button onClick={() => toast.info("Delete coming soon")} ...>
    <Trash className="w-4 h-4" />
  </Button>
 
With:
  {/* TODO: Implement delete handler — hidden until backend is wired */}
 
This removes the broken buttons from the UI entirely. They should reappear
only when the actual handler is implemented.


	
Open src/app/components/finance/ActualCostInputs.tsx.
 
Find all buttons that call toast.info("Edit coming soon") or
toast.info("Delete coming soon"). There are 10 of them at approximately
lines 270, 277, 374, 381, 480, 487, 591, 598, 701, 708.
 
For each one, wrap the button in a conditional that hides it entirely:
Replace each:
  <Button onClick={() => toast.info("Edit coming soon")} ...>
    <Edit className="w-4 h-4" />
  </Button>
 
With:
  {/* TODO: Implement edit handler — hidden until backend is wired */}
 
And each:
  <Button onClick={() => toast.info("Delete coming soon")} ...>
    <Trash className="w-4 h-4" />
  </Button>
 
With:
  {/* TODO: Implement delete handler — hidden until backend is wired */}
 
This removes the broken buttons from the UI entirely. They should reappear
only when the actual handler is implemented.





