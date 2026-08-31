"use client";

import { GooeyToaster } from "goey-toast";
import "goey-toast/styles.css";

// `goey-toast`'s own package doesn't mark itself `"use client"` (its dist
// output has no directive at all — confirmed by reading it directly), so
// importing `GooeyToaster` straight into the admin layout (a Server
// Component) made Next try to evaluate the library's module server-side
// during the build's page-data collection, crashing with "Class extends
// value undefined" (something inside sonner/framer-motion assumes a
// browser). Isolating it behind this file's own `"use client"` boundary
// keeps the library entirely out of the server bundle — only this
// wrapper's reference crosses into the Server Component tree.
export function AdminToaster() {
  return <GooeyToaster position="bottom-right" theme="dark" />;
}
