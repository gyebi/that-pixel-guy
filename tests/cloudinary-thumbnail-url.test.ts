import assert from "node:assert/strict";
import test from "node:test";
import { v2 as cloudinary } from "cloudinary";
import { authenticatedThumbnailUrlOptions } from "@/lib/media/cloudinary-thumbnail-options";

test("Cloudinary v2 thumbnail delivery explicitly requests WebP", () => {
  cloudinary.config({
    cloud_name: "synthetic-cloud",
    api_key: "synthetic-key",
    api_secret: "synthetic-secret",
    secure: true,
  });

  const signedUrl = cloudinary.url(
    "tpg/shoots/synthetic-shoot/synthetic-photo",
    authenticatedThumbnailUrlOptions,
  );
  const pathname = new URL(signedUrl).pathname;

  assert.match(pathname, /\/image\/authenticated\//);
  assert.match(pathname, /c_fill/);
  assert.match(pathname, /h_400/);
  assert.match(pathname, /w_400/);
  assert.match(pathname, /q_auto/);
  assert.match(pathname, /\.webp$/);
});
