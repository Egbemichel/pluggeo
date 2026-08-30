import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

// No public/customer value in indexing an admin sign-in page — also
// disallowed in robots.ts, this is defense-in-depth for the case a crawler
// reaches it before checking robots.txt.
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center py-24">
      <SignIn />
    </main>
  );
}
