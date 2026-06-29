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

/** Square logo PNG — top band = C + link + social rays; bottom = wordmark (clipped). */
const SYMBOL_BAND_RATIO = 0.46;
const CANVAS_PADDING = 0.125;

/** Optical tuning calibrated at 512px — scaled for all icon sizes. */
const REF_SIZE = 512;
const OPTICAL_TRANSLATE_X = 12;
const OPTICAL_TRANSLATE_Y = -8;
const OPTICAL_SCALE = 0.94;

/** App / PWA icon from the official Catalink logo (symbol crop, dark background). */
export async function catalinkAppIconImage(size: number) {
  const logoSrc = await getLogoDataUrl();
  const radius = Math.round(size * 0.21);

  const targetSymbolHeight = size * (1 - 2 * CANVAS_PADDING);
  const imgSize = Math.round(targetSymbolHeight / SYMBOL_BAND_RATIO);
  const top = Math.round(size * (0.5 - (SYMBOL_BAND_RATIO / 2) * (imgSize / size)));
  const left = Math.round(size * (0.5 - imgSize / size / 2));

  const translateX = Math.round((OPTICAL_TRANSLATE_X / REF_SIZE) * size);
  const translateY = Math.round((OPTICAL_TRANSLATE_Y / REF_SIZE) * size);
  const originX = Math.round(imgSize / 2);
  const originY = Math.round((imgSize * SYMBOL_BAND_RATIO) / 2);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          display: "flex",
          overflow: "hidden",
          background: "#030712",
          borderRadius: radius,
        }}
      >
        <img
          src={logoSrc}
          alt=""
          width={imgSize}
          height={imgSize}
          style={{
            position: "absolute",
            top,
            left,
            transform: `translate(${translateX}px, ${translateY}px) scale(${OPTICAL_SCALE})`,
            transformOrigin: `${originX}px ${originY}px`,
          }}
        />
      </div>
    ),
    { width: size, height: size }
  );
}
