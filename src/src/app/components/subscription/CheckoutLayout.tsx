/**
 * CheckoutLayout — NEW wrapper component
 * Provides the desktop sticky right-panel layout for checkout screens.
 * Import this and wrap your content + summary panel.
 *
 * Usage:
 *   <CheckoutLayout summary={<CheckoutSummary ... />}>
 *     <PlanSelectionScreen />
 *   </CheckoutLayout>
 *
 * On desktop: left scrolls, right summary is sticky.
 * On mobile: stacks vertically — summary appears below content.
 */

import { ReactNode } from "react";

interface CheckoutLayoutProps {
  children: ReactNode;
  summary: ReactNode;
}

export function CheckoutLayout({ children, summary }: CheckoutLayoutProps) {
  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "24px 20px",
        display: "grid",
        gridTemplateColumns: "1fr 340px",
        gap: 24,
        alignItems: "start",
      }}
      className="checkout-layout"
    >
      {/* LEFT — scrolls normally */}
      <div style={{ minWidth: 0 }}>
        {children}
      </div>

      {/* RIGHT — sticky summary panel */}
      <div
        style={{
          position: "sticky",
          top: 80, /* offset for the sticky nav header */
          background: "#fff",
          border: "1.5px solid #E5E7EB",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* coloured top strip */}
        <div style={{ background: "#1a0533", padding: "14px 18px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#AFA9EC", fontSize: 15 }}>✦</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>Order summary</span>
        </div>
        <div style={{ padding: "0 18px 18px" }}>
          {summary}
        </div>
      </div>

      {/* Responsive CSS — on small screens collapse to single column */}
      <style>{`
        @media (max-width: 768px) {
          .checkout-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
