# SEO checklist: top 3 in the US for pluggeo&co's category

Honest framing first. Nobody can guarantee a top-3 ranking, and for the broad terms
("grillz", "Cuban link chain", "iced out watch") the first page is held by sites with years
of backlinks and reviews. The realistic path is to win a ladder of narrower searches first,
then climb to the broad ones: **long-tail keywords (3-6 months) → category terms (6-12
months) → head terms (12+ months, only with strong backlinks and reviews).** Everything
below is ordered by impact. Tick boxes as you go.

Legend: ✅ already built into the site (per PROGRESS.md), ☐ still to do.

---

## 0. Decide the battlefield (week 1)

- ☐ Pick **one primary category** to win first (e.g. custom grillz, or Cuban link chains,
  or iced-out watches). Spreading across every category slows all of them.
- ☐ For that category, list 30-50 keywords: head term, "custom ___", "buy ___ online",
  "___ near me", "___ for men", "___ price", "how much do ___ cost", "___ with diamonds",
  "VVS ___", "14k/10k gold ___", celebrity/style terms. Tools: Google autocomplete + "People
  also ask", Google Search Console (after setup), Ubersuggest/Keywords Everywhere (free tiers),
  Pinterest/TikTok search suggestions.
- ☐ Map **one keyword → one page**. Never aim two pages at the same keyword.
- ☐ Search your target keywords in an incognito window with a US VPN and note who ranks 1-5.
  Open their pages: what do they have that you lack (reviews, size guides, video, FAQs)?

## 1. Foundations (do once, this week)

- ✅ Per-page titles/meta descriptions, canonical URLs, OpenGraph, favicon
- ✅ `sitemap.xml` (DB-driven), `robots.txt`, web manifest
- ✅ JSON-LD: Organization, WebSite, BreadcrumbList, Product
- ☐ **Google Search Console**: add `pluggeoandco.shop` as a Domain property (DNS TXT record
  in Cloudflare), submit `https://pluggeoandco.shop/sitemap.xml`.
- ☐ **Bing Webmaster Tools** (import from Search Console in one click). Bing also feeds
  DuckDuckGo, Yahoo and ChatGPT search.
- ☐ **Google Merchant Center** + free product listings: get products into Google Shopping
  and the Images tab at no cost. Needs product feed (title, price, image, availability, GTIN
  or `identifier_exists=no` for custom pieces) plus a returns/shipping policy.
- ☐ **Google Business Profile** if you have any physical presence/pickup/studio address;
  otherwise skip (never fake an address).
- ☐ Make sure only one version of the site is indexable: `https://pluggeoandco.shop`
  (301 the `www` and the old `*.workers.dev` URL to it). Check in Search Console →
  Pages that nothing important is "Excluded".
- ☐ Add **Bing + Google verification** once, then never touch again.

## 2. Technical SEO (week 1-2)

- ☐ **Core Web Vitals**: run PageSpeed Insights on Home, a category and a product page
  (mobile). Targets: LCP < 2.5s, INP < 200ms, CLS < 0.1. Jewelry sites usually fail on
  huge images/videos: serve WebP/AVIF at the right size, lazy-load below the fold, never
  lazy-load the hero/LCP image, poster frames for videos.
- ☐ Every image has descriptive `alt` text ("14k yellow gold Cuban link chain 10mm, 22 inch")
  and descriptive file names, not `IMG_4021.jpg`.
- ☐ Product pages return **real HTTP 404/410** for deleted products and 301 for renamed slugs.
- ☐ No duplicate content across filter/sort URLs: filtered shop URLs (`?sort=`, `?price=`)
  should be `noindex` or canonical to the clean category URL.
- ☐ Internal links: every product is reachable within 3 clicks from Home and linked from its
  category, "related products" and at least one guide article.
- ☐ Breadcrumbs visible on-page (the JSON-LD is already there).
- ☐ Product structured data complete: `offers` (price, currency USD, availability, shipping
  and return policy), `brand`, `sku`, `image` (multiple), and later `aggregateRating`/`review`
  once you have **real** reviews (never invent ratings; Google penalises it).
- ☐ HTTPS everywhere ✅ (Cloudflare), HSTS on, no mixed content.
- ☐ Test with Search Console "URL Inspection" → "Test live URL" on key pages; request
  indexing for new products.

## 3. On-page SEO (per page, ongoing)

For each **category and product page**:

- ☐ **Title** (≤ 60 chars): `Primary keyword | modifier | pluggeo&co`, for example
  `Custom Gold Grillz, Made to Order | pluggeo&co`.
- ☐ **Meta description** (≤ 155 chars) with the keyword, a benefit and a call to action.
- ☐ One `H1` containing the keyword; `H2`s for sections (materials, sizing, shipping, care).
- ☐ **Unique description of 150-300+ words per product.** No copied supplier text. Cover
  material (10k/14k/18k, VVS/moissanite/lab diamond), dimensions/weight, how it's made,
  who it's for, sizing help, care, shipping/return summary.
- ☐ FAQ block (4-6 real questions) at the bottom of category pages and best sellers:
  "How do I measure my teeth for grillz?", "Is it real gold?", "How long does it take?".
  Add `FAQPage` JSON-LD only if the questions are visible on the page.
- ☐ Product video + 4-6 photos (on-body, close-up, scale, packaging). Engagement signals and
  conversion both improve.
- ☐ Show price, availability, delivery time and returns above the fold.
- ☐ Category pages get a 200-400 word intro written for humans, placed under the product grid.

