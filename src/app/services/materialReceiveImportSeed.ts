/**
 * materialReceiveImportSeed — real, one-time import of genuine historical
 * purchase/material-receipt data supplied by the business (source file:
 * Material_Receive_1.xlsx), imported as real GRN records into the same
 * storage GRN Entry and Goods Receipt already read from and write to
 * ("cleancar_grn_records") — not a separate demo dataset.
 *
 * 38 real source rows were reviewed line by line before this seed was
 * written. 29 were clean and imported as-is. The remaining 9 needed a
 * real decision, confirmed directly with the business before this file
 * was written - not guessed:
 *   - SR.No 9  (T-shirts): source row had no bill number, no supplier
 *     name, and no rate. Filled with mock data, clearly labeled
 *     "[MOCK]" in the supplier name and a "MOCK-BILL-" prefixed
 *     challan number, so this one real gap in the source data stays
 *     visibly distinguishable from genuine supplier records.
 *   - SR.No 29 (foam cannon accessory): zero quantity and zero rate in
 *     the source - filled with a reasonable mock quantity/rate, same
 *     "MOCK-BILL-" labeling.
 *   - SR.No 30/32 and 35/38: confirmed as duplicate entries in the
 *     source file - only the first of each pair was imported.
 *   - SR.No 31, 35, 36, 37, 38: the source file had corrupted dates
 *     (missing digits, or stored as clock-time values instead of
 *     dates) - real corrected dates were confirmed before import.
 *
 * Two fields were added to the real GRN item shape that GRNEntry.tsx's
 * own single-item creation doesn't set (unitRate, lineTotal), since
 * this real historical data actually has genuine per-item pricing
 * worth preserving - purely additive, nothing existing reads or
 * depends on these fields, so this doesn't change any current behavior.
 */

import { DataService } from "./DataService";

const SEED_VERSION_KEY = "cleancar_material_receive_import_v1";

