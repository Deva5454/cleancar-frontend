// PurchaseOrderPDF.tsx
//
// Real, client-side PO PDF generation — no backend involved. Takes a real
// PurchaseOrder record (materialRequisition.ts) as a prop and renders it,
// pulling company details from the single real source of truth
// (COMPANY_GST_CONFIG) rather than retyping them here.

import { Document, Page, View, Text, StyleSheet, Font, pdf } from "@react-pdf/renderer";
import { COMPANY_GST_CONFIG } from "../../services/gstComplianceService";
import type { PurchaseOrder } from "../../lib/materialRequisition";

const NAVY = "#1F4E79";
const LIGHT_BLUE = "#D6E4F0";

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 8, fontFamily: "Helvetica", color: "#111" },
  headerBox: { borderWidth: 1.2, borderColor: NAVY, padding: 6, marginBottom: 4 },
  companyName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: NAVY, textAlign: "center" },
  companySub: { fontSize: 8.5, textAlign: "center", marginTop: 2 },
  companyBold: { fontSize: 8.5, fontFamily: "Helvetica-Bold", textAlign: "center", marginTop: 2 },
  metaBox: { borderWidth: 1, borderColor: NAVY, padding: 4, marginBottom: 4, flexDirection: "row", justifyContent: "space-between" },
  metaRight: { textAlign: "right" },
  metaTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: NAVY },
  threeColBox: { flexDirection: "row", borderWidth: 1, borderColor: NAVY, marginBottom: 4 },
  col: { flex: 1, padding: 5, borderRightWidth: 0.6, borderRightColor: NAVY },
  colLast: { flex: 1, padding: 5 },
  colHead: { fontSize: 8, fontFamily: "Helvetica-Bold", color: NAVY, marginBottom: 3 },
  colLine: { fontSize: 7, lineHeight: 1.4 },
  note: { fontSize: 7, fontStyle: "italic", marginBottom: 4 },
  table: { borderWidth: 1, borderColor: NAVY, marginBottom: 4 },
  tRowHead: { flexDirection: "row", backgroundColor: NAVY },
  tRow: { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: NAVY },
  thCell: { padding: 3, fontSize: 7, fontFamily: "Helvetica-Bold", color: "#fff", textAlign: "center" },
  tdCell: { padding: 3, fontSize: 7, borderRightWidth: 0.4, borderRightColor: NAVY },
  tdCellR: { padding: 3, fontSize: 7, textAlign: "right", borderRightWidth: 0.4, borderRightColor: NAVY },
  splitRow: { flexDirection: "row", marginBottom: 4 },
  deliveryBox: { flex: 0.45, paddingRight: 6 },
  amtBox: { flex: 0.55, borderWidth: 1, borderColor: NAVY },
  amtRow: { flexDirection: "row", borderBottomWidth: 0.4, borderBottomColor: NAVY },
  amtRowLast: { flexDirection: "row", backgroundColor: LIGHT_BLUE },
  amtLabel: { flex: 0.62, padding: 3, fontSize: 7.5 },
  amtValue: { flex: 0.38, padding: 3, fontSize: 7.5, textAlign: "right" },
  amtLabelBold: { flex: 0.62, padding: 3, fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  amtValueBold: { flex: 0.38, padding: 3, fontSize: 7.5, textAlign: "right", fontFamily: "Helvetica-Bold" },
  wordsLine: { fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  termsBox: { borderWidth: 1, borderColor: NAVY, padding: 6 },
  termsHead: { fontSize: 8, fontFamily: "Helvetica-Bold", color: NAVY, marginBottom: 3 },
  termsLine: { fontSize: 7, lineHeight: 1.35, marginBottom: 1 },
  sigRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  sigName: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  sigCaption: { fontSize: 7, marginTop: 2 },
  footer: { fontSize: 7, fontStyle: "italic", color: NAVY, textAlign: "center", marginTop: 6 },
});

