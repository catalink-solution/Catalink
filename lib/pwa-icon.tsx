import { ImageResponse } from "next/og";

export function pwaIconImage(size: number) {
  const radius = Math.round(size * 0.21);
  const fontSize = Math.round(size * 0.55);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)",
          borderRadius: radius,
        }}
      >
        <div
          style={{
            fontSize,
            fontWeight: 800,
            color: "white",
            fontFamily: "system-ui, sans-serif",
            marginTop: size * 0.04,
          }}
        >
          C
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
