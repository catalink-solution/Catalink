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

/** Top fraction of the square source PNG — C + link + social rays (wordmark clipped). */
const SYMBOL_BAND_RATIO = 0.47;
/** Symbol width after scale, as a fraction of the canvas (72–78% target → 75%). */
const TARGET_FILL_RATIO = 0.75;
/** Premium inset — applied via transform on the clipped symbol group. */
const CONTENT_SCALE = 0.82;
/** Trim empty padding at the top of the source PNG within the symbol band. */
const SYMBOL_TOP_TRIM_RATIO = 0.05;

/** Optical nudge from geometric center (reference px at 512, scaled per size). */
const REF_SIZE = 512;
const OPTICAL_NUDGE_X = 0;
const OPTICAL_NUDGE_Y = 0;

/** App / PWA icon — symbol-only crop, optically centered, dark premium canvas. */
export async function catalinkAppIconImage(size: number) {
  const logoSrc = await getLogoDataUrl();

  const clipWidth = Math.round((size * TARGET_FILL_RATIO) / CONTENT_SCALE);
  const clipHeight = Math.round(clipWidth * SYMBOL_BAND_RATIO);
  const topTrim = Math.round(clipWidth * SYMBOL_TOP_TRIM_RATIO);
  const nudgeX = Math.round((OPTICAL_NUDGE_X / REF_SIZE) * size);
  const nudgeY = Math.round((OPTICAL_NUDGE_Y / REF_SIZE) * size);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#030712",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `translate(${nudgeX}px, ${nudgeY}px) scale(${CONTENT_SCALE})`,
            transformOrigin: "center center",
          }}
        >
          <div
            style={{
              display: "flex",
              position: "relative",
              width: clipWidth,
              height: clipHeight,
              overflow: "hidden",
            }}
          >
            <img
              src={logoSrc}
              alt=""
              width={clipWidth}
              height={clipWidth}
              style={{
                position: "absolute",
                top: -topTrim,
                left: 0,
              }}
            />
          </div>
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
