import Image from "next/image";

// Grillz's top hero image needs to render *above* the shared NavBar, not
// overlapping/behind it — per the user, correcting an earlier version that
// tried to fake that with a negative-margin overlap + z-index trick. Since
// NavBar always renders before <main> in StorefrontLayout, page content can
// never actually appear above it — so NavBar itself renders this (see its own
// "showBackButton"-gated block), prepended before its <nav> element, only on
// /grillz. `-mt-(--space-7)` cancels exactly the navbar wrapper's own top
// padding so the image sits flush with the true viewport top; `-mx-*` breaks
// out of that wrapper's horizontal padding the same way GrillzHeroSection's
// bottom image does. See that file for the real asset details (dimensions,
// why they're transparent PNGs not rectangular photos).

export function GrillzTopBleedImage() {
  return (
    <div className="relative -mx-6 -mt-(--space-7) aspect-393/99 w-[calc(100%+48px)] md:-mx-10 md:aspect-1440/275 md:w-[calc(100%+80px)]">
      <Image
        src="/assets/mobile/grillz-home_1-mobile-top.webp"
        alt=""
        fill
        priority
        fetchPriority="high"
        className="object-contain md:hidden"
      />
      <Image
        src="/assets/desktop/grillz-home_1-top.webp"
        alt=""
        fill
        priority
        fetchPriority="high"
        className="hidden object-contain md:block"
      />
    </div>
  );
}
