import { kizuIconResponse } from "@/lib/app-icon";

// Stable URL for the manifest "any" icon.
export const dynamic = "force-static";

export function GET() {
  return kizuIconResponse(512);
}
