// Calcul d'empreintes visuelles côté navigateur (canvas).
// Hash perceptuel moyen (aHash) + différentiel (dHash) + couleur dominante.
// Tout est calculé localement à l'upload → aucun coût serveur, scalable.

"use client";

export type FileFingerprint = {
  phash: string | null;
  dhash: string | null;
  avgHex: string | null;
};

const EMPTY: FileFingerprint = { phash: null, dhash: null, avgHex: null };

function bitsToHex(bits: number[]): string {
  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    const nibble = (bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3];
    hex += nibble.toString(16);
  }
  return hex;
}

function grayscale(data: Uint8ClampedArray, w: number, h: number): number[] {
  const gray: number[] = new Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return gray;
}

function aHashFrom(gray: number[]): string {
  const mean = gray.reduce((s, v) => s + v, 0) / gray.length;
  return bitsToHex(gray.map((v) => (v >= mean ? 1 : 0)));
}

// dHash sur grille 9x8 : compare chaque pixel à son voisin de droite → 8x8 bits.
function dHashFrom(gray9x8: number[]): string {
  const bits: number[] = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const i = y * 9 + x;
      bits.push(gray9x8[i] > gray9x8[i + 1] ? 1 : 0);
    }
  }
  return bitsToHex(bits);
}

function avgColor(data: Uint8ClampedArray, w: number, h: number): string {
  // Moyenne sur la zone centrale (50%) pour limiter l'effet du fond blanc.
  const x0 = Math.floor(w * 0.25);
  const x1 = Math.ceil(w * 0.75);
  const y0 = Math.floor(h * 0.25);
  const y1 = Math.ceil(h * 0.75);
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
  }
  if (n === 0) return "#000000";
  const toHex = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

async function decode(file: Blob): Promise<ImageBitmap | null> {
  try {
    if (typeof createImageBitmap === "function") {
      return await createImageBitmap(file);
    }
  } catch {
    /* formats non supportés → null */
  }
  return null;
}

function drawTo(bmp: ImageBitmap, w: number, h: number): Uint8ClampedArray | null {
  try {
    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(w, h)
        : Object.assign(document.createElement("canvas"), { width: w, height: h });
    const ctx = (canvas as HTMLCanvasElement | OffscreenCanvas).getContext("2d", {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!ctx) return null;
    ctx.drawImage(bmp, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h).data;
  } catch {
    return null;
  }
}

/** Calcule l'empreinte visuelle d'un fichier image. Renvoie des null si impossible. */
export async function computeFingerprint(file: Blob): Promise<FileFingerprint> {
  const bmp = await decode(file);
  if (!bmp) return EMPTY;
  try {
    // aHash + couleur sur 8x8 ; dHash sur 9x8.
    const d8 = drawTo(bmp, 8, 8);
    const d9 = drawTo(bmp, 9, 8);
    if (!d8) return EMPTY;
    const gray8 = grayscale(d8, 8, 8);
    const phash = aHashFrom(gray8);
    const avgHex = avgColor(d8, 8, 8);
    const dhash = d9 ? dHashFrom(grayscale(d9, 9, 8)) : null;
    return { phash, dhash, avgHex };
  } catch {
    return EMPTY;
  } finally {
    bmp.close?.();
  }
}
