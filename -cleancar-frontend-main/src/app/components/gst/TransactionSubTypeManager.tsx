/**
 * Transaction Sub-Type Manager
 *
 * Settings page for managing GST transaction sub-types.
 * Shows system defaults + custom user-defined categories with ITC reference guide.
 * Access: Super Admin, Admin, Accounts roles only.
 */

import React, { useState, useMemo } from "react";
import { Plus, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  getAllSubTypes,
  deactivateCustomSubType,
  type TransactionSubType,
} from "../../config/gstTransactionTypes";
import { TransactionTypeConfigurator } from "./TransactionTypeConfigurator";
import { toast } from "sonner";

export function TransactionSubTypeManager() {
  const [allSubTypes, setAllSubTypes] = useState<TransactionSubType[]>(getAllSubTypes());
  const [filterParentType, setFilterParentType] = useState<string>("All");
  const [filterITC, setFilterITC] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [configuratorParentType, setConfiguratorParentType] = useState<string>("Expense");

  // Reload sub-types
  const refreshSubTypes = () => {
    setAllSubTypes(getAllSubTypes());
  };

  // Filter sub-types
  const filteredSubTypes = useMemo(() => {
    return allSubTypes.filter((st) => {
      // Parent type filter
      if (filterParentType !== "All" && st.parentType !== filterParentType) return false;

      // ITC filter
      if (filterITC === "ITC Eligible" && !st.itcEligible) return false;
      if (filterITC === "ITC Blocked" && st.itcEligible) return false;
      if (filterITC === "Evaluate" && st.itcEligible !== undefined) {
        // "Evaluate" means neither true nor false explicitly set, or check the rule text
        if (!st.itcRule.includes("Evaluate") && !st.itcRule.includes("evaluate")) return false;
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          st.label.toLowerCase().includes(search) ||
          st.description.toLowerCase().includes(search) ||
          st.accountHead.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [allSubTypes, filterParentType, filterITC, searchTerm]);

  const handleDeactivate = (subType: TransactionSubType) => {
    if (
      window.confirm(
        `Deactivate '${subType.label}'?\n\nIt will no longer appear in the transaction form. Existing transactions using this type are not affected.`
      )
    ) {
      deactivateCustomSubType(subType.id);
      toast.success(`'${subType.label}' deactivated`);
      refreshSubTypes();
    }
  };

  const getParentTypeBadgeColor = (type: string) => {
    switch (type) {
      case "Purchase":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "Expense":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "Sale":
        return "bg-green-100 text-green-700 border-green-300";
      case "Credit Note":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "Debit Note":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getITCBadge = (subType: TransactionSubType) => {
    if (subType.itcEligible) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
          <CheckCircle className="h-3 w-3" />
          Eligible
        </span>
      );
    } else if (subType.itcRule.includes("Evaluate") || subType.itcRule.includes("evaluate")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded">
          <AlertTriangle className="h-3 w-3" />
          Evaluate
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
          <XCircle className="h-3 w-3" />
          Blocked
        </span>
      );
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GST Transaction Sub-Types</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage transaction categories and ITC eligibility rules
          </p>
        </div>
        <Button
          onClick={() => setShowConfigurator(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Sub-Type
        </Button>
      </div>

      <Tabs defaultValue="all-types" className="w-full">
        <TabsList>
          <TabsTrigger value="all-types">All Sub-Types</TabsTrigger>
          <TabsTrigger value="itc-reference">ITC Quick Reference</TabsTrigger>
        </TabsList>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TAB 1: All Sub-Types */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <TabsContent value="all-types" className="mt-6">
          {/* Filter Bar */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Parent Type Filter */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Parent Type
                </label>
                <select
                  value={filterParentType}
                  onChange={(e) => setFilterParentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="All">All</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Expense">Expense</option>
                  <option value="Sale">Sale</option>
                  <option value="Credit Note">Credit Note</option>
                  <option value="Debit Note">Debit Note</option>
                </select>
              </div>

              {/* ITC Filter */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  ITC Eligibility
                </label>
                <select
                  value={filterITC}
                  onChange={(e) => setFilterITC(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="All">All</option>
                  <option value="ITC Eligible">ITC Eligible</option>
                  <option value="ITC Blocked">ITC Blocked</option>
                  <option value="Evaluate">Evaluate</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Search</label>
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                      Parent Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                      Sub-Type Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                      ITC Eligible
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                      GST Rule
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                      Account Head
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSubTypes.map((st) => (
                    <tr key={st.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={getParentTypeBadgeColor(st.parentType)}>
                          {st.parentType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-sm text-gray-900">{st.label}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {st.description}
                      </td>
                      <td className="px-4 py-3">{getITCBadge(st)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-sm">{st.itcRule}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{st.accountHead}</td>
                      <td className="px-4 py-3">
                        {st.isCustom ? (
                          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                            Custom ★
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                            System
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {st.isCustom && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivate(st)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Deactivate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredSubTypes.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-gray-500">No sub-types found matching your filters</p>
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredSubTypes.length} of {allSubTypes.length} sub-types
          </div>
        </TabsContent>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* TAB 2: ITC Quick Reference */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <TabsContent value="itc-reference" className="mt-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Input Tax Credit (ITC) Reference Guide
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                For CleanCar 360 — Car Washing Service Business
              </p>
            </div>

            {/* SECTION A: Always Eligible ITC */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                SECTION A — Always Eligible ITC
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-green-200">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-green-900 border-b border-green-200">
                        Category
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-green-900 border-b border-green-200">
                        Rule Reference
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-green-900 border-b border-green-200">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-green-50 border-b border-green-100">
                      <td className="px-4 py-2 text-sm">Consumables & Cleaning Supplies</td>
                      <td className="px-4 py-2 text-xs">Section 16</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        Microfiber cloths, shampoo, chemicals, cleaning agents — fully eligible
                      </td>
                    </tr>
                    <tr className="bg-green-50 border-b border-green-100">
                      <td className="px-4 py-2 text-sm">Spare Parts & Tools</td>
                      <td className="px-4 py-2 text-xs">Section 16</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        Tools, spare parts for equipment maintenance
                      </td>
                    </tr>
                    <tr className="bg-green-50 border-b border-green-100">
                      <td className="px-4 py-2 text-sm">IT & Software</td>
                      <td className="px-4 py-2 text-xs">Section 16</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        Computers, software licenses, ERP subscriptions
                      </td>
                    </tr>
                    <tr className="bg-green-50 border-b border-green-100">
                      <td className="px-4 py-2 text-sm">Office Supplies</td>
                      <td className="px-4 py-2 text-xs">Section 16</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        Stationery, printer cartridges, office furniture if used for business
                      </td>
                    </tr>
                    <tr className="bg-green-50 border-b border-green-100">
                      <td className="px-4 py-2 text-sm">Professional Fees</td>
                      <td className="px-4 py-2 text-xs">Section 16</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        CA fees, legal fees, consultant fees (if vendor is GST registered)
                      </td>
                    </tr>
                    <tr className="bg-green-50 border-b border-green-100">
                      <td className="px-4 py-2 text-sm">Marketing & Advertising</td>
                      <td className="px-4 py-2 text-xs">Section 16</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        Meta ads, Google ads, printing, banners, pamphlets
                      </td>
                    </tr>
                    <tr className="bg-green-50 border-b border-green-100">
                      <td className="px-4 py-2 text-sm">Repairs & Maintenance</td>
                      <td className="px-4 py-2 text-xs">Section 16</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        Equipment servicing, office repairs (business assets)
                      </td>
                    </tr>
                    <tr className="bg-green-50 border-b border-green-100">
                      <td className="px-4 py-2 text-sm">Transport / GTA Charges</td>
                      <td className="px-4 py-2 text-xs">Section 16</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        Courier, goods transport, logistics (under RCM or forward charge)
                      </td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-4 py-2 text-sm">Rent</td>
                      <td className="px-4 py-2 text-xs">Section 16</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        If landlord is GST registered and charges GST
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION B: Always Blocked ITC */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                SECTION B — Always Blocked ITC — Section 17(5)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-red-200">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-red-900 border-b border-red-200">
                        Category
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-red-900 border-b border-red-200">
                        Rule Reference
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-red-900 border-b border-red-200">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-red-50 border-b border-red-100">
                      <td className="px-4 py-2 text-sm">Motor Vehicles</td>
                      <td className="px-4 py-2 text-xs">Section 17(5)(a)</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        Unless used for transportation of goods/passengers as core business
                      </td>
                    </tr>
                    <tr className="bg-red-50 border-b border-red-100">
                      <td className="px-4 py-2 text-sm">Uniform & Workwear</td>
                      <td className="px-4 py-2 text-xs">Section 17(5)(b)</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        Staff uniforms, protective gear — personal use items
                      </td>
                    </tr>
                    <tr className="bg-red-50 border-b border-red-100">
                      <td className="px-4 py-2 text-sm">Food & Beverages (Staff Welfare)</td>
                      <td className="px-4 py-2 text-xs">Section 17(5)(b)</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        Tea, refreshments, canteen expenses for personal consumption
                      </td>
                    </tr>
                    <tr className="bg-red-50 border-b border-red-100">
                      <td className="px-4 py-2 text-sm">Life / Health Insurance</td>
                      <td className="px-4 py-2 text-xs">Section 17(5)</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        ITC blocked on life and health insurance premiums
                      </td>
                    </tr>
                    <tr className="bg-red-50 border-b border-red-100">
                      <td className="px-4 py-2 text-sm">Fuel (Petrol/Diesel)</td>
                      <td className="px-4 py-2 text-xs">Outside GST scope</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        No ITC — petrol and diesel not notified under Section 9
                      </td>
                    </tr>
                    <tr className="bg-red-50">
                      <td className="px-4 py-2 text-sm">Electricity</td>
                      <td className="px-4 py-2 text-xs">Exempt supply</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        No GST charged on electricity bills — exempt/nil-rated
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION C: Evaluate with CA */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                SECTION C — Evaluate with CA
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-amber-200">
                  <thead className="bg-amber-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-amber-900 border-b border-amber-200">
                        Category
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-amber-900 border-b border-amber-200">
                        Rule Reference
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-amber-900 border-b border-amber-200">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-amber-50 border-b border-amber-100">
                      <td className="px-4 py-2 text-sm">Mobile Phone Charges</td>
                      <td className="px-4 py-2 text-xs">Section 16 / 17(5)</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        Business use eligible, personal use blocked — requires split
                      </td>
                    </tr>
                    <tr className="bg-amber-50 border-b border-amber-100">
                      <td className="px-4 py-2 text-sm">Vehicle Insurance</td>
                      <td className="px-4 py-2 text-xs">Varies</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        General business insurance may be eligible, workmen's compensation evaluate
                      </td>
                    </tr>
                    <tr className="bg-amber-50 border-b border-amber-100">
                      <td className="px-4 py-2 text-sm">Bank Charges</td>
                      <td className="px-4 py-2 text-xs">Section 16</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        Some charges have GST (eligible), some are exempt
                      </td>
                    </tr>
                    <tr className="bg-amber-50">
                      <td className="px-4 py-2 text-sm">Rent (Unregistered Landlord)</td>
                      <td className="px-4 py-2 text-xs">N/A</td>
                      <td className="px-4 py-2 text-xs text-gray-700">
                        No ITC available if landlord is not GST registered
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Disclaimer:</strong> This reference guide is for general guidance only. ITC
                eligibility can vary based on specific circumstances. Consult your Chartered
                Accountant before making ITC claims.
              </p>
              <p className="text-xs text-blue-700 mt-2">Last updated: April 2026</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Transaction Type Configurator Modal */}
      <TransactionTypeConfigurator
        open={showConfigurator}
        parentType={configuratorParentType}
        onClose={() => setShowConfigurator(false)}
        onConfirm={(newSubType) => {
          refreshSubTypes();
          setShowConfigurator(false);
          toast.success(`'${newSubType.label}' created successfully`);
        }}
      />
    </div>
  );
}
