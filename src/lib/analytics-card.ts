import type { DailyStats, Ranked } from "@/lib/analytics";

// Telegram "HTML" parse mode: only <b> <i> <pre> are used; all data is escaped.
const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const SEARCH_ENGINES = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|brave|baidu|yandex)\./i;
const SOCIAL =
  /(^|\.)(instagram|facebook|tiktok|twitter|x|t|pinterest|youtube|snapchat|reddit|threads|whatsapp|wa)\.(com|co|me|net)$/i;

function bar(value: number, max: number, width = 8): string {
  const filled = max > 0 ? Math.max(value > 0 ? 1 : 0, Math.round((value / max) * width)) : 0;
  return "▰".repeat(filled) + "▱".repeat(width - filled);
}

function delta(current: number, previous: number): string {
  if (previous === 0) return current === 0 ? "—" : "new";
  const change = Math.round(((current - previous) / previous) * 100);
  return change === 0 ? "▬ 0%" : `${change > 0 ? "▲" : "▼"} ${Math.abs(change)}%`;
}

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);
const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

function pathLabel(path: string): string {
  return path === "/" ? "Home" : path.length > 28 ? `${path.slice(0, 27)}…` : path;
}

function rankedBlock(items: Ranked[], format: (label: string) => string = (l) => l): string {
  if (!items.length) return "<i>no data yet</i>";
  const max = Math.max(...items.map((i) => i.count));
  const width = Math.min(Math.max(...items.map((i) => format(i.label).length), 4), 30);
  return `<pre>${items
    .map((i) => {
      const label = format(i.label);
      const cut = label.length > width ? `${label.slice(0, width - 1)}…` : label;
      return `${esc(cut.padEnd(width))} ${bar(i.count, max)} ${i.count}`;
    })
    .join("\n")}</pre>`;
}

export function buildInsights(s: DailyStats, now: Date): string[] {
  const out: string[] = [];
  const direct = Math.max(0, s.visitors - s.referredVisitors);
  const searchVisitors = s.sources
    .filter((x) => SEARCH_ENGINES.test(x.label))
    .reduce((sum, x) => sum + x.count, 0);
  const mobile = s.devices.find((d) => d.label === "mobile")?.count ?? 0;
  const us = s.countries.find((c) => c.label === "US")?.count ?? 0;
  const topProduct = s.topProducts[0];

  if (s.visitors === 0) {
    out.push(
      "No tracked visits in the last 24h. Share your best product on Instagram/TikTok today, and check that the site loads for you.",
    );
  } else {
    if (s.prevVisitors >= 5 && s.visitors < s.prevVisitors * 0.75) {
      out.push(
        `Traffic fell ${pct(s.prevVisitors - s.visitors, s.prevVisitors)}% vs the previous day. Post fresh content (a new drop, a customer photo, a short video) and link your top product.`,
      );
    }
    if (s.checkoutVisitors > 0 && s.orders === 0) {
      out.push(
        `${s.checkoutVisitors} visitor(s) reached checkout but nobody ordered. Place a test order and make sure payment options and shipping info are clear.`,
      );
    } else if (s.bagVisitors >= 3 && s.checkoutVisitors === 0) {
      out.push(
        `${s.bagVisitors} people opened their bag but none went to checkout. Show shipping time and your return policy near the checkout button.`,
      );
    }
    if (
      topProduct &&
      topProduct.visitors >= 3 &&
      !s.topOrdered.some((o) => o.label === topProduct.label)
    ) {
      out.push(
        `"${topProduct.label}" drew ${topProduct.visitors} visitors but no orders. Review its price, photos/video and options, then feature it on the home page.`,
      );
    }
    if (s.visitors >= 10 && pct(s.singlePageVisitors, s.visitors) > 65) {
      out.push(
        `${pct(s.singlePageVisitors, s.visitors)}% left after one page. Check the first screen on mobile: clear hero, fast load, a visible Shop button.`,
      );
    }
    if (s.visitors >= 10 && pct(mobile, s.visitors) > 65) {
      out.push(
        `${pct(mobile, s.visitors)}% of visitors are on phones. Test the whole buy flow on a phone and keep product videos short.`,
      );
    }
    if (s.visitors >= 10 && searchVisitors === 0) {
      out.push(
        "No Google/Bing visitors yet. Work through docs/SEO_CHECKLIST.md: Search Console, unique product copy, reviews, backlinks.",
      );
    }
    if (s.visitors >= 10 && pct(direct, s.visitors) > 70) {
      out.push(
        `${pct(direct, s.visitors)}% of visitors arrive "direct". Put your link in every social bio/post and tag links with ?utm_source= so sources show up here.`,
      );
    }
    if (s.visitors >= 10 && us / Math.max(1, s.visitors) < 0.5) {
      out.push(
        `Only ${pct(us, s.visitors)}% of visitors are from the US. If the US is your market, aim content, hashtags and ads at US audiences.`,
      );
    }
    if (s.visitors >= 10 && pct(s.newVisitors, s.visitors) > 90) {
      out.push(
        "Almost everyone is a first-time visitor. Capture them: Instagram follow prompts, a restock/drop-alert signup, or a WhatsApp broadcast list.",
      );
    }
  }

  const evergreen = [
    "Add one new photo or video to your best seller this week; fresh media lifts rankings and conversions.",
    "Ask your last 3 buyers for a photo and a review; social proof is the cheapest conversion boost.",
    "Write one short guide (e.g. how to size a Cuban link chain) and link it to the matching category.",
    "Post a 15-second product video on TikTok/Reels today with the product link in the bio.",
    "Reply to every WhatsApp/DM inquiry within the hour; speed wins jewelry sales.",
    "In Google Search Console, find queries where you rank 8-20 and improve those pages.",
    "Run a limited-time offer on your most-viewed product and announce it everywhere.",
  ];
  const dayIndex = Math.floor(now.getTime() / 86_400_000);
  if (out.length < 3) out.push(evergreen[dayIndex % evergreen.length]);
  return out.slice(0, 4);
}

