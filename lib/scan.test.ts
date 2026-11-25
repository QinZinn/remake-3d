import { describe, expect, it, vi } from "vitest";
import { inventoryQuery, readInventory } from "./inventory";
import {
  MAX_SCAN_IMAGE_BYTES,
  mergeScannedMaterials,
  mergeScannedTools,
  type ScanItemId,
  sanitizeScanItems,
} from "./scan";
import { handleScanRequest } from "./vision/handler";
import { detectImageMimeType } from "./vision/image";
import {
  ANTHROPIC_API_VERSION,
  ANTHROPIC_MESSAGES_URL,
  createClaudeVisionProvider,
  createConfiguredVisionProvider,
  DEFAULT_ANTHROPIC_VISION_MODEL,
  type VisionProvider,
} from "./vision/provider";

const VALID_JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46];
const VALID_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d];
const VALID_WEBP = [0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50];

function imageRequest(
  bytes: readonly number[],
  headers: Record<string, string> = {},
): Request {
  const body = new Uint8Array(bytes).buffer;
  return new Request("http://localhost/api/scan", {
    method: "POST",
    headers,
    body,
  });
}

function anthropicJsonResponse(
  payload: unknown,
  options: { status?: number; stopReason?: string } = {},
): Response {
  const status = options.status ?? 200;
  const stopReason = options.stopReason ?? "end_turn";
  return new Response(
    JSON.stringify({
      id: "msg_test_123",
      type: "message",
      role: "assistant",
      model: DEFAULT_ANTHROPIC_VISION_MODEL,
      stop_reason: stopReason,
      content: [{ type: "text", text: JSON.stringify(payload) }],
    }),
    {
      status,
      headers: { "content-type": "application/json" },
    },
  );
}

