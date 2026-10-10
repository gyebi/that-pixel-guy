
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

export type ImageVariant = "thumbnail" | "gallery" | "preview";

export interface MediaService {
  uploadPhoto(input: UploadPhotoInput): Promise<StoredPhoto>;

  getImageUrl(
    mediaKey: string,
    variant: ImageVariant,
  ): Promise<string>;

  deletePhoto(mediaKey: string): Promise<void>;
}

