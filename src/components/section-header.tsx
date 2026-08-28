import Link from "next/link";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { RevealText } from "@/components/ui/reveal-text";
import { cn } from "@/lib/utils";

// Built from the real Figma node (603:658, "Bestsellers" header). Mobile layout
// corrected 2026-08-25 against a real screenshot of "Bracelet/Pendant Collection"
// (had been guessed from a verbal description before that, and guessed wrong): on
// mobile, "View all" stays visible inline next to the title — only the chevron nav
// relocates below the section's content (product grid), centered and touch-sized.
// `SectionCarouselNav` is exported separately for that relocated copy.
//
// Layout: row 1 is [title (+ subtitle inline, desktop only)] ... [View all]
// (view all always visible; chevron only inline on desktop). Row 2 (mobile only) is
// the subtitle, since it doesn't fit inline there. `viewAllHref`/`onPrev`/`onNext`
// are all independently optional — how "Our categories" reuses this with just
// title+subtitle, no button/nav.
//
// Title bumped from text-h3 (30px, an unconfirmed guess made while rate-limited)
// to text-h2 (48px) — a real Figma screenshot of "Bestsellers" showed it clearly
// larger than the h3 guess. "View all" button size was also a guess (16px text in
// a 49px pill left it looking thin/disproportionate) — bumped to better fill the
// pill. Both flagged as best-effort until real Figma data is available again.

export type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
};

export function SectionCarouselNav({
  onPrev,
  onNext,
  className,
  forceVisible = false,
}: {
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
  /** Keep the nav rendered (buttons disabled) even when neither direction can
   * page — CelebrityShowcase's mobile media nav uses this so the control doesn't
   * disappear entirely just because the currently-selected celebrity only has 2
   * media items; every other caller keeps the default (hide when unusable). */
  forceVisible?: boolean;
}) {
  if (!forceVisible && !onPrev && !onNext) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-(--space-3) rounded-full border border-black px-(--space-4) py-(--space-2)",
        className
      )}
    >
      <button
        type="button"
        aria-label="Previous"
        onClick={onPrev}
        disabled={!onPrev}
        className="flex size-10 items-center justify-center disabled:opacity-30"
      >
        <Icon icon={ArrowLeft01Icon} size={20} className="text-brand-primary" />
      </button>
      <button
        type="button"
        aria-label="Next"
        onClick={onNext}
        disabled={!onNext}
        className="flex size-10 items-center justify-center disabled:opacity-30"
      >
        <Icon icon={ArrowRight01Icon} size={20} className="text-brand-primary" />
      </button>
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  viewAllHref,
  onPrev,
  onNext,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-(--space-2)", className)}>
      <div className="flex items-baseline justify-between gap-(--space-4)">
        <div className="flex flex-wrap items-baseline gap-(--space-4)">
          <RevealText as="h2" className="text-h2 font-heading font-bold text-brand-primary">
            {title}
          </RevealText>
          {subtitle && (
            <RevealText
              as="span"
              className="hidden text-body-lg font-sans font-normal text-text-secondary md:inline"
            >
              {subtitle}
            </RevealText>
          )}
        </div>

        {(viewAllHref || onPrev || onNext) && (
          <div className="flex items-center gap-(--space-6)">
            {viewAllHref && (
              <Button
                render={
                  <Link href={viewAllHref} transitionTypes={["nav-forward"]}>
                    View all
                  </Link>
                }
                height={51}
                textSize={22}
              />
            )}
            <SectionCarouselNav onPrev={onPrev} onNext={onNext} className="hidden md:flex" />
          </div>
        )}
      </div>

      {subtitle && (
        <RevealText
          as="span"
          className="text-body-lg font-sans font-normal text-text-secondary md:hidden"
        >
          {subtitle}
        </RevealText>
      )}
    </div>
  );
}
