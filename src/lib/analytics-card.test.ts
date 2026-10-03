import { describe, expect, it } from "vitest";

import type { DailyStats } from "./analytics";
import { buildInsights, renderTelegramCard } from "./analytics-card";

const now = new Date("2026-10-04T00:00:00Z");

const base: DailyStats = {
  windowStart: new Date("2026-10-03T00:00:00Z"),
  windowEnd: now,
  visitors: 128,
  prevVisitors: 100,
  pageViews: 410,
  prevPageViews: 300,
  weekVisitors: 640,
  newVisitors: 100,
  singlePageVisitors: 90,
  referredVisitors: 20,
  topPages: [
    { label: "/", count: 120 },
    { label: "/shop", count: 80 },
    { label: "/product/<b>x</b>", count: 40 },
  ],
  topProducts: [{ label: "Cuban Link Chain & Co", count: 40, visitors: 25 }],
  countries: [
    { label: "US", count: 40 },
    { label: "CM", count: 30 },
  ],
  sources: [{ label: "instagram.com", count: 12 }],
  devices: [
    { label: "mobile", count: 100 },
    { label: "desktop", count: 28 },
  ],
  hourly: [{ hour: new Date("2026-10-03T18:00:00Z"), count: 21 }],
  checkoutVisitors: 4,
  bagVisitors: 9,
  orders: 0,
  prevOrders: 1,
  revenue: 0,
  prevRevenue: 400,
  topOrdered: [],
};

describe("daily analytics card", () => {
  it("renders the key numbers and escapes HTML", () => {
    const card = renderTelegramCard(base, now);
    expect(card).toContain("<b>128</b> visitors");
    expect(card).toContain("▲ 28%");
    expect(card).toContain("Home");
    expect(card).toContain("Cuban Link Chain &amp; Co");
    expect(card).toContain("/product/&lt;b&gt;x&lt;/b&gt;");
    expect(card).toContain("instagram.com (social)");
    expect(card).toContain("WHAT TO DO NEXT");
    expect(card.length).toBeLessThan(4096);
  });

  it("flags checkout drop-off and unconverted top product", () => {
    const tips = buildInsights(base, now).join(" ");
    expect(tips).toContain("reached checkout but nobody ordered");
    expect(tips).toContain("drew 25 visitors but no orders");
  });

  it("handles a day with no traffic", () => {
    const empty: DailyStats = {
      ...base,
      visitors: 0,
      prevVisitors: 0,
      pageViews: 0,
      newVisitors: 0,
      singlePageVisitors: 0,
      referredVisitors: 0,
      topPages: [],
      topProducts: [],
      countries: [],
      sources: [],
      devices: [],
      hourly: [],
      checkoutVisitors: 0,
      bagVisitors: 0,
      prevOrders: 0,
      prevRevenue: 0,
    };
    expect(renderTelegramCard(empty, now)).toContain("no data yet");
    expect(buildInsights(empty, now)[0]).toContain("No tracked visits");
  });
});
