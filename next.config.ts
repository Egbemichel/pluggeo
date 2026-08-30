import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next/image refuses to optimize any external hostname not explicitly
  // allowlisted here — without this, every real product photo (uploaded to
  // Cloudinary via the admin, src/lib/cloudinary.ts) 400s at Next's image
  // optimizer with "url parameter is not allowed", confirmed directly
  // against a real product's real Cloudinary URL. Local assets under
  // public/ (the placeholder SVG, hero/category photography, etc.) were
  // never affected — only ever a problem for real uploaded photos.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
