import { sql } from "drizzle-orm";

import { db } from "@/db";

export type Ranked = { label: string; count: number };

export type DailyStats = {
  windowStart: Date;
  windowEnd: Date;
  visitors: number;
  prevVisitors: number;
  pageViews: number;
  prevPageViews: number;
  weekVisitors: number;
  newVisitors: number;
  singlePageVisitors: number;
  referredVisitors: number;
  topPages: Ranked[];
  topProducts: Array<Ranked & { visitors: number }>;
  countries: Ranked[];
  sources: Ranked[];
  devices: Ranked[];
  hourly: Array<{ hour: Date; count: number }>;
  checkoutVisitors: number;
  bagVisitors: number;
  orders: number;
  prevOrders: number;
  revenue: number;
  prevRevenue: number;
  topOrdered: Ranked[];
};

type Row = Record<string, unknown>;

async function rows(query: ReturnType<typeof sql>): Promise<Row[]> {
  const result = await db.execute(query);
  return result.rows as Row[];
}

const num = (value: unknown) => Number(value ?? 0);

export async function collectDailyStats(windowEnd: Date): Promise<DailyStats> {
  const DAY = 24 * 60 * 60 * 1000;
  const end = windowEnd.toISOString();
  const start = new Date(windowEnd.getTime() - DAY).toISOString();
  const prevStart = new Date(windowEnd.getTime() - 2 * DAY).toISOString();
  const weekStart = new Date(windowEnd.getTime() - 7 * DAY).toISOString();

  const inWindow = sql`created_at >= ${start}::timestamptz and created_at < ${end}::timestamptz`;

  const [
    totals,
    pages,
    products,
    countries,
    sources,
    devices,
    hourly,
    behaviour,
    funnel,
    sales,
    ordered,
    week,
  ] = await Promise.all([
    rows(sql`select
      count(*) filter (where created_at >= ${start}::timestamptz)::int as pv,
      count(distinct visitor_id) filter (where created_at >= ${start}::timestamptz)::int as visitors,
      count(*) filter (where created_at < ${start}::timestamptz)::int as prev_pv,
      count(distinct visitor_id) filter (where created_at < ${start}::timestamptz)::int as prev_visitors,
      count(distinct visitor_id) filter (where created_at >= ${start}::timestamptz and referrer_host is not null)::int as referred
      from page_views where created_at >= ${prevStart}::timestamptz and created_at < ${end}::timestamptz`),
    rows(sql`select path as label, count(*)::int as count from page_views
      where ${inWindow} group by path order by count desc, path limit 5`),
    rows(sql`select coalesce(p.name, v.product_slug) as label, count(*)::int as count,
      count(distinct v.visitor_id)::int as visitors
      from page_views v left join products p on p.slug = v.product_slug
      where v.product_slug is not null and v.created_at >= ${start}::timestamptz and v.created_at < ${end}::timestamptz
      group by 1 order by count desc, label limit 5`),
    rows(sql`select coalesce(country, 'unknown') as label, count(distinct visitor_id)::int as count
      from page_views where ${inWindow} group by 1 order by count desc, label limit 5`),
    rows(sql`select referrer_host as label, count(distinct visitor_id)::int as count
      from page_views where ${inWindow} and referrer_host is not null
      group by 1 order by count desc, label limit 6`),
    rows(sql`select device as label, count(distinct visitor_id)::int as count
      from page_views where ${inWindow} group by 1 order by count desc`),
    rows(sql`select date_trunc('hour', created_at) as hour, count(distinct visitor_id)::int as count
      from page_views where ${inWindow} group by 1 order by 1`),
    rows(sql`with v as (
        select visitor_id, count(*) as n from page_views where ${inWindow} group by visitor_id
      )
      select count(*) filter (where n = 1)::int as single,
        count(*) filter (where not exists (
          select 1 from page_views x where x.visitor_id = v.visitor_id and x.created_at < ${start}::timestamptz
        ))::int as new_visitors
      from v`),
    rows(sql`select
      count(distinct visitor_id) filter (where path = '/checkout')::int as checkout,
      count(distinct visitor_id) filter (where path = '/bag')::int as bag
      from page_views where ${inWindow}`),
    rows(sql`select
      count(*) filter (where created_at >= ${start}::timestamptz)::int as orders,
      coalesce(sum(total) filter (where created_at >= ${start}::timestamptz), 0)::float as revenue,
      count(*) filter (where created_at < ${start}::timestamptz)::int as prev_orders,
      coalesce(sum(total) filter (where created_at < ${start}::timestamptz), 0)::float as prev_revenue
      from orders where status <> 'failed'
      and created_at >= ${prevStart}::timestamptz and created_at < ${end}::timestamptz`),
    rows(sql`select oi.product_name as label, sum(oi.quantity)::int as count
      from order_items oi join orders o on o.id = oi.order_id
      where o.status <> 'failed' and o.created_at >= ${start}::timestamptz and o.created_at < ${end}::timestamptz
      group by oi.product_name order by count desc, label limit 3`),
    rows(sql`select count(distinct visitor_id)::int as visitors from page_views
      where created_at >= ${weekStart}::timestamptz and created_at < ${end}::timestamptz`),
  ]);

  const ranked = (list: Row[]): Ranked[] =>
    list.map((r) => ({ label: String(r.label), count: num(r.count) }));

  return {
    windowStart: new Date(start),
    windowEnd,
    visitors: num(totals[0]?.visitors),
    prevVisitors: num(totals[0]?.prev_visitors),
    pageViews: num(totals[0]?.pv),
    prevPageViews: num(totals[0]?.prev_pv),
    weekVisitors: num(week[0]?.visitors),
    newVisitors: num(behaviour[0]?.new_visitors),
    singlePageVisitors: num(behaviour[0]?.single),
    referredVisitors: num(totals[0]?.referred),
    topPages: ranked(pages),
    topProducts: products.map((r) => ({
      label: String(r.label),
      count: num(r.count),
      visitors: num(r.visitors),
    })),
    countries: ranked(countries),
    sources: ranked(sources),
    devices: ranked(devices),
    hourly: hourly.map((r) => ({ hour: new Date(String(r.hour)), count: num(r.count) })),
    checkoutVisitors: num(funnel[0]?.checkout),
    bagVisitors: num(funnel[0]?.bag),
    orders: num(sales[0]?.orders),
    prevOrders: num(sales[0]?.prev_orders),
    revenue: num(sales[0]?.revenue),
    prevRevenue: num(sales[0]?.prev_revenue),
    topOrdered: ranked(ordered),
  };
}

/** Keeps the table small: raw page views older than 180 days are not needed. */
export async function pruneOldPageViews(): Promise<void> {
  await db.execute(sql`delete from page_views where created_at < now() - interval '180 days'`);
}
