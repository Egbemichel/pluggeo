"use client";

import { createElement, Fragment } from "react";
import { useReveal, type RevealDirection } from "@/hooks/use-reveal";
import { STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";

// The literal "Section 2" text treatment — headings/section headers/PDP
// labels wrap their text in this instead of each hand-rolling a word-split.
// Splits on whitespace, wraps each word in an inline-block span so GSAP can
// animate them individually while real space characters stay as plain text
// nodes (so line-wrapping still behaves like normal text). DOM order is
// unchanged and nothing is duplicated/hidden, so screen readers read the
// exact same sentence as sighted users — no aria-hidden needed.

export type RevealTextProps = {
  children: string;
  by?: "word" | "line";
  direction?: RevealDirection;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  className?: string;
};

export function RevealText({
  children,
  by = "word",
  direction = "up",
  as: Tag = "span",
  className,
}: RevealTextProps) {
  const ref = useReveal<HTMLElement>({
    direction,
    stagger: STAGGER.text,
    distance: 16,
  });

  // "line" splitting relies on natural text wrapping, which can't be
  // pre-computed server-side — approximated here by treating the whole
  // string as one "line" unit per explicit newline in the source text
  // (callers control line breaks by passing them), rather than trying to
  // measure rendered line boxes.
  const chunks = by === "line" ? children.split("\n") : children.split(" ");

  // `Tag` is a union of intrinsic element names, so JSX's per-tag ref typing
  // (HTMLHeadingElement vs HTMLParagraphElement vs ...) can't unify with
  // useReveal's single HTMLElement-typed ref — createElement's looser typing
  // for a dynamic string tag sidesteps that without an explicit cast.
  return createElement(
    Tag,
    { ref, className },
    chunks.map((chunk, i) => (
      <Fragment key={i}>
        <span data-reveal-item className={cn("inline-block", by === "line" && "block")}>
          {chunk}
        </span>
        {by === "word" && i < chunks.length - 1 ? " " : null}
      </Fragment>
    ))
  );
}