export function renderTelegramCard(s: DailyStats, now: Date, timeZone = "UTC"): string {
  const fmt = (opts: Intl.DateTimeFormatOptions, d: Date) =>
    new Intl.DateTimeFormat("en-US", { timeZone, ...opts }).format(d);

  const dateLabel = fmt(
    { weekday: "short", month: "short", day: "numeric" },
    new Date(s.windowEnd.getTime() - 60_000),
  );
  const pagesPerVisit = s.visitors ? (s.pageViews / s.visitors).toFixed(1) : "0";
  const peak = [...s.hourly].sort((a, b) => b.count - a.count)[0];
  const direct = Math.max(0, s.visitors - s.referredVisitors);
  const sourceItems: Ranked[] = [
    ...(direct > 0 ? [{ label: "direct", count: direct }] : []),
    ...s.sources,
  ]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const sourceKind = (label: string) =>
    label === "direct"
      ? label
      : SEARCH_ENGINES.test(label)
        ? `${label} (search)`
        : SOCIAL.test(label)
          ? `${label} (social)`
          : label;

  const conversion = s.visitors ? ((s.orders / s.visitors) * 100).toFixed(1) : "0.0";
  const avgOrder = s.orders ? s.revenue / s.orders : 0;
  const insights = buildInsights(s, now);
  const newPct = pct(s.newVisitors, s.visitors);

  const lines: string[] = [
    "📊 <b>pluggeo&amp;co · Daily report</b>",
    `<i>${esc(dateLabel)} · last 24 hours</i>`,
    "",
    "━━━━━━━━ <b>TRAFFIC</b> ━━━━━━━━",
    `👥 <b>${s.visitors}</b> visitors   ${delta(s.visitors, s.prevVisitors)} vs previous day`,
    `📄 <b>${s.pageViews}</b> page views · ${pagesPerVisit} pages/visit`,
    `🆕 ${newPct}% new · ↩️ ${s.visitors ? 100 - newPct : 0}% returning`,
    `🚪 ${pct(s.singlePageVisitors, s.visitors)}% left after 1 page`,
    `📅 ${s.weekVisitors} visitors in the last 7 days`,
  ];
  if (peak) {
    lines.push(
      `⏰ Peak hour: <b>${esc(fmt({ hour: "numeric", hour12: true }, peak.hour))}</b> (${peak.count} visitors)`,
    );
  }

  lines.push(
    "",
    "🏆 <b>Most visited pages</b>",
    rankedBlock(s.topPages, pathLabel),
    "🛍 <b>Most viewed products</b>",
    rankedBlock(s.topProducts),
    "🔗 <b>Where visitors came from</b>",
    rankedBlock(sourceItems, sourceKind),
    "🌍 <b>Countries</b>",
    rankedBlock(s.countries),
    "📱 <b>Devices</b>",
    rankedBlock(s.devices),
    "",
    "━━━━━━━━ <b>SALES</b> ━━━━━━━━",
    `🧾 <b>${s.orders}</b> orders   ${delta(s.orders, s.prevOrders)}`,
    `💰 <b>${esc(money(s.revenue))}</b> order value   ${delta(s.revenue, s.prevRevenue)}`,
    `🎯 ${conversion}% of visitors ordered${s.orders ? ` · avg ${esc(money(avgOrder))}` : ""}`,
    `🛒 ${s.visitors} visitors → ${s.bagVisitors} opened bag → ${s.checkoutVisitors} reached checkout → ${s.orders} ordered`,
  );
  if (s.topOrdered.length) {
    lines.push("🔥 <b>Top sellers</b>", rankedBlock(s.topOrdered));
  }

  lines.push("", "━━━━━━ <b>WHAT TO DO NEXT</b> ━━━━━━");
  insights.forEach((tip, i) => lines.push(`${i + 1}. ${esc(tip)}`));

  const text = lines.join("\n");
  // Telegram's hard limit is 4096 characters.
  return text.length > 4000 ? `${text.slice(0, 3990)}…` : text;
}
