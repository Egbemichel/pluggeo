import type { ComponentProps } from "react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { Divider } from "@/components/ui/divider";
import { cn } from "@/lib/utils";

// Built from the real Figma node (557:5083): black 1px border pill (rounded-md),
// search icon + vertical divider + text, Inter Light placeholder. That node's own
// instance was 1354x99 with a ~36px placeholder — clearly an oversized illustrative
// example (same pattern as the Button node), so this uses conventional input sizing
// instead of copying those literal dimensions. A second stray divider line existed
// further right in the source frame with nothing near it (likely an artifact of a
// wider, not-fully-visible layout) — not implemented, flagged rather than guessed.

export type SearchInputProps = Omit<ComponentProps<"input">, "type">;

export function SearchInput({ className, placeholder, ...props }: SearchInputProps) {
  return (
    <div
      className={cn(
        "flex h-12 items-center gap-(--space-4) rounded-md border border-black px-(--space-6)",
        className
      )}
    >
      <Icon icon={Search01Icon} size={20} strokeWidth={2} className="text-brand-primary" />
      <Divider orientation="vertical" length={20} />
      <input
        type="search"
        placeholder={placeholder ?? "Search"}
        className="text-body-md min-w-0 flex-1 bg-transparent font-sans font-light text-text-primary outline-none placeholder:text-text-secondary"
        {...props}
      />
    </div>
  );
}
