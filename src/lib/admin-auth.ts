import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Single-admin gate: Clerk handles Google sign-in, this confirms the signed-in
 * account is the one allowed admin email (there is no roles/permissions system —
 * see docs/AUTH.md). Returns the Clerk user when they're the allowed admin,
 * `null` otherwise — never redirects, so this is safe to call from a Route
 * Handler (e.g. api/cloudinary-sign) or anywhere else a page-navigation
 * `redirect()` wouldn't make sense, not just from a page/layout.
 */
export async function getAdminUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const allowedEmail = process.env.ADMIN_EMAIL;

  if (!allowedEmail) {
    throw new Error("ADMIN_EMAIL is not configured");
  }
  if (email !== allowedEmail) return null;

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
