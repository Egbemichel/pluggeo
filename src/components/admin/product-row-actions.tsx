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
import { deleteProduct, setProductStatus } from "@/app/pluggeo/products/actions";

export type ProductRowActionsProps = {
  id: string;
  name: string;
  status: "draft" | "published";
};

export function ProductRowActions({ id, name, status }: ProductRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const toggleStatus = () => {
    const nextStatus = status === "published" ? "draft" : "published";
    startTransition(async () => {
      try {
        await setProductStatus(id, nextStatus);
        router.refresh();
        adminToast.success(nextStatus === "published" ? "Product published." : "Product unpublished.");
      } catch (err) {
        adminToast.error(describeActionError(err, "Couldn't update this product's status."));
      }
    });
  };

  const confirmDelete = () => {
    startTransition(async () => {
      try {
        await deleteProduct(id);
        setConfirmOpen(false);
        router.refresh();
        adminToast.success(`"${name}" deleted.`);
      } catch (err) {
        adminToast.error(describeActionError(err, "Couldn't delete this product."));
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
          <DropdownMenuItem onClick={() => router.push(`/pluggeo/products/${id}/edit`)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isPending} onClick={toggleStatus}>
            {status === "published" ? "Unpublish" : "Publish"}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this product?</DialogTitle>
            <DialogDescription>
              This permanently removes the product and its media/variants. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
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
