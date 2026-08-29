"use client";

import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { Add01Icon, Delete02Icon, PlayCircleIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

// Wraps next-cloudinary's <CldUploadWidget> — an official, pre-built upload
// UI (drag-and-drop, progress, image *and* video) rather than a hand-built
// dropzone, per the plan. `signatureEndpoint` posts to
// src/app/api/cloudinary-sign/route.ts (a Route Handler, not a Server
// Action — the widget needs a fetchable URL, see that file's own comment).
// The widget itself isn't restyled beyond its `options` theming — it opens
// as Cloudinary's own modal, which is fine for an internal single-admin
// tool; what's restyled here is the *result grid* below it (thumbnails,
// remove, drag-to-reorder handles) to match the ported admin look.

export type MediaItem = { type: "image" | "video"; url: string; altText?: string };

export type MediaUploadProps = {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
};

export function MediaUpload({ items, onChange }: MediaUploadProps) {
  const handleUpload = (result: unknown) => {
    const info = (result as { info?: { secure_url?: string; resource_type?: string } })?.info;
    if (!info?.secure_url) return;
    const type: MediaItem["type"] = info.resource_type === "video" ? "video" : "image";
    onChange([...items, { type, url: info.secure_url }]);
  };

  const removeAt = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const moveTo = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item, index) => (
          <div
            key={item.url + index}
            className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
          >
            {item.type === "video" ? (
              <video src={item.url} className="size-full object-cover" muted />
            ) : (
              <Image src={item.url} alt={item.altText ?? ""} fill className="object-cover" />
            )}
            {item.type === "video" && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                <Icon icon={PlayCircleIcon} size={28} className="text-white" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveTo(index, index - 1)}
                  className="rounded px-1.5 py-0.5 text-xs text-white disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={index === items.length - 1}
                  onClick={() => moveTo(index, index + 1)}
                  className="rounded px-1.5 py-0.5 text-xs text-white disabled:opacity-30"
                >
                  →
                </button>
              </div>
              <button
                type="button"
                aria-label="Remove"
                onClick={() => removeAt(index)}
                className="flex size-6 items-center justify-center rounded text-white hover:bg-white/20"
              >
                <Icon icon={Delete02Icon} size={14} />
              </button>
            </div>
          </div>
        ))}

        <CldUploadWidget
          signatureEndpoint="/api/cloudinary-sign"
          onSuccess={handleUpload}
          options={{ sources: ["local", "url", "camera"], multiple: true, resourceType: "auto" }}
        >
          {({ open }) => (
            <button
              type="button"
              onClick={() => open()}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              )}
            >
              <Icon icon={Add01Icon} size={24} />
              <span className="text-xs">Add media</span>
            </button>
          )}
        </CldUploadWidget>
      </div>
    </div>
  );
}
