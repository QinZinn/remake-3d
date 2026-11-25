import { handleScanRequest } from "@/lib/vision/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleScanRequest(request);
}
