import { ImageResponse } from "next/og";

// Link-preview card (iMessage / WhatsApp / Twitter / Slack). Brand cream +
// ink border + the one allowed red dot. Generated at build — no asset, $0.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "kizu · good taste runs in the group";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#EDE3CE",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            border: "6px solid #14110F",
            borderRadius: "28px",
            background: "#FFFFFF",
            boxShadow: "16px 16px 0 #14110F",
            padding: "64px 72px",
          }}
        >
          <div style={{ fontSize: 150, fontWeight: 900, letterSpacing: "-7px", color: "#14110F", display: "flex" }}>
            kizu<span style={{ color: "#FF2E4D" }}>.</span>
          </div>
          <div style={{ fontSize: 52, fontWeight: 800, color: "#6B4BD6", marginTop: 8, letterSpacing: "-2px" }}>
            good taste runs in the group.
          </div>
          <div style={{ fontSize: 30, color: "#5b524a", marginTop: 28, maxWidth: 880 }}>
            a private taste space for you and your people. movies, music, and places you love.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
