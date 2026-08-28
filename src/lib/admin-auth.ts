import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Single-admin gate: Clerk handles Google sign-in, this confirms the signed-in
 * account is the one allowed admin email (there is no roles/permissions system —
 * see docs/AUTH.md).
 */
export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const allowedEmail = process.env.ADMIN_EMAIL;

  if (!allowedEmail) {
    throw new Error("ADMIN_EMAIL is not configured");
  }
  if (email !== allowedEmail) {
    redirect("/");
  }

  return user;
}