export function seedMaterialReceiveImport(cityId?: string) {
  try {
    if (localStorage.getItem(SEED_VERSION_KEY) === "DONE") return;

    const importedGRNs = [
  {
    "grnNumber": "GRN-IMPORT-001",
    "supplierName": "GT Exim Solutions",
    "challanNumber": "8485",
    "grnDate": "2026-05-11",
    "status": "Accepted",
    "totalAccepted": 2050.0,
    "totalRejected": 0,
    "totalValue": 53865.0,
    "items": [
      {
        "id": 1,
        "itemName": "Microfiber Cloth 40X40 CM 250 GSM",
        "receivedThisDelivery": 1000.0,
        "acceptedQuantity": 1000.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Nos",
        "unitRate": 16.15,
        "lineTotal": 16150.0
      },
      {
        "id": 2,
        "itemName": "Microfiber Cloth 40X40 CM 530 GSM Edgeless",
        "receivedThisDelivery": 500.0,
        "acceptedQuantity": 500.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Nos",
        "unitRate": 40.85,
        "lineTotal": 20425.0
      },
      {
        "id": 3,
        "itemName": "Microfiber Cloth 40X40 CM 300 GSM Glass Cloth",
        "receivedThisDelivery": 500.0,
        "acceptedQuantity": 500.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Nos",
        "unitRate": 31.35,
        "lineTotal": 15675.0
      },
      {
        "id": 4,
        "itemName": "Microfiber Sponge 13 CM Diameter",
        "receivedThisDelivery": 50.0,
        "acceptedQuantity": 50.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Nos",
        "unitRate": 32.3,
        "lineTotal": 1615.0
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-002",
    "supplierName": "Apparel Source Surat [MOCK]",
    "challanNumber": "MOCK-BILL-0916",
    "grnDate": "2026-05-16",
    "status": "Accepted",
    "totalAccepted": 498.0,
    "totalRejected": 0,
    "totalValue": 89640.0,
    "items": [
      {
        "id": 1,
        "itemName": "T-shirt Size S\"M\"L\"XL\"XXL",
        "receivedThisDelivery": 498.0,
        "acceptedQuantity": 498.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Nos",
        "unitRate": 180.0,
        "lineTotal": 89640.0
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-003",
    "supplierName": "Auto ease carcare company",
    "challanNumber": "FY26-27/321",
    "grnDate": "2026-05-20",
    "status": "Accepted",
    "totalAccepted": 645.0,
    "totalRejected": 0,
    "totalValue": 138238.77,
    "items": [
      {
        "id": 1,
        "itemName": "Vista 4 in 1 Dresser-50 l",
        "receivedThisDelivery": 200.0,
        "acceptedQuantity": 200.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Ltr",
        "unitRate": 288.1356,
        "lineTotal": 57627.12
      },
      {
        "id": 2,
        "itemName": "Aspire Tyre GLO - 5 Ltr",
        "receivedThisDelivery": 200.0,
        "acceptedQuantity": 200.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Ltr",
        "unitRate": 161.01,
        "lineTotal": 32202.0
      },
      {
        "id": 3,
        "itemName": "Vista Snowfoam Shampoo 50 Ltr",
        "receivedThisDelivery": 200.0,
        "acceptedQuantity": 200.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Ltr",
        "unitRate": 161.01,
        "lineTotal": 32202.0
      },
      {
        "id": 4,
        "itemName": "Vista Hioshine Wax - 250Grm",
        "receivedThisDelivery": 45.0,
        "acceptedQuantity": 45.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Nos",
        "unitRate": 360.17,
        "lineTotal": 16207.65
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-004",
    "supplierName": "Starq Retells",
    "challanNumber": "MOCK-BILL-2905",
    "grnDate": "2026-05-21",
    "status": "Accepted",
    "totalAccepted": 5.0,
    "totalRejected": 0,
    "totalValue": 2250.0,
    "items": [
      {
        "id": 1,
        "itemName": "Professional foam cannon with 1.1mm orifice",
        "receivedThisDelivery": 5.0,
        "acceptedQuantity": 5.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Nos",
        "unitRate": 450.0,
        "lineTotal": 2250.0
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-005",
    "supplierName": "Starq Retells",
    "challanNumber": "SR/2133/26-27",
    "grnDate": "2026-05-21",
    "status": "Accepted",
    "totalAccepted": 5.0,
    "totalRejected": 0,
    "totalValue": 14915.24,
    "items": [
      {
        "id": 1,
        "itemName": "High Pressure Washer-Turbowash(DOUBLE)",
        "receivedThisDelivery": 2.0,
        "acceptedQuantity": 2.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 1525.42,
        "lineTotal": 3050.84
      },
      {
        "id": 2,
        "itemName": "High Pressure Washer-Turbomax",
        "receivedThisDelivery": 1.0,
        "acceptedQuantity": 1.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 5508.47,
        "lineTotal": 5508.47
      },
      {
        "id": 3,
        "itemName": "High Pressure Washer ST-1",
        "receivedThisDelivery": 1.0,
        "acceptedQuantity": 1.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 2542.37,
        "lineTotal": 2542.37
      },
      {
        "id": 4,
        "itemName": "High Pressure Washer ST-5",
        "receivedThisDelivery": 1.0,
        "acceptedQuantity": 1.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 3813.56,
        "lineTotal": 3813.56
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-006",
    "supplierName": "Shree Suppliers",
    "challanNumber": "SS-310/26-27",
    "grnDate": "2026-06-04",
    "status": "Accepted",
    "totalAccepted": 5.0,
    "totalRejected": 0,
    "totalValue": 12500.0,
    "items": [
      {
        "id": 1,
        "itemName": "Car Washing Bag (Size 15x14x23 inch)",
        "receivedThisDelivery": 5.0,
        "acceptedQuantity": 5.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 2500.0,
        "lineTotal": 12500.0
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-007",
    "supplierName": "Prachi Pet",
    "challanNumber": "PP/26-27/01437",
    "grnDate": "2026-06-05",
    "status": "Accepted",
    "totalAccepted": 2080.0,
    "totalRejected": 0,
    "totalValue": 7839.0,
    "items": [
      {
        "id": 1,
        "itemName": "200ml Bottle(Empty)",
        "receivedThisDelivery": 1040.0,
        "acceptedQuantity": 1040.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 5.65,
        "lineTotal": 5876.0
      },
      {
        "id": 2,
        "itemName": "24mm Fortun Cup",
        "receivedThisDelivery": 520.0,
        "acceptedQuantity": 520.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 1.0,
        "lineTotal": 520.0
      },
      {
        "id": 3,
        "itemName": "24mm Pump",
        "receivedThisDelivery": 260.0,
        "acceptedQuantity": 260.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 4.0,
        "lineTotal": 1040.0
      },
      {
        "id": 4,
        "itemName": "24mm Fliptop Cup",
        "receivedThisDelivery": 260.0,
        "acceptedQuantity": 260.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 1.55,
        "lineTotal": 403.0
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-008",
    "supplierName": "Starq Retells",
    "challanNumber": "Sr/2192/26-27",
    "grnDate": "2026-06-08",
    "status": "Accepted",
    "totalAccepted": 20.0,
    "totalRejected": 0,
    "totalValue": 90042.3,
    "items": [
      {
        "id": 1,
        "itemName": "High Pressure Washer-Turbomax",
        "receivedThisDelivery": 15.0,
        "acceptedQuantity": 15.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 5508.47,
        "lineTotal": 82627.05
      },
      {
        "id": 2,
        "itemName": "Starq Tornado Cordless Vacuum Cleaner ",
        "receivedThisDelivery": 5.0,
        "acceptedQuantity": 5.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 1483.05,
        "lineTotal": 7415.25
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-009",
    "supplierName": "Ri Linen And Uniforms Cretions",
    "challanNumber": "169",
    "grnDate": "2026-06-11",
    "status": "Accepted",
    "totalAccepted": 1.0,
    "totalRejected": 0,
    "totalValue": 430.0,
    "items": [
      {
        "id": 1,
        "itemName": "Unifrom Shirt",
        "receivedThisDelivery": 1.0,
        "acceptedQuantity": 1.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 430.0,
        "lineTotal": 430.0
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-010",
    "supplierName": "Ri Linen And Uniforms Cretions",
    "challanNumber": "244",
    "grnDate": "2026-06-11",
    "status": "Accepted",
    "totalAccepted": 89.0,
    "totalRejected": 0,
    "totalValue": 38270.0,
    "items": [
      {
        "id": 1,
        "itemName": "Unifrom Shirt",
        "receivedThisDelivery": 89.0,
        "acceptedQuantity": 89.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 430.0,
        "lineTotal": 38270.0
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-011",
    "supplierName": "Ri Linen And Uniforms Cretions",
    "challanNumber": "253",
    "grnDate": "2026-06-11",
    "status": "Accepted",
    "totalAccepted": 23.0,
    "totalRejected": 0,
    "totalValue": 9890.0,
    "items": [
      {
        "id": 1,
        "itemName": "Unifrom Shirt",
        "receivedThisDelivery": 23.0,
        "acceptedQuantity": 23.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 430.0,
        "lineTotal": 9890.0
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-012",
    "supplierName": "Ideal Technoplast Industries Limited ",
    "challanNumber": "202627416",
    "grnDate": "2026-06-18",
    "status": "Accepted",
    "totalAccepted": 80.0,
    "totalRejected": 0,
    "totalValue": 22000.0,
    "items": [
      {
        "id": 1,
        "itemName": "25 Ltr Square Container",
        "receivedThisDelivery": 80.0,
        "acceptedQuantity": 80.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 275.0,
        "lineTotal": 22000.0
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-013",
    "supplierName": "Patel electri corporation",
    "challanNumber": "807/26-27",
    "grnDate": "2026-06-20",
    "status": "Accepted",
    "totalAccepted": 100.0,
    "totalRejected": 0,
    "totalValue": 3445.0,
    "items": [
      {
        "id": 1,
        "itemName": "KEI 2C X SQ MM COPP FLEXI (2 core wire cable 100 mtr)",
        "receivedThisDelivery": 100.0,
        "acceptedQuantity": 100.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Mtr",
        "unitRate": 34.45,
        "lineTotal": 3445.0
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-014",
    "supplierName": "AG tech exim",
    "challanNumber": "GT-532",
    "grnDate": "2026-06-25",
    "status": "Accepted",
    "totalAccepted": 1.0,
    "totalRejected": 0,
    "totalValue": 593.22,
    "items": [
      {
        "id": 1,
        "itemName": "DP-63 Foam Cannon",
        "receivedThisDelivery": 1.0,
        "acceptedQuantity": 1.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 593.22,
        "lineTotal": 593.22
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-015",
    "supplierName": "Patel& CO.",
    "challanNumber": "182",
    "grnDate": "2026-06-29",
    "status": "Accepted",
    "totalAccepted": 19.25,
    "totalRejected": 0,
    "totalValue": 1732.5,
    "items": [
      {
        "id": 1,
        "itemName": "Print Sheet 249 Carwashing",
        "receivedThisDelivery": 19.25,
        "acceptedQuantity": 19.25,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "kg",
        "unitRate": 90.0,
        "lineTotal": 1732.5
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-016",
    "supplierName": "Auto ease carcare company",
    "challanNumber": "FY26-27/698",
    "grnDate": "2026-07-02",
    "status": "Accepted",
    "totalAccepted": 40.0,
    "totalRejected": 0,
    "totalValue": 9067.72,
    "items": [
      {
        "id": 1,
        "itemName": "Vista  General Purpose Cleaner-5L(Interior pro Cleaner) 4 cane",
        "receivedThisDelivery": 20.0,
        "acceptedQuantity": 20.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Ltr",
        "unitRate": 224.576,
        "lineTotal": 4491.52
      },
      {
        "id": 2,
        "itemName": "Vista Glass Cleaner 10 Ltr(Crystal Finish)",
        "receivedThisDelivery": 20.0,
        "acceptedQuantity": 20.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Ltr",
        "unitRate": 228.81,
        "lineTotal": 4576.2
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-017",
    "supplierName": "Pahal Ventura",
    "challanNumber": "PV2627-49",
    "grnDate": "2026-07-06",
    "status": "Accepted",
    "totalAccepted": 400.0,
    "totalRejected": 0,
    "totalValue": 8800.0,
    "items": [
      {
        "id": 1,
        "itemName": "Custom 2x2 Car Tags",
        "receivedThisDelivery": 400.0,
        "acceptedQuantity": 400.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 22.0,
        "lineTotal": 8800.0
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-018",
    "supplierName": "Starq Retells",
    "challanNumber": "SR/2432/26-27",
    "grnDate": "2026-07-10",
    "status": "Accepted",
    "totalAccepted": 5.0,
    "totalRejected": 0,
    "totalValue": 12711.85,
    "items": [
      {
        "id": 1,
        "itemName": "High Pressure Washer ST-1",
        "receivedThisDelivery": 5.0,
        "acceptedQuantity": 5.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 2542.37,
        "lineTotal": 12711.85
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-019",
    "supplierName": "metro electricals",
    "challanNumber": "-",
    "grnDate": "2026-07-14",
    "status": "Accepted",
    "totalAccepted": 5.0,
    "totalRejected": 0,
    "totalValue": 17800.0,
    "items": [
      {
        "id": 1,
        "itemName": "vacume cleaner",
        "receivedThisDelivery": 5.0,
        "acceptedQuantity": 5.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 3560.0,
        "lineTotal": 17800.0
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-020",
    "supplierName": "AG tech exim",
    "challanNumber": "AG-600",
    "grnDate": "2026-07-15",
    "status": "Accepted",
    "totalAccepted": 20.0,
    "totalRejected": 0,
    "totalValue": 10678.0,
    "items": [
      {
        "id": 1,
        "itemName": "DP-63 Foam Cannon",
        "receivedThisDelivery": 20.0,
        "acceptedQuantity": 20.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Nos",
        "unitRate": 533.9,
        "lineTotal": 10678.0
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-021",
    "supplierName": "Shree Suppliers",
    "challanNumber": "SS-551/26-27",
    "grnDate": "2026-07-18",
    "status": "Accepted",
    "totalAccepted": 100.0,
    "totalRejected": 0,
    "totalValue": 151200.0,
    "items": [
      {
        "id": 1,
        "itemName": "Customized Delivery Bag",
        "receivedThisDelivery": 100.0,
        "acceptedQuantity": 100.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 1512.0,
        "lineTotal": 151200.0
      }
    ]
  },
  {
    "grnNumber": "GRN-IMPORT-022",
    "supplierName": "Starq Retells",
    "challanNumber": "SR/2485/26-27",
    "grnDate": "2026-07-20",
    "status": "Accepted",
    "totalAccepted": 10.0,
    "totalRejected": 0,
    "totalValue": 25423.7,
    "items": [
      {
        "id": 1,
        "itemName": "High pressure washer ST-1",
        "receivedThisDelivery": 10.0,
        "acceptedQuantity": 10.0,
        "rejectedQuantity": 0,
        "condition": "Good",
        "storageLocation": "Main Store",
        "unit": "Pcs",
        "unitRate": 2542.37,
        "lineTotal": 25423.7
      }
    ]
  }
];

    const existing = JSON.parse(localStorage.getItem("cleancar_grn_records") || "[]");
    localStorage.setItem("cleancar_grn_records", JSON.stringify([...importedGRNs, ...existing]));

    localStorage.setItem(SEED_VERSION_KEY, "DONE");
    console.info(`[materialReceiveImportSeed] Imported ${importedGRNs.length} real GRN records (${importedGRNs.reduce((s: number, g: any) => s + g.items.length, 0)} line items).`);
  } catch (err) {
    console.error("[materialReceiveImportSeed] Import failed, GRN records unaffected:", err);
  }
}