function inr(n: number | undefined): string {
  return (n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface PurchaseOrderPDFProps {
  po: PurchaseOrder;
  indentCode?: string;
  deliveryAddress?: string;
  createdByName?: string;
  authorisedByName?: string;
}

export function PurchaseOrderPDF({ po, indentCode, deliveryAddress, createdByName, authorisedByName }: PurchaseOrderPDFProps) {
  const cgstTotal = po.cgstTotal ?? po.items.reduce((s, i) => s + (i.cgst || 0), 0);
  const sgstTotal = po.sgstTotal ?? po.items.reduce((s, i) => s + (i.sgst || 0), 0);
  const igstTotal = po.igstTotal ?? po.items.reduce((s, i) => s + (i.igst || 0), 0);
  const taxableTotal = po.items.reduce((s, i) => s + (i.taxableValue ?? i.amount ?? 0), 0);
  const discTotal = po.items.reduce((s, i) => s + ((i.amount || 0) * ((i.discountPct || 0) / 100)), 0);
  const terms = po.termsSnapshot && po.termsSnapshot.length > 0 ? po.termsSnapshot : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBox}>
          <Text style={styles.companyName}>{COMPANY_GST_CONFIG.companyName}</Text>
          <Text style={styles.companySub}>HO: Plot 14, Business Bay, Vesu, Surat, Gujarat, India, 395007</Text>
          <Text style={styles.companyBold}>GST No : {COMPANY_GST_CONFIG.gstin}</Text>
        </View>

        {/* Meta */}
        <View style={styles.metaBox}>
          <View />
          <View style={styles.metaRight}>
            <Text style={styles.metaTitle}>PURCHASE ORDER</Text>
            <Text>PO NO : {po.poNumber}</Text>
            {indentCode ? <Text>Indent Code : {indentCode}</Text> : null}
            <Text>PO Date : {po.dateIssued}</Text>
          </View>
        </View>

        {/* Supplier / Delivery / Billing */}
        <View style={styles.threeColBox}>
          <View style={styles.col}>
            <Text style={styles.colHead}>Supplier Details</Text>
            <Text style={styles.colLine}>Supplier Name : {po.vendorName}</Text>
            <Text style={styles.colLine}>Address : {po.vendorAddress || "—"}</Text>
            <Text style={styles.colLine}>PAN : {po.vendorPan || "—"}   GST NO : {po.vendorGstin || "—"}</Text>
            <Text style={styles.colLine}>Contact Name : {po.vendorContactName || "—"}</Text>
            <Text style={styles.colLine}>Contact No : {po.vendorContactPhone || "—"}</Text>
            <Text style={styles.colLine}>Contact Email : {po.vendorContactEmail || "—"}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.colHead}>Delivery Details</Text>
            <Text style={styles.colLine}>Delivery At : {deliveryAddress || "Central Store, Vesu, Surat"}</Text>
            <Text style={styles.colLine}>Expected Delivery : {po.expectedDelivery}</Text>
          </View>
          <View style={styles.colLast}>
            <Text style={styles.colHead}>Billing Details</Text>
            <Text style={styles.colLine}>Company Name : {COMPANY_GST_CONFIG.companyName}</Text>
            <Text style={styles.colLine}>Address : Plot 14, Business Bay, Vesu, Surat, Gujarat - 395007</Text>
            <Text style={styles.colLine}>GSTIN : {COMPANY_GST_CONFIG.gstin}</Text>
          </View>
        </View>

        <Text style={styles.note}>Please, arrange to provide the described goods strictly as per terms &amp; conditions mentioned in this Purchase Order.</Text>

        {/* Items table */}
        <View style={styles.table}>
          <View style={styles.tRowHead}>
            <Text style={[styles.thCell, { flex: 0.4 }]}>Sr.No</Text>
            <Text style={[styles.thCell, { flex: 2.6, textAlign: "left" }]}>Product Description / HSN</Text>
            <Text style={[styles.thCell, { flex: 0.6 }]}>Qty</Text>
            <Text style={[styles.thCell, { flex: 0.6 }]}>UOM</Text>
            <Text style={[styles.thCell, { flex: 0.9 }]}>Rate</Text>
            <Text style={[styles.thCell, { flex: 0.9 }]}>Taxable</Text>
            <Text style={[styles.thCell, { flex: 0.7 }]}>Tax</Text>
            <Text style={[styles.thCell, { flex: 0.9 }]}>Net Amount</Text>
          </View>
          {po.items.map((item, i) => {
            const tax = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);
            return (
              <View style={styles.tRow} key={i}>
                <Text style={[styles.tdCell, { flex: 0.4, textAlign: "center" }]}>{i + 1}</Text>
                <View style={{ flex: 2.6, padding: 3, borderRightWidth: 0.4, borderRightColor: NAVY }}>
                  <Text>{item.itemName}</Text>
                  {item.hsnCode ? <Text style={{ fontSize: 6.5, color: "#555" }}>HSN {item.hsnCode}</Text> : null}
                </View>
                <Text style={[styles.tdCellR, { flex: 0.6 }]}>{item.quantity}</Text>
                <Text style={[styles.tdCell, { flex: 0.6, textAlign: "center" }]}>{item.unit}</Text>
                <Text style={[styles.tdCellR, { flex: 0.9 }]}>{inr(item.rate)}</Text>
                <Text style={[styles.tdCellR, { flex: 0.9 }]}>{inr(item.taxableValue ?? item.amount)}</Text>
                <Text style={[styles.tdCellR, { flex: 0.7 }]}>{inr(tax)}</Text>
                <Text style={[styles.tdCellR, { flex: 0.9, borderRightWidth: 0 }]}>{inr(item.netAmount ?? item.amount)}</Text>
              </View>
            );
          })}
        </View>

        {/* Delivery terms + amount summary */}
        <View style={styles.splitRow}>
          <View style={styles.deliveryBox}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: NAVY, marginBottom: 2 }}>Delivery Terms :</Text>
            <Text style={styles.colLine}>Delivery At : {deliveryAddress || "Central Store, Vesu, Surat"}</Text>
            <Text style={styles.colLine}>Transport : Free Delivery At Site</Text>
            <Text style={styles.colLine}>Loading/Unloading : Included</Text>
          </View>
          <View style={styles.amtBox}>
            <View style={styles.amtRow}><Text style={styles.amtLabel}>PO Basic Amount:</Text><Text style={styles.amtValue}>{inr(po.totalAmount)}</Text></View>
            <View style={styles.amtRow}><Text style={styles.amtLabel}>TOTAL DISC. AMT:</Text><Text style={styles.amtValue}>{inr(discTotal)}</Text></View>
            <View style={styles.amtRow}><Text style={styles.amtLabel}>TOTAL AFTER DISC. AMT:</Text><Text style={styles.amtValue}>{inr(taxableTotal)}</Text></View>
            <View style={styles.amtRow}><Text style={styles.amtLabel}>TOTAL TAX AMT:</Text><Text style={styles.amtValue}>{inr(po.gst)}</Text></View>
            <View style={styles.amtRowLast}><Text style={styles.amtLabelBold}>TOTAL NET AMT:</Text><Text style={styles.amtValueBold}>{inr(po.grandTotal)}</Text></View>
          </View>
        </View>

        {/* Tax breakup */}
        <View style={styles.table}>
          <View style={styles.tRowHead}>
            <Text style={[styles.thCell, { flex: 0.4 }]}>No.</Text>
            <Text style={[styles.thCell, { flex: 1.4, textAlign: "left" }]}>Tax Name</Text>
            <Text style={[styles.thCell, { flex: 0.7 }]}>Tax %</Text>
            <Text style={[styles.thCell, { flex: 1.2 }]}>Taxable Value</Text>
            <Text style={[styles.thCell, { flex: 1.2 }]}>Tax Amount</Text>
          </View>
          {cgstTotal > 0 && (
            <View style={styles.tRow}>
              <Text style={[styles.tdCell, { flex: 0.4, textAlign: "center" }]}>1</Text>
              <Text style={[styles.tdCell, { flex: 1.4 }]}>INPUT CGST</Text>
              <Text style={[styles.tdCellR, { flex: 0.7 }]}>{COMPANY_GST_CONFIG.defaultServiceGstRate / 2}</Text>
              <Text style={[styles.tdCellR, { flex: 1.2 }]}>{inr(taxableTotal)}</Text>
              <Text style={[styles.tdCellR, { flex: 1.2, borderRightWidth: 0 }]}>{inr(cgstTotal)}</Text>
            </View>
          )}
          {sgstTotal > 0 && (
            <View style={styles.tRow}>
              <Text style={[styles.tdCell, { flex: 0.4, textAlign: "center" }]}>2</Text>
              <Text style={[styles.tdCell, { flex: 1.4 }]}>INPUT SGST</Text>
              <Text style={[styles.tdCellR, { flex: 0.7 }]}>{COMPANY_GST_CONFIG.defaultServiceGstRate / 2}</Text>
              <Text style={[styles.tdCellR, { flex: 1.2 }]}>{inr(taxableTotal)}</Text>
              <Text style={[styles.tdCellR, { flex: 1.2, borderRightWidth: 0 }]}>{inr(sgstTotal)}</Text>
            </View>
          )}
          {igstTotal > 0 && (
            <View style={styles.tRow}>
              <Text style={[styles.tdCell, { flex: 0.4, textAlign: "center" }]}>1</Text>
              <Text style={[styles.tdCell, { flex: 1.4 }]}>INPUT IGST</Text>
              <Text style={[styles.tdCellR, { flex: 0.7 }]}>{COMPANY_GST_CONFIG.defaultServiceGstRate}</Text>
              <Text style={[styles.tdCellR, { flex: 1.2 }]}>{inr(taxableTotal)}</Text>
              <Text style={[styles.tdCellR, { flex: 1.2, borderRightWidth: 0 }]}>{inr(igstTotal)}</Text>
            </View>
          )}
        </View>

        {/* Terms & conditions — the real, editable snapshot */}
        {terms.length > 0 && (
          <View style={styles.termsBox}>
            <Text style={styles.termsHead}>Other Terms &amp; conditions</Text>
            {terms.map((t, i) => (
              <Text style={styles.termsLine} key={i}>{i + 1}. {t}</Text>
            ))}
          </View>
        )}

        {/* Signatures */}
        <View style={styles.sigRow}>
          <View>
            <Text style={styles.sigName}>{createdByName || "—"}</Text>
            <Text style={styles.sigCaption}>Created By</Text>
          </View>
          <View>
            <Text style={styles.sigName}>{authorisedByName || "—"}</Text>
            <Text style={styles.sigCaption}>Authorised By</Text>
          </View>
        </View>
        <Text style={styles.footer}>24/9 Car Wash &ndash; Every Wash, Done Right.</Text>
      </Page>
    </Document>
  );
}

/** Real helper — generates the PDF as a Blob and triggers a browser download. */
export async function downloadPurchaseOrderPDF(props: PurchaseOrderPDFProps): Promise<void> {
  const blob = await pdf(<PurchaseOrderPDF {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${props.po.poNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
