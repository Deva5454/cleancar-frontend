import shutil, datetime

FILE = r"E:\3rd June Final Deployment\cleancar-root\src\app\components\dashboards\FinanceDashboard.tsx"

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
shutil.copy2(FILE, FILE + f".bak_finance_{ts}")
print(f"Backed up")

with open(FILE, "r", encoding="utf-8") as fh:
    c = fh.read()

results = []

def patch(old, new, label):
    global c
    if old in c:
        c = c.replace(old, new, 1)
        print(f"  [OK]   {label}")
    else:
        print(f"  [SKIP] {label}")

patch(
    'toast.success(`Cash deposit of \u20b9${amount.toLocaleString()} from ${supervisorName} verified`);\n  };',
    'toast.success(`Cash deposit of \u20b9${amount.toLocaleString()} from ${supervisorName} verified`);\n  };\n\n  const handleRejectDeposit = (supervisorName: string, amount: number, depositId?: string) => {\n    const reason = window.prompt(`Reason for rejecting \u20b9${amount.toLocaleString()} from ${supervisorName}:`);\n    if (!reason) return;\n    if (depositId) {\n      const all = loadCashDeposits();\n      const updated = all.map((d: any) => d.id === depositId ? { ...d, status: "REJECTED", rejectedAt: new Date().toISOString(), rejectionReason: reason } : d);\n      localStorage.setItem("SUPERVISOR_CASH_DEPOSITS", JSON.stringify(updated));\n      setLiveDeposits(updated);\n    }\n    toast.error(`Deposit rejected`);\n  };',
    "Add handleRejectDeposit"
)

patch(
    '    // From live CashDepositScreen submissions\n    ...liveDeposits\n      .filter(d => d.status === "DEPOSITED")\n      .map(d => ({\n        id: d.id,\n        supervisor: d.supervisorName,\n        amount: d.amount,\n        status: "Pending Verification",\n        bankRefNumber: d.bankRefNumber,\n        collectedAt: d.collectedAt,\n        isLive: true,\n      })),',
    '    // From live CashDepositScreen submissions (COLLECTED + DEPOSITED)\n    ...liveDeposits\n      .filter(d => d.status === "DEPOSITED" || d.status === "COLLECTED")\n      .map(d => ({\n        id: d.id,\n        supervisor: d.supervisorName,\n        amount: d.amount,\n        status: d.status === "DEPOSITED" ? "Pending Verification" : "Collected - Not Yet Deposited",\n        bankRefNumber: d.bankRefNumber,\n        collectedAt: d.collectedAt,\n        customerName: d.customerName,\n        customerMobile: d.customerMobile,\n        subscriptionId: d.subscriptionId,\n        notes: d.notes,\n        isLive: true,\n        canVerify: d.status === "DEPOSITED",\n      })),',
    "Show COLLECTED + DEPOSITED"
)

with open(FILE, "w", encoding="utf-8", newline="") as fh:
    fh.write(c)

print("Done")
