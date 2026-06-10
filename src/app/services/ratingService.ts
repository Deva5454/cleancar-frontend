import { DataService } from "./DataService";
const RATINGS_KEY = "WASH_RATINGS";
export interface WashRating { ratingId: string; jobId: string; subscriptionId?: string; customerId: string; customerName: string; customerPhone: string; washerId?: string; supervisorId?: string; rating: 1|2|3|4|5; ratingLabel: string; feedback?: string; source: "WHATSAPP"|"APP"|"IVR"; ratedAt: string; cityId: string; planLabel?: string; }
const LABELS: Record<number,string> = { 5:"Excellent 🌟", 4:"Good 👍", 3:"Average 😐", 2:"Poor 👎", 1:"Very Poor 😞" };
function genId() { return "RTG-" + Date.now().toString(36).toUpperCase(); }
export const ratingService = {
  submit(params: { jobId: string; subscriptionId?: string; customerId: string; customerName: string; customerPhone: string; washerId?: string; supervisorId?: string; rating: number; feedback?: string; source?: WashRating["source"]; cityId: string; planLabel?: string; }): WashRating {
    const r = Math.max(1, Math.min(5, Math.round(params.rating))) as 1|2|3|4|5;
    const record: WashRating = { ratingId: genId(), ...params, rating: r, ratingLabel: LABELS[r], source: params.source || "WHATSAPP", ratedAt: new Date().toISOString() };
    const all = DataService.get<WashRating>(RATINGS_KEY) || [];
    all.push(record);
    DataService.setAll(RATINGS_KEY, all);
    try { window.dispatchEvent(new CustomEvent("cc360:rating_received", { detail: record })); } catch {}
    if (r <= 2) { try { window.dispatchEvent(new CustomEvent("cc360:poor_rating_alert", { detail: record })); } catch {} }
    return record;
  },
  processWARating(customerPhone: string, messageText: string, cityId: string): boolean {
    const rating = parseInt(messageText.trim());
    if (isNaN(rating) || rating < 1 || rating > 5) return false;
    try {
      const jobs = DataService.get<any>("JOBS", cityId) || [];
      const customers = DataService.get<any>("CUSTOMERS") || [];
      const cust = customers.find((c: any) => (c.phone||"").replace(/\D/g,"").slice(-10) === customerPhone.replace(/\D/g,"").slice(-10));
      if (!cust) return false;
      const recentJob = jobs.filter((j: any) => j.customerId === cust.customerId && j.status === "Completed").sort((a: any,b: any) => new Date(b.completedAt||0).getTime() - new Date(a.completedAt||0).getTime())[0];
      if (!recentJob) return false;
      const existing = DataService.get<WashRating>(RATINGS_KEY) || [];
      if (existing.find(r => r.jobId === recentJob.jobId)) return false;
      this.submit({ jobId: recentJob.jobId, subscriptionId: recentJob.subscriptionId, customerId: cust.customerId, customerName: `${cust.firstName||""} ${cust.lastName||""}`.trim(), customerPhone, washerId: recentJob.washerId, supervisorId: recentJob.supervisorId, rating, source: "WHATSAPP", cityId, planLabel: recentJob.packageName });
      return true;
    } catch { return false; }
  },
  getAverageRating(cityId?: string): number {
    const all = (DataService.get<WashRating>(RATINGS_KEY)||[]).filter(r => !cityId || r.cityId === cityId);
    if (!all.length) return 0;
    return Math.round((all.reduce((s,r) => s+r.rating,0)/all.length)*10)/10;
  },
  getRecentRatings(cityId: string, limit = 20): WashRating[] {
    return (DataService.get<WashRating>(RATINGS_KEY)||[]).filter(r => r.cityId===cityId).sort((a,b) => new Date(b.ratedAt).getTime()-new Date(a.ratedAt).getTime()).slice(0,limit);
  },
  getPoorRatings(cityId: string): WashRating[] {
    return (DataService.get<WashRating>(RATINGS_KEY)||[]).filter(r => r.cityId===cityId && r.rating<=2);
  },
};
export default ratingService;
