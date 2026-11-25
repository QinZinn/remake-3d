import {
  isAllowedScanMimeType,
  MAX_SCAN_IMAGE_BYTES,
  type ScanErrorCode,
  type ScanImageMimeType,
} from "../scan";

export class ScanValidationError extends Error {
  readonly code: ScanErrorCode;
  readonly status: number;

  constructor(code: ScanErrorCode, status: number, message: string) {
    super(message);
    this.name = "ScanValidationError";
    this.code = code;
    this.status = status;
  }
}

export interface ValidatedScanImage {
  bytes: Uint8Array;
  mediaType: ScanImageMimeType;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

export function parseContentTypeMime(header: string | null): string | null {
  if (!header) return null;
  const [rawType] = header.split(";", 1);
  const normalized = rawType?.trim().toLowerCase();
  return normalized || null;
}

/**
 * Detect JPEG, PNG, or WebP from binary file signatures.
 */
export function detectImageMimeType(bytes: Uint8Array): ScanImageMimeType | null {
  // JPEG: FF D8 FF
  if (bytes.byteLength >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.byteLength >= PNG_SIGNATURE.length &&
    PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)
  ) {
    return "image/png";
  }

  // WebP: "RIFF" <4-byte size> "WEBP"
  if (
    bytes.byteLength >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

function parseContentLength(header: string | null): number | null {
  if (!header) return null;
  const trimmed = header.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) ? value : null;
}

export async function readBoundedBody(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<Uint8Array> {
  if (!body) {
    return new Uint8Array(0);
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new ScanValidationError(
          "payload_too_large",
          413,
          "Photo is too large. Please choose an image up to 4 MB.",
        );
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (chunks.length === 0) {
    return new Uint8Array(0);
  }
  if (chunks.length === 1) {
    return chunks[0];
  }

  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return combined;
}

/**
 * Validate headers, read at most `maxBytes` from the request body, and verify
 * both the declared MIME type and binary image signature.
 */
export async function readAndValidateScanImage(
  request: Request,
  maxBytes: number = MAX_SCAN_IMAGE_BYTES,
): Promise<ValidatedScanImage> {
  const declaredMime = parseContentTypeMime(request.headers.get("content-type"));

  if (declaredMime !== null && !isAllowedScanMimeType(declaredMime)) {
    throw new ScanValidationError(
      "unsupported_media_type",
      415,
      "Unsupported image format. Please upload a JPEG, PNG, or WebP photo.",
    );
  }

  const contentLength = parseContentLength(request.headers.get("content-length"));
  if (contentLength !== null && contentLength > maxBytes) {
    throw new ScanValidationError(
      "payload_too_large",
      413,
      "Photo is too large. Please choose an image up to 4 MB.",
    );
  }

  const bytes = await readBoundedBody(request.body, maxBytes);

  if (bytes.byteLength === 0) {
    throw new ScanValidationError(
      "empty_image",
      400,
      "No photo data was received. Please select a photo and try again.",
    );
  }

  if (declaredMime === null) {
    throw new ScanValidationError(
      "unsupported_media_type",
      415,
      "Missing image content type. Please upload a JPEG, PNG, or WebP photo.",
    );
  }

  const detectedMime = detectImageMimeType(bytes);
  if (detectedMime === null || detectedMime !== declaredMime) {
    throw new ScanValidationError(
      "invalid_image",
      400,
      "The uploaded file does not match a valid JPEG, PNG, or WebP image.",
    );
  }

  return { bytes, mediaType: detectedMime };
}
