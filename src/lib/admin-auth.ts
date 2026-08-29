import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Admin allowlist gate: Clerk handles Google sign-in, this confirms the
 * signed-in account's email is on the allowed-admins list (there is no
 * roles/permissions system — every allowed email gets the same full access,
 * see docs/AUTH.md). `ADMIN_EMAILS` is comma-separated (supports more than
 * one admin — still just an allowlist, not a roles table) — returns the
 * Clerk user when they're on it, `null` otherwise. Never redirects, so this
 * is safe to call from a Route Handler (e.g. api/cloudinary-sign) or
 * anywhere else a page-navigation `redirect()` wouldn't make sense, not
 * just from a page/layout.
 */
export async function getAdminUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const allowedEmailsRaw = process.env.ADMIN_EMAILS;

  if (!allowedEmailsRaw) {
    throw new Error("ADMIN_EMAILS is not configured");
  }
  const allowedEmails = allowedEmailsRaw.split(",").map((e) => e.trim().toLowerCase());

  if (!email || !allowedEmails.includes(email.toLowerCase())) return null;

  return user;
}

/** Page/layout guard — redirects instead of returning null. Server Actions
 * and Route Handlers should use `getAdminUser()` directly instead, since a
 * browser-navigation redirect doesn't make sense for a fetch()/RPC call. */
export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getAdminUser();
  if (!user) redirect("/");

  return user;
}
