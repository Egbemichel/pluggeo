import { describe, expect, it } from "vitest";

import {
  buildCanonicalQueryString,
  verifyAllPaysSignature,
} from "./allpays";

describe("AllPays canonical signing", () => {
  it("sorts query parameters in canonical order", () => {
    const params = new URLSearchParams(
      "b=second&a=first&c=third",
    );

    expect(buildCanonicalQueryString(params)).toBe(
      "a=first&b=second&c=third",
    );
  });

  it("accepts a valid HMAC signature", async () => {
    const secret = "test-secret";
    const timestamp = "1710000000";
    const url =
      "https://pluggeo.test/api/webhooks/allpays?b=second&a=first";

    const canonical =
      buildCanonicalQueryString(new URL(url).searchParams);
    const payload = `${timestamp}\n${canonical}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload),
    );

    const hexSignature = Array.from(
      new Uint8Array(signature),
    )
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    await expect(
      verifyAllPaysSignature({
        requestUrl: url,
        signature: hexSignature,
        timestamp,
        secret,
      }),
    ).resolves.toBe(true);
  });

  it("rejects an invalid signature", async () => {
    await expect(
      verifyAllPaysSignature({
        requestUrl:
          "https://pluggeo.test/api/webhooks/allpays?b=second&a=first",
        signature: "invalid-signature",
        timestamp: "1710000000",
        secret: "test-secret",
      }),
    ).resolves.toBe(false);
  });
});
