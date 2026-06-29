import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

let logoDataUrl: string | null = null;

async function getLogoDataUrl() {
  if (!logoDataUrl) {
    const buf = await readFile(join(process.cwd(), "public/catalink-logo-v4.png"));
    logoDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
  }
  return logoDataUrl;
}

/** App / PWA icon from the official Catalink logo (symbol crop, dark background). */
export async function catalinkAppIconImage(size: number) {
  const logoSrc = await getLogoDataUrl();
  const radius = Math.round(size * 0.21);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          overflow: "hidden",
          background: "#030712",
          borderRadius: radius,
        }}
      >
        <img
          src={logoSrc}
          alt=""
          width={Math.round(size * 0.92)}
          height={Math.round(size * 1.28)}
          style={{
            objectFit: "cover",
            objectPosition: "top center",
            marginTop: Math.round(size * 0.06),
          }}
        />
      </div>
    ),
    { width: size, height: size }
  );
}