## 4. Content that earns rankings (start week 2, 1-2 posts per week)

Create a `/guides` (or `/journal`) section and publish pages that answer buying questions.
Each should link to the matching category and 2-3 products.

- ☐ "How to size a Cuban link chain / bracelet / ring" (with a printable sizing chart)
- ☐ "Grillz: types, prices, how they're made, how to care for them"
- ☐ "10k vs 14k vs 18k gold: which should you buy?"
- ☐ "VVS vs VS vs moissanite vs lab diamond for iced-out jewelry"
- ☐ "How much do custom grillz cost in 2026?" (price pages attract buyers)
- ☐ "Gold-plated vs gold-filled vs solid gold" (and how to spot fake chains)
- ☐ "Jewelry gift guide for him/her" (seasonal; publish **6-8 weeks before** the holiday)
- ☐ Comparison/"best of" pages for your own products (honest, with real specs)
- Each article: 1,200+ words, original photos, an author name, a last-updated date,
  internal links, and a short summary at the top (this is what AI search engines quote).

## 5. Authority: backlinks and brand (the hard part; most of the work)

Rankings for competitive jewelry terms are decided mostly here.

- ☐ **Reviews first**: after every order, ask for a photo and review (WhatsApp/email).
  Put them on product pages and use a review platform Google trusts (Trustpilot, Google
  reviews via Merchant Center, Judge.me). Aim for 25+ real reviews before pushing hard.
- ☐ **Social proof content**: unboxing/customer videos, "ready to ship" clips; link to the
  product pages in every bio and caption. Social links rarely pass SEO value, but they
  create searches for your brand name, which does.
- ☐ **Rapper/stylist/influencer seeding**: send pieces to micro-influencers (10k-200k) in
  your niche in exchange for posts that **link to the product page** and a mention in their
  bio/Linktree. Track each with `?utm_source=name`.
- ☐ **Digital PR / link building** (aim for 3-5 quality links per month):
  - Local and niche press: hip-hop blogs, streetwear/fashion blogs, jeweler directories.
  - "Best custom grillz makers" and "best online jewelry stores" listicles: email the
    authors with your pieces and a sample.
  - HARO-style requests (Qwoted, Featured, Source of Sources) as a jewelry expert.
  - Podcasts/YouTube creators: offer a giveaway piece in exchange for a link in the
    description.
  - Supplier/partner/manufacturer pages that list stockists.
  - Fix broken links to competitors' dead pages and offer yours (broken-link building).
- ☐ **Citations / profiles** with consistent name-address-phone-URL: Pinterest, Instagram,
  TikTok, YouTube, X, Facebook, LinkedIn, Crunchbase, Yelp (if applicable), BBB (optional).
- ☐ Never buy cheap bulk links or PBN packages; they are the fastest way to get de-indexed.
- ☐ Use Search Console → Links to watch who links to you; disavow only obvious spam.

## 6. Trust and E-E-A-T (Google rewards real businesses)

- ☐ About page with the real story, who makes the pieces, studio/workshop photos.
- ☐ Contact page with working email/WhatsApp/phone, business hours and (if lawful) address.
- ☐ Clear **shipping, returns, warranty, authenticity and custom-order policies** (separate
  pages linked from the footer).
- ☐ Materials transparency: karat, weight, stone grade, certificate/appraisal availability.
- ☐ Privacy policy and terms pages.
- ☐ Real photos of real products, not stock or AI-generated pieces.

## 7. Off-site visibility channels (these feed SEO)

- ☐ **Pinterest**: pin every product and guide (jewelry performs very well; pins rank in
  Google Images for years).
- ☐ **YouTube Shorts / TikTok / Reels**: 3-5 short videos per week, each with a product link;
  YouTube videos rank in Google for "how to / review" searches.
- ☐ **Email/WhatsApp list**: collect addresses at checkout and via a drop-alert signup; repeat
  buyers are your cheapest sales.
- ☐ **Google Shopping free listings** (section 1) and, when profitable, a small
  Performance Max budget on your best sellers.

## 8. Measure weekly (this is where the Telegram report helps)

- ☐ Daily Telegram report (built): watch visitors, sources, top products, and conversion.
- ☐ Search Console weekly: impressions, clicks, average position per target keyword.
  Improve pages sitting at positions **8-20**; they are the quickest wins.
- ☐ Track rankings for your 10 priority keywords in a spreadsheet (US results, incognito).
- ☐ Monthly: Core Web Vitals report, new backlinks, pages indexed vs pages in the sitemap.
- ☐ Quarterly: refresh the top 10 pages (new photos, updated prices/FAQs, new date).

## 9. A realistic 90-day plan

| Weeks | Focus |
|---|---|
| 1 | Search Console + Bing + Merchant Center, keyword map, fix Core Web Vitals, product copy for the top 10 products |
| 2-4 | Write the first 4 guides, collect first 10 reviews, publish 10+ social videos, outreach to 20 sites/influencers |
| 5-8 | 8 more guides, 25+ reviews, 5-10 quality backlinks, Pinterest board per category, internal-link clean-up |
| 9-12 | Refresh pages stuck at positions 8-20, more PR, add FAQ schema, evaluate Shopping ads on best sellers |

Expect first meaningful organic traffic around month 2-3, and top-3 for long-tail
terms around months 4-8. Head terms depend almost entirely on how many quality sites
link to you and how many real reviews you have.
