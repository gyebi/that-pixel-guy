const approvedPhotoMediaKey = /^tpg\/shoots\/[A-Za-z0-9_-]{1,128}\/[A-Za-z0-9_-]{1,128}$/;

export function isApprovedPhotoMediaKey(mediaKey: string) {
  return approvedPhotoMediaKey.test(mediaKey);
}
