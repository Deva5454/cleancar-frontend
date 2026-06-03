/**
 * useFinanceForCurrentUser
 * Finance hook scoped to the current user's access level.
 *
 * FIX: Finance data RBAC — previously any role could see all city financials.
 * Super Admin, Admin, Finance roles see all cities.
 * City Manager and below see only their own city.
 */
import { useFinance } from "../contexts/FinanceContext";
import { useRole } from "../contexts/RoleContext";
import { useCity } from "../contexts/CityContext";

const ALL_CITIES_ROLES = ["Super Admin", "Admin", "Finance", "Accounts"];

export function useFinanceForCurrentUser() {
  const finance = useFinance();
  const { currentRole } = useRole();
  const { city } = useCity();

  const canSeeAllCities = ALL_CITIES_ROLES.includes(currentRole as string);
  const scopedCityId = canSeeAllCities ? undefined : city;

  const getRevenues = (month?: string) => {
    const all = scopedCityId ? finance.getRevenueByCity(scopedCityId) : finance.revenues;
    return month ? all.filter((r: any) => r.receivedDate?.startsWith(month)) : all;
  };

  const getPayables = (month?: string) => {
    const all = scopedCityId ? finance.getPayablesByCity(scopedCityId) : finance.payables;
    return month ? all.filter((p: any) => p.dueDate?.startsWith(month) || p.paidAt?.startsWith(month)) : all;
  };

  const getEBITDA = (month?: string) => {
    const cityId = scopedCityId || "ALL";
    return (finance as any).calculateEBITDAMargin
      ? (finance as any).calculateEBITDAMargin(cityId, month)
      : { amount: 0, margin: 0, revenue: 0, expenses: 0 };
  };

  const getMRR = (month?: string) => {
    const all = scopedCityId ? finance.getMRRByCity(scopedCityId) : finance.mrrData;
    return month ? all.filter((m: any) => m.month === month) : all;
  };

  return {
    ...finance,
    getRevenues,
    getPayables,
    getEBITDA,
    getMRR,
    scopedCityId,
    canSeeAllCities,
  };
}
