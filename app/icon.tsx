import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)",
          borderRadius: 108,
        }}
      >
        <div
          style={{
            fontSize: 280,
            fontWeight: 800,
            color: "white",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          C
        </div>
      </div>
    ),
    { ...size }
  );
}
