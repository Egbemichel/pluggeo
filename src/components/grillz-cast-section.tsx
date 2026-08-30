import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CopyBlock } from "@/components/ui/copy-block";

// Last section before the Footer on the Grillz page, per the user — real
// product-cast photos in /public/assets/{mobile,desktop} (cast-mobile.png
// 366x299, cast-desktop.png 605:490, exact aspect ratios read from each PNG's
// own IHDR chunk, same as the hero images). Reuses CopyBlock (extracted from
// CategoryCollage's local "CategoryCopy" once a second near-identical usage
// showed up here) for the eyebrow/subheading/body text. The eyebrow line is
// written pre-uppercased in source: it's Inter (font-sans), which — unlike
// Quinn (font-heading), which renders visually caps-like regardless of source
// case — respects real lowercase, so it needs to actually be typed in caps to
// match the reference. "Explore more"'s destination is unconfirmed (no PDP/
// info page built yet) — points at /shop like "Shop now" for now, flag if a
// different target was intended.

export function GrillzCastSection() {
  return (
    <section className="flex flex-col gap-(--space-7) py-(--space-13) md:grid md:grid-cols-2 md:items-center md:gap-(--space-9)">
      <div className="relative mx-auto aspect-366/299 w-full max-w-sm md:mx-0 md:aspect-605/490 md:max-w-none">
        <Image
          src="/assets/mobile/cast-mobile.webp"
          alt="Custom grillz cast"
          fill
          className="object-contain md:hidden"
        />
        <Image
          src="/assets/desktop/cast-desktop.webp"
          alt="Custom grillz cast"
          fill
          className="hidden object-contain md:block"
        />
      </div>

      <div className="flex flex-col gap-(--space-7)">
        <CopyBlock
          heading="FREE SHIPPING ON TODAY ORDERS"
          subheading="Choose your drip, customize, done"
          body="Our jewelry is where fine craftsmanship meets modern style. Experience the luxury in every detail. Standout in each piece you wear."
        />
        {/* Matches GrillzHeroSection's own "Shop now" button exactly (same
            height/textSize at both breakpoints there, so no responsive split
            needed here either) — the default small/rounded Button read too
            small and too round for this section, per the user. */}
        <div className="flex flex-wrap items-center gap-(--space-4)">
          <Button
            render={
              <Link href="/shop" transitionTypes={["nav-forward"]}>
                Shop now
              </Link>
            }
            height={64}
            textSize={28}
          />
          <Button
            render={
              <Link href="/shop" transitionTypes={["nav-forward"]}>
                Explore more
              </Link>
            }
            height={64}
            textSize={28}
          />
        </div>
      </div>
    </section>
  );
}
