import { DataService } from "./DataService";
const RATINGS_KEY = "WASH_RATINGS";
export const ratingService = {
  submit(params) {
    const r = Math.max(1, Math.min(5, Math.round(params.rating)));
    const record = { ratingId: "RTG-" + Date.now().toString(36).toUpperCase(), ...params, rating: r, ratedAt: new Date().toISOString() };
    const all = DataService.get(RATINGS_KEY) || [];
    all.push(record);
    DataService.setAll(RATINGS_KEY, all);
    try { window.dispatchEvent(new CustomEvent("cc360:rating_received", { detail: record })); } catch {}
    if (r <= 2) { try { window.dispatchEvent(new CustomEvent("cc360:poor_rating_alert", { detail: record })); } catch {} }
    return record;
  },
  getAverageRating(cityId) { const all = (DataService.get(RATINGS_KEY)||[]).filter(r=>!cityId||r.cityId===cityId); return all.length ? Math.round(all.reduce((s,r)=>s+r.rating,0)/all.length*10)/10 : 0; },
  getRecentRatings(cityId, limit=20) { return (DataService.get(RATINGS_KEY)||[]).filter(r=>r.cityId===cityId).sort((a,b)=>new Date(b.ratedAt)-new Date(a.ratedAt)).slice(0,limit); },
};
export default ratingService;
