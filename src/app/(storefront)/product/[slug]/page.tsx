import { ViewTransition } from "react";
import { ProductDetailSection } from "@/components/product-detail-section";
import { RelatedPiecesSection } from "@/components/related-pieces-section";
import { PAGE_TRANSITION } from "@/lib/motion";

// First PDP section, built from pasted screenshots (desktop + mobile). Every
// linked-to product on the site so far is the same placeholder ("22mm chain
// with custom clasp", Bracelets, $5,800/$7,650) — no real per-slug catalog
// query exists yet, so every slug still renders that same title/price/image.
// The description is the one field written to vary per product: 6 real,
// on-brand copy blocks (no more lorem ipsum) picked deterministically from
// the slug so the same slug always shows the same copy, and different slugs
// read as genuinely different products rather than one repeated placeholder.

const PLACEHOLDER_IMAGE = { src: "/placeholder-product.svg", alt: "Placeholder product" };

const DESCRIPTIONS = [
  "Every link on this piece is hand-finished and hand-set, one stone at a time, by jewelers who were doing this long before it was trending. The custom clasp isn't an afterthought — it's built to lock in tight and stay locked, whether you're in the studio, courtside, or just moving through your day. This is the kind of piece that earns a second look the longer someone watches it catch light. Solid weight, solid shine, no plating to wear thin over time. Built for the plug, not the display case.",
  "This one's made to be worn, not babied. Everyday-durable construction means it can ride with you through the gym, the block, and the after-party without losing its shape or its shine — no delicate clasp you're scared to touch, no finish that scuffs the first week. We test every piece the way you'll actually live in it, then set the stones after, not before. If it can't survive your day, it doesn't leave the shop. This one survives.",
  "Personalization is the whole point here. The clasp, the length, the finish — every detail can be dialed in to fit exactly how you move and what you're going for, so what lands on your neck or wrist isn't off a rack, it's yours. Our team walks every custom order through by hand before it ships, checking fit and finish against the original spec, not just a photo. Nobody else is walking around with this exact piece.",
  "Some pieces are built to get passed down. This is one of them. The kind of chain a father hands to a son, or a piece someone saves for a decade before it means what it's supposed to mean. We build with that in mind — solid construction under the shine, nothing that's just for the photo. Wear it now, hand it off later, and it'll still look right on both ends of that story.",
  "We don't run big batches of this one. Small runs, tighter quality control, and a finish our jewelers can actually stand behind on every single unit instead of the average of a thousand. That means fewer of these are out there, and the ones that are out there were checked by hand before they left the bench. If you're after something your circle isn't already wearing, this is where you start looking.",
  "Built to stack, not just to stand alone. The proportions and finish on this piece are cut to sit clean next to whatever else you've already got in rotation — layered chains, a watch, a ring — without fighting for attention or clashing in the light. Buy it as your first piece or your fifth; either way it's built to play well with the rest of your collection, not compete with it.",
];

function pickDescription(slug: string) {
  const hash = Array.from(slug).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return DESCRIPTIONS[hash % DESCRIPTIONS.length];
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <ViewTransition {...PAGE_TRANSITION}>
      <div className="flex flex-1 flex-col gap-(--space-12) py-(--space-9)">
        <ProductDetailSection
          images={[PLACEHOLDER_IMAGE, PLACEHOLDER_IMAGE, PLACEHOLDER_IMAGE]}
          category="Bracelets"
          title="22mm chain with custom clasp"
          price={5800}
          compareAtPrice={7650}
          isFromPrice
          description={pickDescription(slug)}
        />
        <RelatedPiecesSection />
      </div>
    </ViewTransition>
  );
}
