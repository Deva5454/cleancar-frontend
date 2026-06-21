import { processIncomingMessage } from "./whatsappRescheduleHandler";
import { railwaySync } from "./railwaySyncService";
export interface IVRCallPayload { customerPhone: string; dtmfInput: string; callId: string; callDuration?: number; timestamp?: string; }
export interface IVRRescheduleResult { success: boolean; intent: "reschedule"|"cancel"|"unknown"; message: string; callId: string; }
export function handleIVRReschedule(payload: IVRCallPayload): IVRRescheduleResult {
  const { customerPhone, dtmfInput, callId } = payload;
  const intentMap: Record<string, string> = { "1": "RESCHEDULE", "2": "CANCEL", "0": "AGENT" };
  const intentWord = intentMap[dtmfInput] || dtmfInput.toUpperCase();
  const result = processIncomingMessage(customerPhone, intentWord, "IVR");
  railwaySync.reschedule({ source: "IVR", callId, customerPhone, dtmfInput, intent: result.intent, timestamp: payload.timestamp || new Date().toISOString() });
  return { success: result.intent !== "unknown", intent: result.intent as IVRRescheduleResult["intent"], message: result.replyText, callId };
}
export function simulateIVRCall(customerPhone: string, dtmfInput = "1"): IVRRescheduleResult {
  console.log(`[IVR Simulation] Call from ${customerPhone}, input: ${dtmfInput}`);
  return handleIVRReschedule({ customerPhone, dtmfInput, callId: `IVR-SIM-${Date.now()}`, timestamp: new Date().toISOString() });
}
export const ivrBridge = { handleIVRReschedule, simulateIVRCall };
if (import.meta.env.DEV) { (window as any).ivrBridge = ivrBridge; }
