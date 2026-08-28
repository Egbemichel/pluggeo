"use client";

import { useRef, type Ref } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ArrowUpRight03Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { CopyBlock } from "@/components/ui/copy-block";
import { useViewportEnter } from "@/hooks/use-viewport-enter";
import { useReveal } from "@/hooks/use-reveal";
import { EASE, MOTION_QUERY, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Built from screenshots the user pasted directly — no Figma node this time, so
// proportions are approximated from the images, not measured. Desktop is an
// asymmetric "bento" grid (3 small tiles + a tall Watches tile across the top row,
// a large Grillz tile + Sets + a copy block filling the rest); mobile is a single
// stacked column. The corner arrow icon (Hugeicons ArrowUpRight03Icon) is inferred
// from the visual, not confirmed against a Figma layer name — flag if a real node
// ever surfaces for this section. Every tile uses the placeholder image per the
// user's instruction; swap in real category photography later.
//
// 2026-08-25 QA pass: tile label bumped text-h6 (16px) -> text-h4 (28px) — a real
// screenshot showed it clearly larger than the h6 guess. Best-effort, unconfirmed.
//
// Entrance: desktop tiles fade in from a direction matching their position in the
// bento grid (top row from above, the tall right column from the right, the large
// Grillz block from the left, the bottom-right Sets/copy from below) so the layout
// visually "assembles" rather than popping in uniformly, per the user. Mobile
// "stacks like bricks" — same up/fade treatment applied per-tile via useReveal,
// walking the existing DOM order top to bottom (already 2-top-then-stack, no
// layout change needed to get that shape). Run-once, same as the Hero collage.

export type CategoryTile = {
  id: string;
  label: string;
  href: string;
};

const DEFAULT_TILES: CategoryTile[] = [
  { id: "bracelets", label: "Bracelets", href: "/category/bracelets" },
  { id: "pendants", label: "Pendants", href: "/category/pendants" },
  { id: "chains", label: "Chains", href: "/category/chains" },
  { id: "watches", label: "Watches", href: "/category/watches" },
  { id: "grillz", label: "Grillz", href: "/grillz" },
  { id: "sets", label: "Sets", href: "/category/sets" },
];

const PLACEHOLDER_IMAGE = "/placeholder-product.svg";
const DESKTOP_STAGGER = 0.12;

function CategoryTileCard({
  tile,
  className,
  tileRef,
}: {
  tile: CategoryTile;
  className?: string;
  tileRef?: Ref<HTMLAnchorElement>;
}) {
  return (
    <Link
      ref={tileRef}
      href={tile.href}
      transitionTypes={["nav-forward"]}
      data-reveal-item
      className={cn(
        "relative flex flex-col overflow-hidden rounded-md border border-border-default bg-surface-primary transition-opacity hover:opacity-90",
        className
      )}
    >
      <div className="relative flex-1">
        <Image
          src={PLACEHOLDER_IMAGE}
          alt={tile.label}
          fill
          className="object-contain p-(--space-4)"
        />
      </div>
      <div className="absolute top-(--space-3) right-(--space-3) flex size-8 items-center justify-center rounded-full border border-black">
        <Icon icon={ArrowUpRight03Icon} size={16} className="text-brand-primary" />
      </div>
      <span className="absolute bottom-(--space-3) left-(--space-3) text-h4 font-heading font-bold text-brand-primary uppercase">
        {tile.label}
      </span>
    </Link>
  );
}

export type CategoryCollageProps = {
  tiles?: CategoryTile[];
  heading?: string;
  subheading?: string;
  body?: string;
  className?: string;
};

export function CategoryCollage({
  tiles = DEFAULT_TILES,
  heading = "Prestige in Every Piece",
  subheading = "WHERE LUXURY MEETS PRECISION",
  body = "Our jewelry is where fine craftsmanship meets modern style. Experience the luxury in every detail. Standout in each piece you wear.",
  className,
}: CategoryCollageProps) {
  const [bracelets, pendants, chains, watches, grillz, sets] = tiles;

  const mobileRef = useReveal<HTMLDivElement>({
    direction: "up",
    stagger: STAGGER.cards,
    distance: 40,
  });

  const braceletsRef = useRef<HTMLAnchorElement>(null);
  const pendantsRef = useRef<HTMLAnchorElement>(null);
  const chainsRef = useRef<HTMLAnchorElement>(null);
  const watchesRef = useRef<HTMLAnchorElement>(null);
  const grillzRef = useRef<HTMLAnchorElement>(null);
  const setsRef = useRef<HTMLAnchorElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  const desktopRef = useViewportEnter<HTMLDivElement>(() => {
    const els = {
      bracelets: braceletsRef.current,
      pendants: pendantsRef.current,
      chains: chainsRef.current,
      watches: watchesRef.current,
      grillz: grillzRef.current,
      sets: setsRef.current,
      copy: copyRef.current,
    };
    if (Object.values(els).some((el) => el === null)) return;

    const mm = gsap.matchMedia();

    mm.add(MOTION_QUERY.full, () => {
      const tl = gsap.timeline({ defaults: { ease: EASE.standard, duration: 0.65 } });
      const next = `>-${0.65 - DESKTOP_STAGGER}`;

      tl.fromTo(els.grillz, { opacity: 0, x: -56 }, { opacity: 1, x: 0, duration: 0.75 });
      tl.fromTo(els.bracelets, { opacity: 0, y: -40 }, { opacity: 1, y: 0 }, next);
      tl.fromTo(els.pendants, { opacity: 0, y: -40 }, { opacity: 1, y: 0 }, next);
      tl.fromTo(els.chains, { opacity: 0, y: -40 }, { opacity: 1, y: 0 }, next);
      tl.fromTo(els.watches, { opacity: 0, x: 56 }, { opacity: 1, x: 0 }, next);
      tl.fromTo(els.sets, { opacity: 0, x: 56 }, { opacity: 1, x: 0 }, next);
      tl.fromTo(els.copy, { opacity: 0, y: 40 }, { opacity: 1, y: 0 }, next);

      return () => {
        tl.kill();
      };
    });

    mm.add(MOTION_QUERY.reduced, () => {
      const tween = gsap.fromTo(Object.values(els), { opacity: 0 }, { opacity: 1, duration: 0.15 });
      return () => tween.kill();
    });

    return () => mm.revert();
  });

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Mobile: single stacked column */}
      <div ref={mobileRef} className="flex flex-col gap-(--space-6) md:hidden">
        <div className="grid grid-cols-2 gap-(--space-6)">
          <CategoryTileCard tile={bracelets} className="aspect-square" />
          <CategoryTileCard tile={pendants} className="aspect-square" />
        </div>
        <CategoryTileCard tile={watches} className="aspect-4/3" />
        <CategoryTileCard tile={sets} className="aspect-4/3" />
        <CategoryTileCard tile={grillz} className="aspect-square" />
        <CategoryTileCard tile={chains} className="aspect-4/3" />
        <div data-reveal-item>
          <CopyBlock heading={heading} subheading={subheading} body={body} />
        </div>
      </div>

      {/* Desktop: asymmetric bento grid */}
      <div
        ref={desktopRef}
        className="hidden md:grid md:aspect-668/426 md:gap-(--space-6)"
        style={{
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "repeat(4, 1fr)",
          gridTemplateAreas:
            '"bracelets pendants chains watches" "grillz grillz grillz watches" "grillz grillz grillz sets" "grillz grillz grillz copy"',
        }}
      >
        <CategoryTileCard tile={bracelets} tileRef={braceletsRef} className="[grid-area:bracelets]" />
        <CategoryTileCard tile={pendants} tileRef={pendantsRef} className="[grid-area:pendants]" />
        <CategoryTileCard tile={chains} tileRef={chainsRef} className="[grid-area:chains]" />
        <CategoryTileCard tile={watches} tileRef={watchesRef} className="[grid-area:watches]" />
        <CategoryTileCard tile={grillz} tileRef={grillzRef} className="[grid-area:grillz]" />
        <CategoryTileCard tile={sets} tileRef={setsRef} className="[grid-area:sets]" />
        <div ref={copyRef} className="flex flex-col justify-center gap-(--space-2) [grid-area:copy]">
          <CopyBlock heading={heading} subheading={subheading} body={body} />
        </div>
      </div>
    </div>
  );
}
