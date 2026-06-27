import { kizuIconResponse } from "@/lib/app-icon";

// Stable URL for the manifest "maskable" icon (Android adaptive crop).
export const dynamic = "force-static";

export function GET() {
  return kizuIconResponse(512, { maskable: true });
}
