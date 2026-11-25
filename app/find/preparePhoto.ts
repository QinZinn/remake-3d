import { MAX_SCAN_IMAGE_BYTES } from "@/lib/scan";

const MAX_PHOTO_DIMENSION = 1600;

type PreparedPhotoResult =
  | { ok: true; blob: Blob; mediaType: "image/jpeg" }
  | { ok: false; message: string };

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateSelectedFile(file: File): string | null {
  if (file.size === 0) return "This file is empty. Please choose another photo.";

  const mime = file.type.trim().toLowerCase();
  if (mime && (mime === "image/svg+xml" || mime === "image/gif" || !mime.startsWith("image/"))) {
    return "Unsupported file format. Please choose a JPEG, PNG, or WebP photo.";
  }
  return null;
}

/** Resize on device and encode a fresh JPEG without the original file metadata. */
export async function preparePhotoForUpload(file: File): Promise<PreparedPhotoResult> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext("2d");
    if (!context) return { ok: false, message: "Your browser could not prepare this photo." };

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));

    if (blob?.type === "image/jpeg" && blob.size > 0 && blob.size <= MAX_SCAN_IMAGE_BYTES) {
      return { ok: true, blob, mediaType: "image/jpeg" };
    }
    return { ok: false, message: "Could not prepare the photo for upload. Please try a smaller image." };
  } catch {
    return { ok: false, message: "Could not open this photo. Please choose a JPEG, PNG, or WebP image." };
  } finally {
    URL.revokeObjectURL(url);
  }
}
