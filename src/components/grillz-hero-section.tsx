import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/section-header";

// Grillz's "dedicated, bespoke layout" (see docs/ARCHITECTURE.md) hero — real
// assets from the user, transparent-PNG grill cutouts (not rectangular photos),
// in /public/assets/mobile and /public/assets/desktop:
//   grillz-home_1-{,mobile-}top.png    (1440x275 desktop, 393x99 mobile)
//   grillz-home_2-{,mobile-}bottom.png (1440x504 desktop, 393x134 mobile)
// Both PNGs already have the diamond pattern running edge-to-edge at their own
// top/bottom (no transparent margin there) — that's what gives the "grill
// continues past the frame" look, not a CSS crop. The top image isn't
// rendered here — per the user it needs to appear *above* the shared NavBar,
// which is impossible from page content (NavBar always renders before <main>
// in StorefrontLayout), so NavBar renders it itself; see
// GrillzTopBleedImage. The bottom image breaks out of <main>'s own side
// padding to run full-bleed, same technique. Bleed amounts aren't measured
// off a real Figma frame — flag if they read off once real content is in place.

export function GrillzHeroSection() {
  return (
    <section className="flex flex-col">
      <div className="flex flex-col items-center gap-(--space-7) py-(--space-12) text-center md:py-(--space-1)">
        <h1 className="text-h1 font-heading font-bold text-brand-primary md:text-display">
          Elevate your elegance
        </h1>
        <Button
          render={
            <Link href="/shop" transitionTypes={["nav-forward"]}>
              Shop now
            </Link>
          }
          height={64}
          textSize={28}
        />
      </div>

      <div className="relative -mx-6 aspect-393/134 -my-6 w-[calc(100%+48px)] md:-mx-10 md:aspect-1440/504 md:w-[calc(100%+80px)]">
        <Image
          src="/assets/mobile/grillz-home_2-mobile-bottom.webp"
          alt=""
          fill
          className="object-contain md:hidden"
        />
        <Image
          src="/assets/desktop/grillz-home_2-bottom.webp"
          alt=""
          fill
          className="hidden object-contain md:block"
        />
      </div>
      <SectionHeader
        title="Where artistry meets innovation"
        subtitle="EVERY GRILL IS TAILORED TO YOUR UNIQUE AURA"
        className="py-10"
      />
    </section>
  );
}
