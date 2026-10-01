import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { paymentMethods } from "@/db/schema";
import { signUploadParams } from "@/lib/cloudinary";

const proofRequestSchema = z.object({
  methodId: z.string().uuid(),
});

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const PROOF_FOLDER = "checkout-payment-proofs";

function matchesImageSignature(bytes: Uint8Array): boolean {
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const isWebp =
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";

  return isJpeg || isPng || isWebp;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const parsed = proofRequestSchema.safeParse({
      methodId: form.get("methodId"),
    });
    const file = form.get("file");

    if (!parsed.success || !(file instanceof File)) {
      return NextResponse.json({ error: "Choose a valid payment screenshot." }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_PROOF_BYTES) {
      return NextResponse.json({ error: "Screenshots must be 5 MB or smaller." }, { status: 400 });
    }

    const methodResult = await db
      .select({ enabled: paymentMethods.enabled, requireProof: paymentMethods.requireProof })
      .from(paymentMethods)
      .where(eq(paymentMethods.id, parsed.data.methodId))
      .limit(1);
    const method = methodResult[0];

    if (!method?.enabled || !method.requireProof) {
      return NextResponse.json({ error: "This payment method does not accept proof uploads." }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!matchesImageSignature(bytes)) {
      return NextResponse.json({ error: "Upload a JPEG, PNG, or WebP image." }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    if (!cloudName || !apiKey) {
      throw new Error("Cloudinary upload credentials are not configured.");
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = crypto.randomUUID();
    const signedParams = {
      allowed_formats: "jpg,jpeg,png,webp",
      folder: PROOF_FOLDER,
      public_id: publicId,
      timestamp,
    };
    const signature = signUploadParams(signedParams);
    const uploadForm = new FormData();
    uploadForm.set("file", new Blob([bytes], { type: file.type }));
    uploadForm.set("api_key", apiKey);
    uploadForm.set("timestamp", String(timestamp));
    uploadForm.set("folder", PROOF_FOLDER);
    uploadForm.set("public_id", publicId);
    uploadForm.set("allowed_formats", signedParams.allowed_formats);
    uploadForm.set("signature", signature);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
      { method: "POST", body: uploadForm },
    );
    const uploadResult: unknown = await uploadResponse.json();

    if (!uploadResponse.ok || !uploadResult || typeof uploadResult !== "object" || !("secure_url" in uploadResult) || typeof uploadResult.secure_url !== "string") {
      console.error("Payment proof upload failed:", uploadResult);
      return NextResponse.json({ error: "Unable to upload the payment screenshot." }, { status: 502 });
    }

    return NextResponse.json({ url: uploadResult.secure_url }, { status: 200 });
  } catch (error) {
    console.error("Payment proof upload failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to upload the payment screenshot." },
      { status: 500 },
    );
  }
}
