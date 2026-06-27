import { ImageResponse } from "next/og";

// Framed neo-brutalist app icon: cream tile, thick ink border, bold "k." with
// the precious red dot. maskable → cream bleeds to the edges with the tile
// inset into the Android safe zone so the round crop never slices the border.
export function kizuIconResponse(size: number, opts?: { maskable?: boolean }) {
  const maskable = opts?.maskable ?? false;
  const bleed = maskable ? Math.round(size * 0.14) : 0;
  const tile = size - bleed * 2;
  const border = Math.max(2, Math.round(tile * 0.06));
  const radius = Math.round(tile * 0.18);
  const glyph = Math.round(tile * 0.6);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#EDE3CE",
        }}
      >
        <div
          style={{
            width: tile,
            height: tile,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#EDE3CE",
            border: `${border}px solid #14110F`,
            borderRadius: radius,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", lineHeight: 1 }}>
            <span style={{ fontSize: glyph, fontWeight: 900, color: "#14110F" }}>k</span>
            <span style={{ fontSize: glyph, fontWeight: 900, color: "#FF2E4D" }}>.</span>
          </div>
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
