import { v2 as cloudinary } from "cloudinary";

// Server-only — `CLOUDINARY_API_SECRET` never reaches the client. Used to
// sign upload requests that `CldUploadWidget` (next-cloudinary) then sends
// directly to Cloudinary from the browser; the file itself never passes
// through this app/the Cloudflare Worker, which matters most for video
// (Workers have real request body-size/CPU-time limits that make proxying
// large uploads through a Worker impractical). Picked over Cloudflare R2
// per the user — R2's free tier requires a card on file, Cloudinary's
// doesn't, and Cloudinary ships an official Next.js signed-upload pattern
// plus a pre-built upload widget with image *and* video support, narrowing
// what this app needs to hand-build to just the signing step.

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function signUploadParams(paramsToSign: Record<string, string | number>) {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) {
    throw new Error("CLOUDINARY_API_SECRET is not configured");
  }
  return cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
}

export { cloudinary };