describe("image signature detection and upload boundary validation", () => {
  it("detects valid JPEG, PNG, and WebP signatures", () => {
    expect(detectImageMimeType(new Uint8Array(VALID_JPEG))).toBe("image/jpeg");
    expect(detectImageMimeType(new Uint8Array(VALID_PNG))).toBe("image/png");
    expect(detectImageMimeType(new Uint8Array(VALID_WEBP))).toBe("image/webp");
    expect(detectImageMimeType(new Uint8Array([0x47, 0x49, 0x46, 0x38]))).toBeNull();
  });

  it("rejects empty uploads before invoking the provider", async () => {
    const scan = vi.fn();
    const provider: VisionProvider = { scan };

    const withMime = await handleScanRequest(
      new Request("http://localhost/api/scan", {
        method: "POST",
        headers: { "content-type": "image/jpeg" },
      }),
      { provider },
    );
    expect(withMime.status).toBe(400);
    expect(await withMime.json()).toMatchObject({ error: "empty_image" });

    const withoutMime = await handleScanRequest(
      new Request("http://localhost/api/scan", { method: "POST" }),
      { provider },
    );
    expect(withoutMime.status).toBe(400);
    expect(await withoutMime.json()).toMatchObject({ error: "empty_image" });
    expect(scan).not.toHaveBeenCalled();
  });

  it("rejects unsupported MIME types and missing content-type on non-empty bodies", async () => {
    const scan = vi.fn();
    const provider: VisionProvider = { scan };

    const gif = await handleScanRequest(
      imageRequest([0x47, 0x49, 0x46, 0x38], { "content-type": "image/gif" }),
      { provider },
    );
    expect(gif.status).toBe(415);
    expect(await gif.json()).toMatchObject({ error: "unsupported_media_type" });

    const svg = await handleScanRequest(
      imageRequest([0x3c, 0x73, 0x76, 0x67], { "content-type": "image/svg+xml" }),
      { provider },
    );
    expect(svg.status).toBe(415);
    expect(await svg.json()).toMatchObject({ error: "unsupported_media_type" });

    const missingType = await handleScanRequest(imageRequest(VALID_JPEG), { provider });
    expect(missingType.status).toBe(415);
    expect(await missingType.json()).toMatchObject({ error: "unsupported_media_type" });
    expect(scan).not.toHaveBeenCalled();
  });

  it("rejects spoofed or mismatched image signatures before invoking the provider", async () => {
    const scan = vi.fn();
    const provider: VisionProvider = { scan };

    const mismatched = await handleScanRequest(
      imageRequest(VALID_PNG, { "content-type": "image/jpeg" }),
      { provider },
    );
    expect(mismatched.status).toBe(400);
    expect(await mismatched.json()).toMatchObject({ error: "invalid_image" });

    const textPayload = await handleScanRequest(
      imageRequest([0x68, 0x65, 0x6c, 0x6c, 0x6f], { "content-type": "image/webp" }),
      { provider },
    );
    expect(textPayload.status).toBe(400);
    expect(await textPayload.json()).toMatchObject({ error: "invalid_image" });
    expect(scan).not.toHaveBeenCalled();
  });

  it("enforces bounded reads for oversize Content-Length and chunked streams", async () => {
    const scan = vi.fn();
    const provider: VisionProvider = { scan };

    const headerOversize = await handleScanRequest(
      imageRequest(VALID_JPEG, {
        "content-type": "image/jpeg",
        "content-length": String(MAX_SCAN_IMAGE_BYTES + 1),
      }),
      { provider },
    );
    expect(headerOversize.status).toBe(413);
    expect(await headerOversize.json()).toMatchObject({ error: "payload_too_large" });

    let chunksProduced = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        chunksProduced += 1;
        if (chunksProduced === 1) {
          controller.enqueue(new Uint8Array([...VALID_JPEG, ...new Array<number>(60).fill(0)]));
          return;
        }
        if (chunksProduced <= 20) {
          controller.enqueue(new Uint8Array(64));
          return;
        }
        controller.close();
      },
    });

    const streamInit: RequestInit & { duplex: "half" } = {
      method: "POST",
      headers: { "content-type": "image/jpeg" },
      body: stream,
      duplex: "half",
    };
    const streamOversize = await handleScanRequest(
      new Request("http://localhost/api/scan", streamInit),
      { provider, maxBytes: 100 },
    );
    expect(streamOversize.status).toBe(413);
    expect(await streamOversize.json()).toMatchObject({ error: "payload_too_large" });
    expect(chunksProduced).toBeLessThan(10);
    expect(scan).not.toHaveBeenCalled();
  });
});

describe("taxonomy filtering and scan response handling", () => {
  it("drops unknown or malformed rows, collapses duplicates to best score, and rejects malformed top-level values", () => {
    expect(sanitizeScanItems(null)).toBeNull();
    expect(sanitizeScanItems([])).toBeNull();
    expect(sanitizeScanItems({ wrong: [] })).toBeNull();

    const items = sanitizeScanItems({
      items: [
        { id: "pet-bottle", confidence: 0.72 },
        { id: "pet-bottle", confidence: 0.94 },
        { id: "scissors", confidence: 0.88 },
        { id: "invented-item", confidence: 0.99 },
        { id: "constructor", confidence: 0.99 },
        { id: "__proto__", confidence: 0.99 },
        { id: "glass-jar", confidence: Number.NaN },
        { id: "glass-jar", confidence: Number.POSITIVE_INFINITY },
        { id: "glass-jar", confidence: 1.5 },
        { id: "glass-jar", confidence: -0.1 },
        { id: "cardboard", confidence: "0.8" },
        null,
        "pet-bottle",
      ],
    });

    expect(items).toEqual([
      { id: "pet-bottle", confidence: 0.94 },
      { id: "scissors", confidence: 0.88 },
    ]);
  });

  it("returns sanitized canonical items with no-store caching on valid uploads", async () => {
    const provider: VisionProvider = {
      async scan() {
        return [
          { id: "glass-jar", confidence: 0.6 },
          { id: "glass-jar", confidence: 0.91 },
          { id: "scissors", confidence: 0.85 },
          // Simulate a buggy provider attempting to return an unknown ID
          { id: "unknown-item" as never, confidence: 0.99 },
        ];
      },
    };

    const response = await handleScanRequest(
      imageRequest(VALID_WEBP, { "content-type": "image/webp" }),
      { provider },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      items: [
        { id: "glass-jar", confidence: 0.91 },
        { id: "scissors", confidence: 0.85 },
      ],
    });
  });

  it("returns empty items array cleanly when nothing is detected", async () => {
    const provider: VisionProvider = {
      async scan() {
        return [];
      },
    };

    const response = await handleScanRequest(
      imageRequest(VALID_PNG, { "content-type": "image/png" }),
      { provider },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: [] });
  });
});

