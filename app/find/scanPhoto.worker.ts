import { env, pipeline, RawImage } from "@huggingface/transformers";
import { MATERIALS, MATERIAL_IDS, TOOLS, TOOL_IDS } from "@/lib/taxonomy";
import { sanitizeScanItems, type ScanItemId } from "@/lib/scan";

env.allowLocalModels = false;
// Single-threaded WASM also works when the page is not cross-origin isolated.
if (env.backends.onnx.wasm) env.backends.onnx.wasm.numThreads = 1;

const candidates = new Map<string, ScanItemId>([
  ...MATERIAL_IDS.map((id) => [MATERIALS[id].label.en, id] as const),
  ...TOOL_IDS.map((id) => [TOOLS[id].label.en, id] as const),
]);
const labels = [...candidates.keys(), "an unrelated object", "a person or animal", "an empty surface"];
let classifier: ReturnType<typeof loadClassifier> | undefined;

function loadClassifier() {
  return pipeline("zero-shot-image-classification", "Xenova/clip-vit-base-patch32", {
    revision: "6b7c523703ae26e39be4b03774966f8571c7f523",
    dtype: "q8",
    device: "wasm",
  });
}

self.onmessage = async ({ data }: MessageEvent<Blob>) => {
  try {
    classifier ??= loadClassifier().catch((error: unknown) => {
      classifier = undefined;
      throw error;
    });
    const scan = await classifier;
    self.postMessage({ kind: "analyzing" });
    const image = await RawImage.fromBlob(data);
    const items = [];

    // Classify the full photo and four overlapping regions to suggest multiple items.
    const regions: RawImage[] = [image];
    if (Math.min(image.width, image.height) >= 96) {
      const width = Math.ceil(image.width * 0.65);
      const height = Math.ceil(image.height * 0.65);
      for (const x of [0, image.width - width]) {
        for (const y of [0, image.height - height]) {
          regions.push(await image.crop([x, y, x + width - 1, y + height - 1]));
        }
      }
    }

    for (const region of regions) {
      const [best] = await scan(region, labels);
      if (!best || Array.isArray(best)) continue;
      const id = candidates.get(best.label);
      if (id && best.score >= 0.25) items.push({ id, confidence: best.score });
    }
    self.postMessage({ kind: "result", items: sanitizeScanItems({ items }) ?? [] });
  } catch {
    self.postMessage({ kind: "error" });
  }
};
