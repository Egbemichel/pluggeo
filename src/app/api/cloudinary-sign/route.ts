import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { signUploadParams } from "@/lib/cloudinary";

// Route Handler, not a Server Action — `next-cloudinary`'s <CldUploadWidget>
// posts here directly (its `signatureEndpoint` prop wants a fetchable URL,
// following Cloudinary's own upload-widget signing contract: POST
// `{ paramsToSign }`, respond `{ signature }`), so this is exactly the
// carve-out docs/API.md already describes Route Handlers for — something
// that needs to be hit from outside a form/React tree, not a plain mutation
// a Server Action could cover. Uses `getAdminUser()` (not `requireAdmin()`)
// since this is a fetch()/RPC call from a widget, not a page navigation — a
// browser-redirect response wouldn't make sense here, a 401 does.

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const paramsToSign = body.paramsToSign as Record<string, string | number>;
  const signature = signUploadParams(paramsToSign);

  return NextResponse.json({ signature });
}
