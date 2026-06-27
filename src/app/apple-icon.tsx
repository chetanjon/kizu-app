import { kizuIconResponse } from "@/lib/app-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS home-screen icon (apple-touch-icon). Non-maskable; iOS rounds it gently.
export default function AppleIcon() {
  return kizuIconResponse(180);
}
