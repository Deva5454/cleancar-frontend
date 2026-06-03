/**
 * Analytics Service - Business Analytics and Metrics Tracking
 *
 * Purpose:
 * - Track business events (conversions, revenue, etc.)
 * - Provide data for analytics dashboards
 * - Calculate KPIs and metrics
 * - Enable performance monitoring
 *
 * Usage:
 * ```typescript
 * AnalyticsService.track("LEAD_CONVERTED", {
 *   leadId: "LEAD-123",
 *   tseId: "TSE-001",
 *   revenue: 1599,
 *   source: "Website"
 * });
 * ```
 */

import { logger } from "./logger";

export interface AnalyticsEvent {
  eventId: string;
  timestamp: string;
  eventType: string;
  data: Record<string, any>;
}

export interface ConversionMetrics {
  totalConversions: number;
  totalRevenue: number;
  averageRevenue: number;
  conversionRate: number;
  topPerformers: Array<{
    tseId: string;
    tseName: string;
    conversions: number;
    revenue: number;
  }>;
  dailyTrend: Array<{
    date: string;
    conversions: number;
    revenue: number;
  }>;
  sourceBreakdown: Array<{
    source: string;
    conversions: number;
    percentage: number;
  }>;
}

class AnalyticsServiceClass {
  private events: AnalyticsEvent[] = [];
  private storageKey = "ANALYTICS_EVENTS";

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load events from localStorage
   */
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.events = JSON.parse(stored);
        logger.debug("AnalyticsService: Loaded events from storage", { count: this.events.length });
      }
    } catch (error) {
      logger.error("AnalyticsService: Failed to load events", error as Error);
    }
  }

  /**
   * Save events to localStorage
   */
  private saveToStorage() {
    try {
      // Keep only last 5000 events to prevent storage overflow
      const eventsToSave = this.events.slice(-5000);
      localStorage.setItem(this.storageKey, JSON.stringify(eventsToSave));
    } catch (error) {
      logger.error("AnalyticsService: Failed to save events", error as Error);
    }
  }

  /**
   * Track an analytics event
   */
  track(eventType: string, data: Record<string, any>): AnalyticsEvent {
    const event: AnalyticsEvent = {
      eventId: `EVENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      eventType,
      data,
    };

    this.events.push(event);
    this.saveToStorage();

    logger.debug("Analytics tracked", { eventType, data });

    return event;
  }

  /**
   * Get events by type
   */
  getEvents(eventType: string): AnalyticsEvent[] {
    return this.events.filter(e => e.eventType === eventType);
  }

  /**
   * Get events by date range
   */
  getEventsByDateRange(startDate: string, endDate: string, eventType?: string): AnalyticsEvent[] {
    return this.events.filter(event => {
      const eventDate = event.timestamp.split("T")[0];
      const matchesDate = eventDate >= startDate && eventDate <= endDate;
      const matchesType = !eventType || event.eventType === eventType;
      return matchesDate && matchesType;
    });
  }

  /**
   * Get conversion metrics for dashboard
   */
  getConversionMetrics(startDate?: string, endDate?: string): ConversionMetrics {
    // Filter conversion events
    let conversionEvents = this.getEvents("LEAD_CONVERTED");

    if (startDate && endDate) {
      conversionEvents = this.getEventsByDateRange(startDate, endDate, "LEAD_CONVERTED");
    }

    // Calculate total conversions and revenue
    const totalConversions = conversionEvents.length;
    const totalRevenue = conversionEvents.reduce((sum, e) => sum + (e.data.revenue || 0), 0);
    const averageRevenue = totalConversions > 0 ? totalRevenue / totalConversions : 0;

    // Calculate conversion rate from all leads vs converted leads
    const allLeadEvents = this.getEvents("LEAD_CREATED").length;
    const conversionRate = allLeadEvents > 0
      ? Math.round((totalConversions / allLeadEvents) * 100 * 10) / 10
      : 0;

    // Calculate TSE performance
    const tsePerformance = new Map<string, { name: string; conversions: number; revenue: number }>();

    conversionEvents.forEach(event => {
      const tseId = event.data.tseId || "UNKNOWN";
      const tseName = event.data.tseName || "Unknown TSE";
      const revenue = event.data.revenue || 0;

      if (!tsePerformance.has(tseId)) {
        tsePerformance.set(tseId, { name: tseName, conversions: 0, revenue: 0 });
      }

      const current = tsePerformance.get(tseId)!;
      current.conversions += 1;
      current.revenue += revenue;
    });

    const topPerformers = Array.from(tsePerformance.entries())
      .map(([tseId, data]) => ({
        tseId,
        tseName: data.name,
        conversions: data.conversions,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Calculate daily trend
    const dailyData = new Map<string, { conversions: number; revenue: number }>();

    conversionEvents.forEach(event => {
      const date = event.timestamp.split("T")[0];

      if (!dailyData.has(date)) {
        dailyData.set(date, { conversions: 0, revenue: 0 });
      }

      const current = dailyData.get(date)!;
      current.conversions += 1;
      current.revenue += event.data.revenue || 0;
    });

    const dailyTrend = Array.from(dailyData.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate source breakdown
    const sourceData = new Map<string, number>();

    conversionEvents.forEach(event => {
      const source = event.data.source || "Unknown";
      sourceData.set(source, (sourceData.get(source) || 0) + 1);
    });

    const sourceBreakdown = Array.from(sourceData.entries())
      .map(([source, conversions]) => ({
        source,
        conversions,
        percentage: (conversions / totalConversions) * 100,
      }))
      .sort((a, b) => b.conversions - a.conversions);

    return {
      totalConversions,
      totalRevenue,
      averageRevenue,
      conversionRate,
      topPerformers,
      dailyTrend,
      sourceBreakdown,
    };
  }

  /**
   * Get TSE performance leaderboard
   */
  getTSELeaderboard(startDate?: string, endDate?: string) {
    let events = this.getEvents("LEAD_CONVERTED");

    if (startDate && endDate) {
      events = this.getEventsByDateRange(startDate, endDate, "LEAD_CONVERTED");
    }

    const tsePerformance = new Map<string, {
      name: string;
      conversions: number;
      revenue: number;
      avgDealSize: number;
    }>();

    events.forEach(event => {
      const tseId = event.data.tseId || "UNKNOWN";
      const tseName = event.data.tseName || "Unknown TSE";
      const revenue = event.data.revenue || 0;

      if (!tsePerformance.has(tseId)) {
        tsePerformance.set(tseId, {
          name: tseName,
          conversions: 0,
          revenue: 0,
          avgDealSize: 0,
        });
      }

      const current = tsePerformance.get(tseId)!;
      current.conversions += 1;
      current.revenue += revenue;
      current.avgDealSize = current.revenue / current.conversions;
    });

    return Array.from(tsePerformance.entries())
      .map(([tseId, data]) => ({ tseId, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Clear old events (older than N days)
   */
  clearOldEvents(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffISO = cutoffDate.toISOString();

    const beforeCount = this.events.length;
    this.events = this.events.filter(event => event.timestamp >= cutoffISO);
    const afterCount = this.events.length;

    this.saveToStorage();

    logger.log("AnalyticsService: Cleared old events", {
      removed: beforeCount - afterCount,
      remaining: afterCount,
    });
  }
}

export const AnalyticsService = new AnalyticsServiceClass();
