export type SupportedImageFormat = "jpeg" | "png" | "webp";

export type ImageMetadata = {
  format: SupportedImageFormat;
  width: number;
  height: number;
};

export class InvalidImageError extends Error {}

function invalidImage(): never {
  throw new InvalidImageError("The image is malformed or unsupported.");
}

function readUInt16BE(buffer: Buffer, offset: number) {
  if (offset + 2 > buffer.length) invalidImage();
  return buffer.readUInt16BE(offset);
}

function readUInt32BE(buffer: Buffer, offset: number) {
  if (offset + 4 > buffer.length) invalidImage();
  return buffer.readUInt32BE(offset);
}

function readUInt32LE(buffer: Buffer, offset: number) {
  if (offset + 4 > buffer.length) invalidImage();
  return buffer.readUInt32LE(offset);
}

function validateDimensions(width: number, height: number): ImageMetadata {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    invalidImage();
  }

  return { format: "jpeg", width, height };
}

function readJpegMetadata(buffer: Buffer): ImageMetadata {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    invalidImage();
  }

  let offset = 2;

  while (offset < buffer.length) {
    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
    if (offset >= buffer.length) invalidImage();

    const marker = buffer[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;

    const segmentLength = readUInt16BE(buffer, offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) invalidImage();

    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isStartOfFrame) {
      if (segmentLength < 8) invalidImage();
      const height = readUInt16BE(buffer, offset + 3);
      const width = readUInt16BE(buffer, offset + 5);
      return { ...validateDimensions(width, height), format: "jpeg" };
    }

    offset += segmentLength;
  }

  invalidImage();
}

function readPngMetadata(buffer: Buffer): ImageMetadata {
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (
    buffer.length < 33 ||
    !pngSignature.every((value, index) => buffer[index] === value) ||
    readUInt32BE(buffer, 8) !== 13 ||
    buffer.subarray(12, 16).toString("ascii") !== "IHDR"
  ) {
    invalidImage();
  }

  const width = readUInt32BE(buffer, 16);
  const height = readUInt32BE(buffer, 20);
  return { ...validateDimensions(width, height), format: "png" };
}

function readWebpMetadata(buffer: Buffer): ImageMetadata {
  if (
    buffer.length < 20 ||
    buffer.subarray(0, 4).toString("ascii") !== "RIFF" ||
    buffer.subarray(8, 12).toString("ascii") !== "WEBP" ||
    readUInt32LE(buffer, 4) + 8 !== buffer.length
  ) {
    invalidImage();
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.subarray(offset, offset + 4).toString("ascii");
    const chunkLength = readUInt32LE(buffer, offset + 4);
    const dataOffset = offset + 8;
    const nextOffset = dataOffset + chunkLength + (chunkLength % 2);

    if (nextOffset > buffer.length) invalidImage();

    if (chunkType === "VP8X") {
      if (chunkLength < 10) invalidImage();
      const width = 1 + buffer.readUIntLE(dataOffset + 4, 3);
      const height = 1 + buffer.readUIntLE(dataOffset + 7, 3);
      return { ...validateDimensions(width, height), format: "webp" };
    }

    if (chunkType === "VP8 ") {
      if (
        chunkLength < 10 ||
        buffer[dataOffset + 3] !== 0x9d ||
        buffer[dataOffset + 4] !== 0x01 ||
        buffer[dataOffset + 5] !== 0x2a
      ) {
        invalidImage();
      }

      const width = readUInt16LE(buffer, dataOffset + 6) & 0x3fff;
      const height = readUInt16LE(buffer, dataOffset + 8) & 0x3fff;
      return { ...validateDimensions(width, height), format: "webp" };
    }

    if (chunkType === "VP8L") {
      if (chunkLength < 5 || buffer[dataOffset] !== 0x2f) invalidImage();
      const first = buffer[dataOffset + 1];
      const second = buffer[dataOffset + 2];
      const third = buffer[dataOffset + 3];
      const fourth = buffer[dataOffset + 4];
      const width = 1 + (first | ((second & 0x3f) << 8));
      const height = 1 + ((second >> 6) | (third << 2) | ((fourth & 0x0f) << 10));
      return { ...validateDimensions(width, height), format: "webp" };
    }

    offset = nextOffset;
  }

  invalidImage();
}

function readUInt16LE(buffer: Buffer, offset: number) {
  if (offset + 2 > buffer.length) invalidImage();
  return buffer.readUInt16LE(offset);
}

export function readImageMetadata(buffer: Buffer): ImageMetadata {
  if (buffer.length === 0) invalidImage();

  if (buffer[0] === 0xff && buffer[1] === 0xd8) return readJpegMetadata(buffer);
  if (buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") {
    return readPngMetadata(buffer);
  }
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF") {
    return readWebpMetadata(buffer);
  }

  invalidImage();
}

/**
 * Parse the declared format before asking a decoder for metadata. The decoder
 * rejects malformed image structures that can otherwise resemble a valid file
 * based on a few header bytes alone.
 */
export async function decodeImageMetadata(
  buffer: Buffer,
  maxPixels: number,
): Promise<ImageMetadata> {
  const headerMetadata = readImageMetadata(buffer);

  try {
    const decoded = await sharp(buffer, {
      animated: false,
      failOn: "error",
      limitInputPixels: maxPixels,
    }).metadata();

    const format = decoded.format === "jpeg" || decoded.format === "png" || decoded.format === "webp"
      ? decoded.format
      : undefined;

    if (
      !format ||
      format !== headerMetadata.format ||
      decoded.width !== headerMetadata.width ||
      decoded.height !== headerMetadata.height
    ) {
      invalidImage();
    }

    return headerMetadata;
  } catch (error) {
    if (error instanceof InvalidImageError) throw error;
    invalidImage();
  }
}
import sharp from "sharp";
