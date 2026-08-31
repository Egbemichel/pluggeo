import { ClerkProvider } from "@clerk/nextjs";

// `ClerkProvider` scoped to this one route, not the root layout — see the
// root layout's own comment for why. `<SignIn>` is the only Clerk component
// this route renders.
export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
