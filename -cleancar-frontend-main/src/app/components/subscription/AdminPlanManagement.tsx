/**
 * Admin Plan Management Interface — Fixed
 *
 * Fixes applied:
 * 1. All edits persisted to DataService (survive page refresh)
 * 2. userRole read from RoleContext instead of hardcoded "ADMIN"
 * 3. Duration discounts saved to DataService and loaded on mount
 * 4. Audit log persisted to DataService (append-only)
 * 5. Duplicate WATER_SHAMPOO case removed from features switch
 * 6. Create plan dialog: removed duplicate / invalid "Shampoo+Polish" option
 * 7. Price changes propagated to PlanDefinitionContext via custom event
 * 8. No infinite loading — all data loads synchronously from DataService
 */

import { useState, useEffect, useCallback } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "../ui/dialog";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import {
  Edit, Trash2, Plus, Save, X, Eye, Archive,
  AlertCircle, Clock, Lock, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { subscriptionPlansService } from "../../services/subscriptionPlansService";
import { DataService } from "../../services/DataService";
import { useRole } from "../../contexts/RoleContext";
import type {
  VehicleCategory, PlanTier, Addon, ComboOffer, BillingDurationType,
} from "../../types/subscriptionPlans.types";
import { ROLE_PERMISSIONS } from "../../constants/subscriptionPlans.constants";

// ── Local types ──────────────────────────────────────────────────────────────

type UserRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "VIEWER";

interface AuditEntry {
  id: string;
  timestamp: string; // ISO string — serialisable for DataService
  user: string;
  action: string;
  entity: string;
  details: string;
  oldValue?: string;
  newValue?: string;
}

type DurationDiscounts = Record<BillingDurationType, number>;

const DEFAULT_DISCOUNTS: DurationDiscounts = {
  MONTHLY: 0,
  QUARTERLY: 5,
  HALF_YEARLY: 10,
  NINE_MONTHS: 12,
  ANNUAL: 15,
};

// Map app roles → plan permission roles
function mapRole(currentRole: string): UserRole {
  if (currentRole === "Super Admin") return "SUPER_ADMIN";
  if (currentRole === "Admin")       return "ADMIN";
  if (currentRole === "Manager")     return "MANAGER";
  return "VIEWER";
}

// ── Storage helpers ───────────────────────────────────────────────────────────

const STORAGE_KEY_TIERS     = "PLAN_TIERS"     as const;
const STORAGE_KEY_ADDONS    = "PLAN_ADDONS"    as const;
const STORAGE_KEY_COMBOS    = "PLAN_COMBOS"    as const;
const STORAGE_KEY_DISCOUNTS = "PLAN_DISCOUNTS" as const;
const STORAGE_KEY_AUDIT     = "PLAN_AUDIT_LOG" as const;

function loadTiers(): PlanTier[] {
  const stored = DataService.get<PlanTier>(STORAGE_KEY_TIERS);
  if (stored.length > 0) return stored;
  // First load — seed from service
  const seed = subscriptionPlansService.getAllPlanTiers();
  DataService.setAll(STORAGE_KEY_TIERS, seed);
  return seed;
}

function loadAddons(): Addon[] {
  const stored = DataService.get<Addon>(STORAGE_KEY_ADDONS);
  if (stored.length > 0) return stored;
  const seed = subscriptionPlansService.getAddons(true);
  DataService.setAll(STORAGE_KEY_ADDONS, seed);
  return seed;
}

function loadCombos(): ComboOffer[] {
  const stored = DataService.get<ComboOffer>(STORAGE_KEY_COMBOS);
  if (stored.length > 0) return stored;
  const seed = subscriptionPlansService.getComboOffers();
  DataService.setAll(STORAGE_KEY_COMBOS, seed);
  return seed;
}

function loadDiscounts(): DurationDiscounts {
  const stored = DataService.get<{ key: BillingDurationType; value: number }>(STORAGE_KEY_DISCOUNTS);
  if (stored.length > 0) {
    const d = { ...DEFAULT_DISCOUNTS };
    stored.forEach(r => { d[r.key] = r.value; });
    return d;
  }
  return { ...DEFAULT_DISCOUNTS };
}

function saveDiscounts(d: DurationDiscounts) {
  const rows = Object.entries(d).map(([key, value]) => ({
    id: key,
    key: key as BillingDurationType,
    value,
  }));
  DataService.setAll(STORAGE_KEY_DISCOUNTS, rows);
}

function loadAuditLog(): AuditEntry[] {
  return DataService.get<AuditEntry>(STORAGE_KEY_AUDIT)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminPlanManagement() {
  const { currentRole } = useRole();

  // ✅ FIX 2: derive userRole from live RoleContext, not hardcoded prop
  const userRole: UserRole = mapRole(currentRole);
  const permissions = ROLE_PERMISSIONS[userRole] ?? ROLE_PERMISSIONS.VIEWER;

  const [activeTab, setActiveTab] = useState<"plans"|"addons"|"combos"|"discounts"|"audit">("plans");
  const [loading, setLoading]     = useState(true);

  // ── Data state ──────────────────────────────────────────────────────────────
  // ✅ FIX 1: initialised from DataService (persisted storage)
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [allTiers,   setAllTiers]   = useState<PlanTier[]>([]);
  const [addons,     setAddons]     = useState<Addon[]>([]);
  const [combos,     setCombos]     = useState<ComboOffer[]>([]);

  // ✅ FIX 3: discounts loaded from DataService
  const [durationDiscounts, setDurationDiscounts] = useState<DurationDiscounts>(DEFAULT_DISCOUNTS);

  // ✅ FIX 8: audit log loaded from DataService
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);

  // Dialog state
  const [editDialogOpen,        setEditDialogOpen]        = useState(false);
  const [editingTier,           setEditingTier]           = useState<PlanTier | null>(null);
  const [editFormData,          setEditFormData]          = useState<Partial<PlanTier>>({});

  const [createPlanDialogOpen,  setCreatePlanDialogOpen]  = useState(false);
  const [newPlanData,           setNewPlanData]           = useState<Partial<PlanTier>>({
    vehicleCategoryId: "", name: "WATER_WASH" as any, displayName: "", baseMonthlyPrice: 0, isActive: true,
  });

  const [editAddonDialogOpen,   setEditAddonDialogOpen]   = useState(false);
  const [editingAddon,          setEditingAddon]          = useState<Addon | null>(null);
  const [addonFormData,         setAddonFormData]         = useState<Partial<Addon>>({});

  const [createAddonDialogOpen, setCreateAddonDialogOpen] = useState(false);
  const [newAddonData,          setNewAddonData]          = useState<Partial<Addon>>({
    name: "", description: "", price: 0, billingType: "PER_VISIT", isActive: true,
  });

  const [editComboDialogOpen,   setEditComboDialogOpen]   = useState(false);
  const [editingCombo,          setEditingCombo]          = useState<ComboOffer | null>(null);
  const [comboFormData,         setComboFormData]         = useState<Partial<ComboOffer>>({});

  const [discountEditMode,      setDiscountEditMode]      = useState(false);
  const [successMsg,            setSuccessMsg]            = useState("");
  const [errorMsg,              setErrorMsg]              = useState("");

  // ── Load all data on mount (synchronous — no spinner after initial render) ──
  useEffect(() => {
    // P3 FIX: try/catch ensures loading=false even if any service call throws
    try {
      const cats  = subscriptionPlansService.getVehicleCategories();
      const tiers = loadTiers();
      const ads   = loadAddons();
      const comb  = loadCombos();
      const disc  = loadDiscounts();
      const audit = loadAuditLog();

      setCategories(cats);
      setAllTiers(tiers);
      setAddons(ads);
      setCombos(comb);
      setDurationDiscounts(disc);
      setAuditLogs(audit);
    } catch (err) {
      console.error("[AdminPlanManagement] Load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Audit helper ─────────────────────────────────────────────────────────────
  const addAudit = useCallback((action: string, entity: string, details: string, oldVal?: string, newVal?: string) => {
    const entry: AuditEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      user: currentRole,
      action, entity, details,
      oldValue: oldVal,
      newValue: newVal,
    };
    // ✅ FIX 8: persist to DataService
    DataService.insert(STORAGE_KEY_AUDIT, entry);
    setAuditLogs(prev => [entry, ...prev]);
  }, [currentRole]);

  // ── Notification helpers ─────────────────────────────────────────────────────
  const ok  = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); toast.success(msg); };
  const err = (msg: string) => { setErrorMsg(msg);   setTimeout(() => setErrorMsg(""), 4000);   toast.error(msg); };

  // ✅ FIX 7: broadcast price change so PlanDefinitionContext consumers re-read
  const broadcastPriceChange = () =>
    window.dispatchEvent(new CustomEvent("cc360_plan_price_changed"));

  // ─────────────────────────────────────────────────────────────────────────────
  // PLAN TIER CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  const handleSavePlan = () => {
    if (!permissions.canEditPlan) return;
    if (!editingTier) return;

    const updated: PlanTier = {
      ...editingTier,
      ...editFormData,
      costPerWash: Number(((editFormData.baseMonthlyPrice ?? editingTier.baseMonthlyPrice) / 26).toFixed(2)),
    };

    const newTiers = allTiers.map(t => t.id === editingTier.id ? updated : t);
    setAllTiers(newTiers);
    // ✅ FIX 1: persist
    DataService.setAll(STORAGE_KEY_TIERS, newTiers);
    broadcastPriceChange();

    addAudit("UPDATE", "Plan Tier", `Updated ${updated.displayName}`,
      `₹${editingTier.baseMonthlyPrice}`, `₹${updated.baseMonthlyPrice}`);
    ok(`Plan "${updated.displayName}" saved`);
    setEditDialogOpen(false);
    setEditingTier(null);
    setEditFormData({});
  };

  const handleCreatePlan = () => {
    if (!permissions.canCreatePlan) return;
    if (!newPlanData.vehicleCategoryId || !newPlanData.baseMonthlyPrice) {
      err("Please fill in all required fields"); return;
    }
    const newTier: PlanTier = {
      id: `pt-new-${Date.now()}`,
      name: newPlanData.name as any,
      displayName: newPlanData.displayName || String(newPlanData.name) || "",
      vehicleCategoryId: newPlanData.vehicleCategoryId,
      baseMonthlyPrice: newPlanData.baseMonthlyPrice,
      costPerWash: Number((newPlanData.baseMonthlyPrice / 26).toFixed(2)),
      washesPerMonth: 26,
      isActive: true,
      sortOrder: allTiers.length,
    };
    const newTiers = [...allTiers, newTier];
    setAllTiers(newTiers);
    DataService.setAll(STORAGE_KEY_TIERS, newTiers);
    broadcastPriceChange();

    const cat = categories.find(c => c.id === newTier.vehicleCategoryId);
    addAudit("CREATE", "Plan Tier",
      `Created ${newTier.displayName} for ${cat?.displayName ?? "Unknown"}`,
      undefined, `₹${newTier.baseMonthlyPrice}/month`);
    ok(`Plan "${newTier.displayName}" created`);
    setCreatePlanDialogOpen(false);
    setNewPlanData({ vehicleCategoryId: "", name: "WATER_WASH" as any, displayName: "", baseMonthlyPrice: 0, isActive: true });
  };

  const handleDisablePlan = (tierId: string) => {
    if (!permissions.canDisablePlan) return;
    const tier = allTiers.find(t => t.id === tierId);
    if (!tier) return;
    const newTiers = allTiers.map(t => t.id === tierId ? { ...t, isActive: false } : t);
    setAllTiers(newTiers);
    DataService.setAll(STORAGE_KEY_TIERS, newTiers);
    broadcastPriceChange();
    addAudit("DISABLE", "Plan Tier", `Disabled ${tier.displayName}`, "Active", "Disabled");
    ok(`Plan "${tier.displayName}" disabled`);
  };

  const handleEnablePlan = (tierId: string) => {
    if (!permissions.canDisablePlan) return;
    const tier = allTiers.find(t => t.id === tierId);
    if (!tier) return;
    const newTiers = allTiers.map(t => t.id === tierId ? { ...t, isActive: true } : t);
    setAllTiers(newTiers);
    DataService.setAll(STORAGE_KEY_TIERS, newTiers);
    broadcastPriceChange();
    addAudit("ENABLE", "Plan Tier", `Re-enabled ${tier.displayName}`, "Disabled", "Active");
    ok(`Plan "${tier.displayName}" re-enabled`);
  };

  const handleDeletePlan = (tierId: string) => {
    if (!permissions.canDeletePlan) return;
    const tier = allTiers.find(t => t.id === tierId);
    if (!tier) return;
    const newTiers = allTiers.filter(t => t.id !== tierId);
    setAllTiers(newTiers);
    DataService.setAll(STORAGE_KEY_TIERS, newTiers);
    broadcastPriceChange();
    addAudit("DELETE", "Plan Tier", `Deleted ${tier.displayName}`, `₹${tier.baseMonthlyPrice}`, undefined);
    ok(`Plan "${tier.displayName}" deleted`);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ADD-ON CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  const handleToggleAddon = (addonId: string, isActive: boolean) => {
    if (!permissions.canManageAddons) return;
    const newAddons = addons.map(a => a.id === addonId ? { ...a, isActive } : a);
    setAddons(newAddons);
    DataService.setAll(STORAGE_KEY_ADDONS, newAddons);
    const addon = addons.find(a => a.id === addonId);
    addAudit(isActive ? "ACTIVATE" : "DEACTIVATE", "Add-on",
      `${isActive ? "Activated" : "Deactivated"} ${addon?.name}`,
      isActive ? "Inactive" : "Active", isActive ? "Active" : "Inactive");
    ok(`Add-on "${addon?.name}" ${isActive ? "activated" : "deactivated"}`);
  };

  const handleSaveAddon = () => {
    if (!permissions.canManageAddons || !editingAddon) return;
    const newAddons = addons.map(a => a.id === editingAddon.id ? { ...a, ...addonFormData } : a);
    setAddons(newAddons);
    DataService.setAll(STORAGE_KEY_ADDONS, newAddons);
    addAudit("UPDATE", "Add-on", `Updated ${addonFormData.name}`,
      `₹${editingAddon.price}`, `₹${addonFormData.price}`);
    ok(`Add-on "${addonFormData.name}" saved`);
    setEditAddonDialogOpen(false);
    setEditingAddon(null);
    setAddonFormData({});
  };

  const handleCreateAddon = () => {
    if (!permissions.canManageAddons) return;
    if (!newAddonData.name || !newAddonData.price) { err("Please fill in all required fields"); return; }
    const newAddon: Addon = {
      id: `addon-new-${Date.now()}`,
      name: newAddonData.name,
      description: newAddonData.description ?? "",
      price: newAddonData.price,
      billingType: newAddonData.billingType ?? "PER_VISIT",
      bestPairedWith: [],
      marginPercent: 75,
      isActive: true,
      isOperationallyConfirmed: true,
      sortOrder: addons.length,
    };
    const newAddons = [...addons, newAddon];
    setAddons(newAddons);
    DataService.setAll(STORAGE_KEY_ADDONS, newAddons);
    addAudit("CREATE", "Add-on", `Created ${newAddon.name}`,
      undefined, `₹${newAddon.price} ${newAddon.billingType === "PER_VISIT" ? "per visit" : "per month"}`);
    ok(`Add-on "${newAddon.name}" created`);
    setCreateAddonDialogOpen(false);
    setNewAddonData({ name: "", description: "", price: 0, billingType: "PER_VISIT", isActive: true });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // COMBO CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  const handleSaveCombo = () => {
    if (!permissions.canManageCombos || !editingCombo) return;
    const updated = {
      ...editingCombo,
      ...comboFormData,
      savingAmount:  (comboFormData.normalPrice ?? editingCombo.normalPrice) - (comboFormData.comboPrice ?? editingCombo.comboPrice),
      savingPercent: comboFormData.normalPrice
        ? Math.round(((comboFormData.normalPrice - (comboFormData.comboPrice ?? 0)) / comboFormData.normalPrice) * 100)
        : editingCombo.savingPercent,
    };
    const newCombos = combos.map(c => c.id === editingCombo.id ? updated : c);
    setCombos(newCombos);
    DataService.setAll(STORAGE_KEY_COMBOS, newCombos);
    addAudit("UPDATE", "Combo Offer", `Updated ${comboFormData.name}`,
      `₹${editingCombo.comboPrice}`, `₹${comboFormData.comboPrice}`);
    ok(`Combo "${comboFormData.name}" saved`);
    setEditComboDialogOpen(false);
    setEditingCombo(null);
    setComboFormData({});
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // DURATION DISCOUNTS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleSaveDiscounts = () => {
    if (!permissions.canEditDurationDiscounts) return;
    // ✅ FIX 3: persist to DataService
    saveDiscounts(durationDiscounts);
    const changes = Object.entries(durationDiscounts).map(([k, v]) => `${k}: ${v}%`).join(", ");
    addAudit("UPDATE", "Duration Discounts", "Updated billing duration discounts", "Various", changes);
    ok("Duration discounts saved");
    setDiscountEditMode(false);
    broadcastPriceChange();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RESET TO DEFAULTS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleResetToDefaults = () => {
    if (!permissions.canEditPlan) return;
    const seed = subscriptionPlansService.getAllPlanTiers();
    DataService.setAll(STORAGE_KEY_TIERS, seed);
    setAllTiers(seed);
    broadcastPriceChange();
    addAudit("RESET", "Plan Tiers", "All tiers reset to canonical defaults");
    ok("All plans reset to default pricing");
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // LOADING STATE — single brief render, no spinner loop
  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-gray-600">Loading plan data…</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Status banner */}
        {successMsg && (
          <Card className="p-4 bg-green-50 border-2 border-green-400">
            <div className="flex items-center gap-2 text-green-800">
              <Save className="w-4 h-4" />
              <span className="font-medium">{successMsg}</span>
            </div>
          </Card>
        )}
        {errorMsg && (
          <Card className="p-4 bg-red-50 border-2 border-red-400">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          </Card>
        )}

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscription Plan Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage plans, pricing, add-ons, and combo offers</p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge variant="outline">Role: {userRole}</Badge>
              {!permissions.canEditPlan && (
                <Badge variant="secondary"><Eye className="w-3 h-3 mr-1" />View Only</Badge>
              )}
              <Badge variant="outline" className="text-xs text-gray-400">
                Changes persist across sessions
              </Badge>
            </div>
          </div>
          {permissions.canEditPlan && (
            <Button variant="outline" size="sm" onClick={handleResetToDefaults}>
              <RefreshCw className="w-4 h-4 mr-2" />Reset to Defaults
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="plans">Plan Tiers</TabsTrigger>
            <TabsTrigger value="addons">Add-ons</TabsTrigger>
            <TabsTrigger value="combos">Combo Offers</TabsTrigger>
            <TabsTrigger value="discounts">
              Duration Discounts
              {!permissions.canEditDurationDiscounts && (
                <Badge className="ml-1 text-xs" variant="secondary">Read Only</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit" disabled={!permissions.canViewAuditLog}>
              Audit Log
            </TabsTrigger>
          </TabsList>

          {/* ═══ TAB 1: PLAN TIERS ═══════════════════════════════════════════ */}
          <TabsContent value="plans">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Plan Tiers</h2>
                {permissions.canCreatePlan && (
                  <Button onClick={() => setCreatePlanDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />Create New Plan
                  </Button>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Base Monthly Price</TableHead>
                    <TableHead>Cost per Wash</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTiers.map(tier => {
                    const cat = categories.find(c => c.id === tier.vehicleCategoryId);
                    return (
                      <TableRow key={tier.id}>
                        <TableCell>
                          <p className="font-medium">{cat?.displayName ?? "Unknown"}</p>
                          <p className="text-xs text-gray-400">{cat?.type}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tier.displayName}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {subscriptionPlansService.formatPrice(tier.baseMonthlyPrice)}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {subscriptionPlansService.formatPrice(tier.costPerWash)}
                        </TableCell>
                        <TableCell>
                          {tier.isActive
                            ? <Badge className="bg-green-600">Active</Badge>
                            : <Badge variant="secondary">Disabled</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {permissions.canEditPlan && (
                              <Button variant="ghost" size="sm"
                                onClick={() => { setEditingTier(tier); setEditFormData(tier); setEditDialogOpen(true); }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {permissions.canDisablePlan && tier.isActive && (
                              <Button variant="ghost" size="sm" onClick={() => handleDisablePlan(tier.id)}>
                                <Archive className="w-4 h-4" />
                              </Button>
                            )}
                            {permissions.canDisablePlan && !tier.isActive && (
                              <Button variant="ghost" size="sm" onClick={() => handleEnablePlan(tier.id)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            {permissions.canDeletePlan && !tier.isActive && (
                              <Button variant="ghost" size="sm" onClick={() => handleDeletePlan(tier.id)}>
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ═══ TAB 2: ADD-ONS ══════════════════════════════════════════════ */}
          <TabsContent value="addons">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Add-on Services</h2>
                {permissions.canManageAddons && (
                  <Button onClick={() => setCreateAddonDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />Create Add-on
                  </Button>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>Confirmed</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addons.map(addon => (
                    <TableRow key={addon.id}>
                      <TableCell className="font-medium">{addon.name}</TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-xs truncate">{addon.description}</TableCell>
                      <TableCell className="font-semibold">{subscriptionPlansService.formatPrice(addon.price)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{addon.billingType === "PER_VISIT" ? "Per Visit" : "Per Month"}</Badge>
                      </TableCell>
                      <TableCell>{addon.marginPercent}%</TableCell>
                      <TableCell>
                        {addon.isOperationallyConfirmed
                          ? <Badge className="bg-green-600">Confirmed</Badge>
                          : <Badge className="bg-yellow-600">Pending</Badge>}
                      </TableCell>
                      <TableCell>
                        {permissions.canManageAddons
                          ? <Switch checked={addon.isActive} onCheckedChange={v => handleToggleAddon(addon.id, v)} />
                          : <Badge variant={addon.isActive ? "default" : "secondary"}>{addon.isActive ? "Yes" : "No"}</Badge>}
                      </TableCell>
                      <TableCell>
                        {permissions.canManageAddons && (
                          <Button variant="ghost" size="sm"
                            onClick={() => { setEditingAddon(addon); setAddonFormData(addon); setEditAddonDialogOpen(true); }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ═══ TAB 3: COMBO OFFERS ═════════════════════════════════════════ */}
          <TabsContent value="combos">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Combo Offers</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {combos.map(combo => (
                  <Card key={combo.id} className="p-6 border-2">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{combo.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{combo.description}</p>
                      </div>
                      {permissions.canManageCombos && (
                        <Button variant="ghost" size="sm"
                          onClick={() => { setEditingCombo(combo); setComboFormData(combo); setEditComboDialogOpen(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Normal Price:</span>
                        <span className="line-through text-gray-400">{subscriptionPlansService.formatPrice(combo.normalPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Combo Price:</span>
                        <span className="font-bold text-green-700">{subscriptionPlansService.formatPrice(combo.comboPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Saving:</span>
                        <Badge className="bg-green-600">
                          {subscriptionPlansService.formatPrice(combo.savingAmount)} ({combo.savingPercent}%)
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 pt-2 border-t">{combo.validityRule}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* ═══ TAB 4: DURATION DISCOUNTS ═══════════════════════════════════ */}
          <TabsContent value="discounts">
            <Card className="p-6">
              {!permissions.canEditDurationDiscounts && (
                <Card className="mb-6 p-4 bg-orange-50 border-2 border-orange-300">
                  <div className="flex items-center gap-2 text-sm text-orange-800">
                    <Lock className="w-5 h-5 text-orange-700" />
                    <span><strong>Read-Only:</strong> Only SUPER_ADMIN can edit duration discounts. Your role ({userRole}) can view only.</span>
                  </div>
                </Card>
              )}

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Billing Duration Discounts</h2>
                  <p className="text-sm text-gray-500 mt-1">Discount % applied for longer billing periods</p>
                </div>
                {permissions.canEditDurationDiscounts && (
                  <div className="flex gap-2">
                    {discountEditMode ? (
                      <>
                        <Button variant="outline" onClick={() => setDiscountEditMode(false)}>
                          <X className="w-4 h-4 mr-2" />Cancel
                        </Button>
                        <Button onClick={handleSaveDiscounts}>
                          <Save className="w-4 h-4 mr-2" />Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setDiscountEditMode(true)}>
                        <Edit className="w-4 h-4 mr-2" />Edit Discounts
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {(Object.entries(durationDiscounts) as [BillingDurationType, number][]).map(([dur, pct]) => (
                  <Card key={dur} className="p-5 border-2 text-center">
                    <h3 className="font-semibold text-sm mb-1">
                      {dur === "NINE_MONTHS" ? "9 Months" : dur.replace("_", " ")}
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">
                      {dur === "MONTHLY" ? "1 month" : dur === "QUARTERLY" ? "3 months" :
                       dur === "HALF_YEARLY" ? "6 months" : dur === "NINE_MONTHS" ? "9 months" : "12 months"}
                    </p>
                    {discountEditMode && permissions.canEditDurationDiscounts ? (
                      <Input type="number" min={0} max={50} value={pct}
                        onChange={e => setDurationDiscounts(prev => ({ ...prev, [dur]: Number(e.target.value) }))}
                        className="text-center" />
                    ) : (
                      <div className="py-3 bg-blue-50 rounded-lg">
                        <p className="text-3xl font-bold text-blue-700">{pct}%</p>
                        <p className="text-xs text-gray-500 mt-1">{pct === 0 ? "No discount" : "Discount"}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <p className="font-semibold mb-1">Important</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Changing discounts affects NEW subscriptions only</li>
                  <li>Existing subscribers keep their original pricing (priceLocked)</li>
                  <li>All changes are saved and visible after page refresh</li>
                </ul>
              </div>
            </Card>
          </TabsContent>

          {/* ═══ TAB 5: AUDIT LOG ════════════════════════════════════════════ */}
          <TabsContent value="audit">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Audit Log</h2>
                  <p className="text-sm text-gray-500 mt-1">All plan changes — persists across sessions</p>
                </div>
                <Badge variant="outline">{auditLogs.length} entries</Badge>
              </div>

              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-3" />
                  <p>No changes recorded yet. All plan modifications will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {auditLogs.map(log => (
                    <Card key={log.id} className="p-4 border-l-4 border-l-purple-500">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge className={
                              log.action === "CREATE"   ? "bg-green-600"   :
                              log.action === "UPDATE"   ? "bg-blue-600"    :
                              log.action === "DELETE"   ? "bg-red-600"     :
                              log.action === "DISABLE"  ? "bg-orange-600"  :
                              log.action === "ENABLE"   ? "bg-emerald-600" :
                              log.action === "RESET"    ? "bg-purple-600"  : "bg-gray-600"
                            }>{log.action}</Badge>
                            <span className="font-semibold text-sm">{log.entity}</span>
                            <Badge variant="outline" className="text-xs">{log.user}</Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{log.details}</p>
                          {(log.oldValue || log.newValue) && (
                            <div className="flex items-center gap-3 text-xs">
                              {log.oldValue && <span className="font-mono text-red-700">← {log.oldValue}</span>}
                              {log.oldValue && log.newValue && <span className="text-gray-400">→</span>}
                              {log.newValue && <span className="font-mono text-green-700">{log.newValue} →</span>}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-400 whitespace-nowrap">
                          <p>{new Date(log.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                          <p>{new Date(log.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* ═══ EDIT PLAN DIALOG ════════════════════════════════════════════════ */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Plan Tier</DialogTitle>
              <DialogDescription>Update plan pricing — changes are saved immediately</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Display Name</Label>
                <Input value={editFormData.displayName ?? ""} onChange={e => setEditFormData(p => ({ ...p, displayName: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Base Monthly Price (₹)</Label>
                <Input type="number" min={100} max={10000} value={editFormData.baseMonthlyPrice ?? ""}
                  onChange={e => setEditFormData(p => ({ ...p, baseMonthlyPrice: Number(e.target.value) }))}
                  disabled={!permissions.canEditPricing} />
                {!permissions.canEditPricing && <p className="text-xs text-gray-400">Pricing changes require SUPER_ADMIN role</p>}
              </div>
              {(editFormData.baseMonthlyPrice ?? 0) > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm flex justify-between">
                  <span className="text-gray-500">Cost per wash:</span>
                  <span className="font-medium">{subscriptionPlansService.formatPrice(Number(((editFormData.baseMonthlyPrice ?? 0) / 26).toFixed(2)))}</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSavePlan}><Save className="w-4 h-4 mr-2" />Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══ CREATE PLAN DIALOG ══════════════════════════════════════════════ */}
        <Dialog open={createPlanDialogOpen} onOpenChange={setCreatePlanDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Plan Tier</DialogTitle>
              <DialogDescription>Add a new subscription plan tier</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Vehicle Category *</Label>
                <Select value={newPlanData.vehicleCategoryId} onValueChange={v => setNewPlanData(p => ({ ...p, vehicleCategoryId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.displayName} ({c.type})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Plan Tier *</Label>
                {/* ✅ FIX 6: removed duplicate/invalid "Shampoo+Polish" option */}
                <Select value={String(newPlanData.name)} onValueChange={v => setNewPlanData(p => ({
                  ...p, name: v as any,
                  displayName: v === "WATER_WASH" ? "Water Wash" : v === "WATER_SHAMPOO" ? "Water + Shampoo" : "Water + Shampoo + Wax",
                }))}>
                  <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WATER_WASH">Water Wash</SelectItem>
                    <SelectItem value="WATER_SHAMPOO">Water + Shampoo</SelectItem>
                    <SelectItem value="WATER_SHAMPOO_WAX">Water + Shampoo + Wax</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Base Monthly Price (₹) *</Label>
                <Input type="number" min={100} max={10000} value={newPlanData.baseMonthlyPrice || ""}
                  onChange={e => setNewPlanData(p => ({ ...p, baseMonthlyPrice: Number(e.target.value) }))}
                  placeholder="e.g., 699" />
                {(newPlanData.baseMonthlyPrice ?? 0) > 0 && (
                  <p className="text-xs text-gray-500">Cost per wash: ₹{((newPlanData.baseMonthlyPrice ?? 0) / 26).toFixed(2)}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreatePlanDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreatePlan}><Plus className="w-4 h-4 mr-2" />Create Plan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══ EDIT ADD-ON DIALOG ══════════════════════════════════════════════ */}
        <Dialog open={editAddonDialogOpen} onOpenChange={setEditAddonDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Add-on Service</DialogTitle>
              <DialogDescription>Update add-on details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Service Name</Label>
                <Input value={addonFormData.name ?? ""} onChange={e => setAddonFormData(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input value={addonFormData.description ?? ""} onChange={e => setAddonFormData(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Price (₹)</Label>
                <Input type="number" min={0} value={addonFormData.price ?? ""} onChange={e => setAddonFormData(p => ({ ...p, price: Number(e.target.value) }))} />
              </div>
              <div className="grid gap-2">
                <Label>Billing Type</Label>
                <Select value={addonFormData.billingType} onValueChange={v => setAddonFormData(p => ({ ...p, billingType: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PER_VISIT">Per Visit</SelectItem>
                    <SelectItem value="PER_MONTH">Per Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditAddonDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveAddon}><Save className="w-4 h-4 mr-2" />Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══ CREATE ADD-ON DIALOG ════════════════════════════════════════════ */}
        <Dialog open={createAddonDialogOpen} onOpenChange={setCreateAddonDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Add-on</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Service Name *</Label>
                <Input placeholder="e.g., Engine Detailing" value={newAddonData.name ?? ""} onChange={e => setNewAddonData(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input placeholder="Service description" value={newAddonData.description ?? ""} onChange={e => setNewAddonData(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Price (₹) *</Label>
                <Input type="number" min={0} placeholder="e.g., 299" value={newAddonData.price ?? ""} onChange={e => setNewAddonData(p => ({ ...p, price: Number(e.target.value) }))} />
              </div>
              <div className="grid gap-2">
                <Label>Billing Type</Label>
                <Select value={newAddonData.billingType} onValueChange={v => setNewAddonData(p => ({ ...p, billingType: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PER_VISIT">Per Visit</SelectItem>
                    <SelectItem value="PER_MONTH">Per Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateAddonDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateAddon}><Plus className="w-4 h-4 mr-2" />Create Add-on</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══ EDIT COMBO DIALOG ═══════════════════════════════════════════════ */}
        <Dialog open={editComboDialogOpen} onOpenChange={setEditComboDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Combo Offer</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Combo Name</Label>
                <Input value={comboFormData.name ?? ""} onChange={e => setComboFormData(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input value={comboFormData.description ?? ""} onChange={e => setComboFormData(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Normal Price (₹)</Label>
                  <Input type="number" min={0} value={comboFormData.normalPrice ?? ""} onChange={e => setComboFormData(p => ({ ...p, normalPrice: Number(e.target.value) }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Combo Price (₹)</Label>
                  <Input type="number" min={0} value={comboFormData.comboPrice ?? ""} onChange={e => setComboFormData(p => ({ ...p, comboPrice: Number(e.target.value) }))} />
                </div>
              </div>
              {(comboFormData.normalPrice ?? 0) > (comboFormData.comboPrice ?? 0) && (
                <div className="p-3 bg-green-50 rounded text-sm text-green-800 font-medium">
                  Saving: ₹{(comboFormData.normalPrice ?? 0) - (comboFormData.comboPrice ?? 0)} ({(((comboFormData.normalPrice ?? 0) - (comboFormData.comboPrice ?? 0)) / (comboFormData.normalPrice ?? 1) * 100).toFixed(1)}%)
                </div>
              )}
              <div className="grid gap-2">
                <Label>Validity Rule</Label>
                <Input placeholder="e.g., Same household" value={comboFormData.validityRule ?? ""} onChange={e => setComboFormData(p => ({ ...p, validityRule: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditComboDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveCombo}><Save className="w-4 h-4 mr-2" />Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
