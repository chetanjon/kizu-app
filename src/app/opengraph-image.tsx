import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Link-preview card (iMessage / WhatsApp / Twitter / Slack) in the CURRENT
// brand: dark stage, cream frame, hard violet shadow, real Archivo — the old
// card was the retired light-cream look in generic sans-serif, so shared
// join links looked like a different product. Generated at request time from
// bundled TTFs; still $0, still no design asset to maintain.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "kizu · good taste runs in the group";

const font = (rel: string) => readFile(fileURLToPath(new URL(rel, import.meta.url)));

export default async function OpengraphImage() {
  const [archivo, jakarta] = await Promise.all([font("./og/archivo-800.ttf"), font("./og/jakarta-500.ttf")]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#16130E",
          backgroundImage: "radial-gradient(ellipse 90% 60% at 50% -10%, rgba(124,92,230,0.35), rgba(22,19,14,0) 70%)",
          padding: "80px",
          fontFamily: "Archivo",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            border: "6px solid #EDE3CE",
            borderRadius: "28px",
            background: "#1B1610",
            boxShadow: "16px 16px 0 #7C5CE6",
            padding: "64px 72px",
          }}
        >
          <div style={{ fontSize: 150, fontWeight: 800, letterSpacing: "-7px", color: "#F6F1EA", display: "flex" }}>
            kizu<span style={{ color: "#FF3B5C" }}>.</span>
          </div>
          <div style={{ fontSize: 52, fontWeight: 800, color: "#A98BFF", marginTop: 8, letterSpacing: "-2px" }}>
            good taste runs in the group.
          </div>
          <div style={{ fontFamily: "Jakarta", fontSize: 30, color: "#C7BEB0", marginTop: 28, maxWidth: 880 }}>
            a private taste space for you and your people. movies, music, and places you love.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo", data: archivo, weight: 800, style: "normal" },
        { name: "Jakarta", data: jakarta, weight: 500, style: "normal" },
      ],
    }
  );
}
