
export type StoredPhoto = {
  mediaKey: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
};

export type UploadPhotoInput = {
  buffer: Buffer;
  filename: string;
  folder: string;
};

export type StoredHomepageImage = StoredPhoto & {
  url: string;
};

export type ImageVariant = "thumbnail" | "gallery" | "preview";

export interface MediaService {
  uploadPhoto(input: UploadPhotoInput): Promise<StoredPhoto>;

  getImageUrl(
    mediaKey: string,
    variant: ImageVariant,
  ): Promise<string>;

  deletePhoto(mediaKey: string): Promise<void>;
}

export interface HomepageImageMediaService {
  uploadHomepageImage(input: UploadPhotoInput): Promise<StoredHomepageImage>;
  deleteHomepageImage(mediaKey: string): Promise<void>;
}