describe("Claude Haiku 5.5 vision provider and failure handling", () => {
  it("sends documented headers, schema-constrained output, base64 image, and omits unsupported sampling params", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      anthropicJsonResponse({
        items: [
          { id: "pet-bottle", confidence: 0.81 },
          { id: "pet-bottle", confidence: 0.95 },
          { id: "marker", confidence: 0.77 },
          { id: "not-a-real-id", confidence: 0.99 },
        ],
      }),
    );

    const provider = createClaudeVisionProvider({
      apiKey: "test-key-placeholder",
      fetchImpl: fetchMock,
    });

    const items = await provider.scan({
      bytes: new Uint8Array(VALID_JPEG),
      mediaType: "image/jpeg",
    });

    expect(items).toEqual([
      { id: "pet-bottle", confidence: 0.95 },
      { id: "marker", confidence: 0.77 },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(ANTHROPIC_MESSAGES_URL);
    expect(init?.method).toBe("POST");
    expect(init?.redirect).toBe("error");

    const headers = init?.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("test-key-placeholder");
    expect(headers["anthropic-version"]).toBe(ANTHROPIC_API_VERSION);
    expect(headers["content-type"]).toBe("application/json");

    const parsedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(parsedBody.model).toBe(DEFAULT_ANTHROPIC_VISION_MODEL);
    expect(parsedBody.thinking).toEqual({ type: "disabled" });
    expect(parsedBody).not.toHaveProperty("temperature");
    expect(parsedBody).not.toHaveProperty("top_p");
    expect(parsedBody).not.toHaveProperty("top_k");

    const messages = parsedBody.messages as Array<{
      role: string;
      content: Array<{ type: string; source?: { type: string; media_type: string; data: string } }>;
    }>;
    expect(messages[0].content[0]).toEqual({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: Buffer.from(VALID_JPEG).toString("base64"),
      },
    });

    const outputConfig = parsedBody.output_config as {
      format: {
        type: string;
        schema: {
          additionalProperties: boolean;
          properties: {
            items: {
              items: {
                additionalProperties: boolean;
                properties: {
                  confidence: Record<string, unknown>;
                };
              };
            };
          };
        };
      };
    };
    expect(outputConfig.format.type).toBe("json_schema");
    expect(outputConfig.format.schema.additionalProperties).toBe(false);
    expect(outputConfig.format.schema.properties.items.items.additionalProperties).toBe(false);
    expect(outputConfig.format.schema.properties.items.items.properties.confidence).not.toHaveProperty("minimum");
    expect(outputConfig.format.schema.properties.items.items.properties.confidence).not.toHaveProperty("maximum");
  });

  it("supports optional ANTHROPIC_VISION_MODEL override and returns null when API key is missing", async () => {
    expect(createConfiguredVisionProvider({})).toBeNull();

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      anthropicJsonResponse({ items: [] }),
    );
    const provider = createConfiguredVisionProvider(
      {
        ANTHROPIC_API_KEY: "test-key-placeholder",
        ANTHROPIC_VISION_MODEL: "claude-haiku-5-5-custom",
      },
      fetchMock,
    );
    expect(provider).not.toBeNull();
    await provider!.scan({ bytes: new Uint8Array(VALID_PNG), mediaType: "image/png" });

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as { model: string };
    expect(body.model).toBe("claude-haiku-5-5-custom");
  });

  it("returns 503 provider_unavailable when ANTHROPIC_API_KEY is missing", async () => {
    const response = await handleScanRequest(
      imageRequest(VALID_JPEG, { "content-type": "image/jpeg" }),
      { env: {} },
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: "provider_unavailable" });
  });

  it("handles upstream errors, refusals, truncated responses, and malformed output without exposing secrets", async () => {
    const secretText = "secret-upstream-token-do-not-expose";

    const upstreamErrorFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: secretText } }), { status: 401 }),
    );
    const errorResponse = await handleScanRequest(
      imageRequest(VALID_JPEG, { "content-type": "image/jpeg" }),
      {
        provider: createClaudeVisionProvider({
          apiKey: "test-key-placeholder",
          fetchImpl: upstreamErrorFetch,
        }),
      },
    );
    expect(errorResponse.status).toBe(502);
    const errorBodyText = await errorResponse.text();
    expect(errorBodyText).not.toContain(secretText);
    expect(errorBodyText).not.toContain("test-key-placeholder");
    expect(JSON.parse(errorBodyText)).toMatchObject({ error: "provider_failed" });

    const refusalFetch = vi.fn<typeof fetch>().mockResolvedValue(
      anthropicJsonResponse({ items: [{ id: "pet-bottle", confidence: 0.9 }] }, { stopReason: "refusal" }),
    );
    const refusalResponse = await handleScanRequest(
      imageRequest(VALID_JPEG, { "content-type": "image/jpeg" }),
      {
        provider: createClaudeVisionProvider({
          apiKey: "test-key-placeholder",
          fetchImpl: refusalFetch,
        }),
      },
    );
    expect(refusalResponse.status).toBe(502);
    expect(await refusalResponse.json()).toMatchObject({ error: "provider_failed" });

    const truncatedFetch = vi.fn<typeof fetch>().mockResolvedValue(
      anthropicJsonResponse({ items: [{ id: "pet-bottle", confidence: 0.9 }] }, { stopReason: "max_tokens" }),
    );
    const truncatedResponse = await handleScanRequest(
      imageRequest(VALID_JPEG, { "content-type": "image/jpeg" }),
      {
        provider: createClaudeVisionProvider({
          apiKey: "test-key-placeholder",
          fetchImpl: truncatedFetch,
        }),
      },
    );
    expect(truncatedResponse.status).toBe(502);
    expect(await truncatedResponse.json()).toMatchObject({ error: "provider_failed" });

    const malformedJsonFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          stop_reason: "end_turn",
          content: [{ type: "text", text: "Here are your items: bottle" }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const malformedResponse = await handleScanRequest(
      imageRequest(VALID_JPEG, { "content-type": "image/jpeg" }),
      {
        provider: createClaudeVisionProvider({
          apiKey: "test-key-placeholder",
          fetchImpl: malformedJsonFetch,
        }),
      },
    );
    expect(malformedResponse.status).toBe(502);
    expect(await malformedResponse.json()).toMatchObject({ error: "provider_failed" });
  });
});

describe("merging confirmed scanned items with manual inventory", () => {
  it("adds new materials at quantity 1, preserves existing quantities, and avoids duplicate tools", () => {
    const manual = {
      materials: { "pet-bottle": 3, "cotton-string": 0.5 },
      tools: ["scissors"] as const,
    };

    const selected: ScanItemId[] = ["pet-bottle", "glass-jar", "scissors", "marker", "marker"];
    const merged = {
      materials: mergeScannedMaterials(manual.materials, selected),
      tools: mergeScannedTools(manual.tools, selected),
    };

    expect(merged).toEqual({
      materials: {
        "pet-bottle": 3,
        "cotton-string": 0.5,
        "glass-jar": 1,
      },
      tools: ["scissors", "marker"],
    });

    const query = inventoryQuery(merged);
    const params = Object.fromEntries(
      [...new Set(new URLSearchParams(query).keys())].map((key) => [
        key,
        new URLSearchParams(query).getAll(key),
      ]),
    );
    expect(readInventory(params)).toEqual(merged);
  });
});
