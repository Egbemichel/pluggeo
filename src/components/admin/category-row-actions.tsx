"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { adminToast, describeActionError } from "@/components/admin/toast";
import { deleteCategory } from "@/app/pluggeo/categories/actions";

export function CategoryRowActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmDelete = () => {
    startTransition(async () => {
      try {
        await deleteCategory(id);
        setConfirmOpen(false);
        router.refresh();
        adminToast.success(`"${name}" deleted.`);
      } catch (err) {
        // Kept as an inline dialog message too, not just a toast — the
        // dialog stays open on failure (see below), and the admin needs to
        // read *why* while still looking at it, not from a toast that may
        // have already faded.
        const message = describeActionError(
          err,
          "Couldn't delete this category — it may still have products assigned to it."
        );
        setError(message);
        adminToast.error(message);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Row actions"
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            />
          }
        >
          <Icon icon={MoreVerticalIcon} size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/pluggeo/categories/${id}/edit`)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this category?</DialogTitle>
            <DialogDescription>
              This can&apos;t be undone. Products still assigned to it will block the delete.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={confirmDelete}
              className="inline-flex h-9 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-50"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
