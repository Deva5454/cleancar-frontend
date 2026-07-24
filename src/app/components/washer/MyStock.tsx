import { MyStockContent } from "./MyStockContent";

/**
 * MyStock — desktop-routed entry point (inventory/my-stock). Renders
 * the shared, real MyStockContent with the Back button, since this is
 * reached via direct navigation, not a bottom-nav tab.
 *
 * See MyStockContent.tsx for the actual logic — this file previously
 * held that logic directly; it now lives in one shared place so the
 * mobile app's Stock tab (WasherMyStock.tsx) can render the exact same
 * real data and real actions instead of its own hardcoded copy
 * (STK-DEF-01 / STK-DEF-06).
 */
export function MyStock() {
  return <MyStockContent showBackButton />;
}

export default MyStock;
