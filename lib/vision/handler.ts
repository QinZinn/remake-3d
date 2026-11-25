import {
  MAX_SCAN_IMAGE_BYTES,
  sanitizeScanItems,
  type ScanErrorResponse,
  type ScanResponse,
} from "../scan";
import { readAndValidateScanImage, ScanValidationError } from "./image";
import {
  createConfiguredVisionProvider,
  VisionProviderError,
  VisionProviderUnavailableError,
  type VisionProvider,
} from "./provider";

export interface HandleScanOptions {
  provider?: VisionProvider | null;
  maxBytes?: number;
  env?: Record<string, string | undefined>;
}

function jsonResponse(body: ScanResponse | ScanErrorResponse, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function handleScanRequest(
  request: Request,
  options: HandleScanOptions = {},
): Promise<Response> {
  const maxBytes = options.maxBytes ?? MAX_SCAN_IMAGE_BYTES;

  let image;
  try {
    image = await readAndValidateScanImage(request, maxBytes);
  } catch (error) {
    if (error instanceof ScanValidationError) {
      return jsonResponse({ error: error.code, message: error.message }, error.status);
    }
    return jsonResponse(
      {
        error: "invalid_image",
        message: "Could not read the uploaded photo. Please try again.",
      },
      400,
    );
  }

  const provider =
    options.provider !== undefined
      ? options.provider
      : createConfiguredVisionProvider(options.env);

  if (!provider) {
    return jsonResponse(
      {
        error: "provider_unavailable",
        message:
          "Photo scanning is currently unavailable. You can still add materials and tools manually.",
      },
      503,
    );
  }

  try {
    const rawItems = await provider.scan({
      bytes: image.bytes,
      mediaType: image.mediaType,
      signal: request.signal,
    });

    // Independent boundary re-validation against canonical taxonomy.
    const items = sanitizeScanItems({ items: rawItems });
    if (items === null) {
      throw new VisionProviderError("Invalid scan result.");
    }

    return jsonResponse({ items }, 200);
  } catch (error) {
    if (error instanceof VisionProviderUnavailableError) {
      return jsonResponse(
        {
          error: "provider_unavailable",
          message:
            "Photo scanning is currently unavailable. You can still add materials and tools manually.",
        },
        503,
      );
    }

    return jsonResponse(
      {
        error: "provider_failed",
        message:
          "We could not scan this photo right now. You can try again, choose another photo, or add items manually.",
      },
      502,
    );
  }
}
