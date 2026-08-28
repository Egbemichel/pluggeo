import { RevealText } from "@/components/ui/reveal-text";
import { cn } from "@/lib/utils";

// Extracted from CategoryCollage's local `CategoryCopy` — the same light
// eyebrow-heading + bold Quinn subheading + body-text pattern is needed again
// for the Grillz page's closing "cast" section, so this is a shared component
// instead of a second near-identical copy of the same markup.
//
// `heading` uses the Section 2 text treatment (word stagger) per the approved
// animation plan; subheading/body stay plain fades, driven by whichever
// parent reveal (collage tile assembly, cast-section stagger) contains them.

export type CopyBlockProps = {
  heading: string;
  subheading: string;
  body: string;
  className?: string;
};

export function CopyBlock({ heading, subheading, body, className }: CopyBlockProps) {
  return (
    <div className={cn("flex flex-col gap-(--space-2)", className)}>
      <RevealText as="h3" className="text-h3 font-sans font-light text-black">
        {heading}
      </RevealText>
      <p className="text-h2 font-heading font-bold text-brand-primary">{subheading}</p>
      <p className="text-body-md font-sans font-normal text-text-secondary">{body}</p>
    </div>
  );
}
