export const authenticatedThumbnailTransformation = {
  width: 400,
  height: 400,
  crop: "fill",
  quality: "auto",
};

export const authenticatedThumbnailUrlOptions = {
  resource_type: "image",
  type: "authenticated",
  sign_url: true,
  secure: true,
  // In Cloudinary SDK v2.11.0 this must be a delivery option, not nested in
  // transformation, to serialize as a .webp delivery extension.
  format: "webp",
  transformation: authenticatedThumbnailTransformation,
};
