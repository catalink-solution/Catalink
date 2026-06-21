/** Generates premium 9:16 Snapchat-style story PNGs. Design-only engine. */

import type { StoryTemplateConfig } from "@/lib/story-templates";

export type StoryInput = {
  productName: string;
  price: string;
  imageUrl: string | null;
  shopName: string;
  logoUrl?: string | null;
  promoCode?: string | null;
  template: StoryTemplateConfig;
};

const W = 1080;
const H = 1920;
const PAD = 36;
const PRODUCT_H = Math.round(H * 0.74); // ~74 % — produit dominant
const PRODUCT_Y = 108;
const CTA_H = 132;
const CTA_Y = H - CTA_H - 48;

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function shortName(name: string, max = 28): string {
  const t = name.trim();
  if (t.length <= max) return t.toUpperCase();
  return t.slice(0, max - 1).trim().toUpperCase() + "…";
}

function withShadow(
  ctx: CanvasRenderingContext2D,
  opts: { blur?: number; y?: number; color?: string },
  draw: () => void
) {
  ctx.save();
  ctx.shadowColor = opts.color ?? "rgba(0,0,0,0.55)";
  ctx.shadowBlur = opts.blur ?? 48;
  ctx.shadowOffsetY = opts.y ?? 24;
  ctx.shadowOffsetX = 0;
  draw();
  ctx.restore();
}

// ─── Background per preset ──────────────────────────────────────────────────

function drawBackground(
  ctx: CanvasRenderingContext2D,
  tpl: StoryTemplateConfig,
  productImg: HTMLImageElement | null
) {
  const key = tpl.presetKey ?? "";
  const { primaryColor, secondaryColor, backgroundStyle } = tpl;

  if (backgroundStyle === "blurred" && productImg) {
    ctx.save();
    const scale = Math.max(W / productImg.width, H / productImg.height) * 1.15;
    ctx.filter = "blur(50px) saturate(1.4) brightness(0.35)";
    ctx.drawImage(
      productImg,
      (W - productImg.width * scale) / 2,
      (H - productImg.height * scale) / 2,
      productImg.width * scale,
      productImg.height * scale
    );
    ctx.restore();
    const veil = ctx.createLinearGradient(0, 0, 0, H);
    veil.addColorStop(0, "rgba(0,0,0,0.2)");
    veil.addColorStop(1, "rgba(0,0,0,0.75)");
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, W, H);
    return;
  }

  if (key === "flash-sale") {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#1a0505");
    g.addColorStop(0.4, "#450a0a");
    g.addColorStop(1, "#0a0a0a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const streak = ctx.createLinearGradient(0, H * 0.3, W, H * 0.7);
    streak.addColorStop(0, "transparent");
    streak.addColorStop(0.5, "rgba(239,68,68,0.25)");
    streak.addColorStop(1, "transparent");
    ctx.fillStyle = streak;
    ctx.fillRect(0, 0, W, H);
    return;
  }

  if (key === "nouveau-drop") {
    const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
    g.addColorStop(0, "#0c4a6e");
    g.addColorStop(0.45, "#312e81");
    g.addColorStop(1, "#020617");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const orb = ctx.createRadialGradient(W * 0.85, H * 0.15, 0, W * 0.85, H * 0.15, 500);
    orb.addColorStop(0, "rgba(99,102,241,0.45)");
    orb.addColorStop(1, "transparent");
    ctx.fillStyle = orb;
    ctx.fillRect(0, 0, W, H);
    return;
  }

  if (key === "stock-limite") {
    ctx.fillStyle = "#0c0a09";
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, PRODUCT_Y + PRODUCT_H / 2, 0, W / 2, H / 2, 900);
    g.addColorStop(0, "rgba(245,158,11,0.2)");
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    return;
  }

  if (key === "luxe-premium") {
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "rgba(212,175,55,0.08)");
    g.addColorStop(0.5, "transparent");
    g.addColorStop(1, "rgba(212,175,55,0.05)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // subtle grain lines
    ctx.strokeStyle = "rgba(212,175,55,0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 160);
      ctx.lineTo(W, i * 160 + 80);
      ctx.stroke();
    }
    return;
  }

  // Custom / fallback
  if (backgroundStyle === "light") {
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, W, H);
    return;
  }
  if (backgroundStyle === "dark") {
    ctx.fillStyle = secondaryColor || "#0a0a0a";
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, H * 0.35, 0, W / 2, H * 0.35, 700);
    glow.addColorStop(0, primaryColor + "44");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, secondaryColor);
  bg.addColorStop(0.55, primaryColor + "dd");
  bg.addColorStop(1, "#020617");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
}

// ─── Badge ──────────────────────────────────────────────────────────────────

function badgeColors(tpl: StoryTemplateConfig): { bg: string; fg: string; glow: string } {
  const key = tpl.presetKey ?? "";
  if (key === "flash-sale") return { bg: "#ef4444", fg: "#fff", glow: "rgba(239,68,68,0.6)" };
  if (key === "nouveau-drop") return { bg: "#6366f1", fg: "#fff", glow: "rgba(99,102,241,0.55)" };
  if (key === "stock-limite") return { bg: "#f59e0b", fg: "#1c1917", glow: "rgba(245,158,11,0.55)" };
  if (key === "luxe-premium") return { bg: "#d4af37", fg: "#0d0d0d", glow: "rgba(212,175,55,0.45)" };
  return { bg: tpl.primaryColor, fg: "#fff", glow: tpl.primaryColor + "66" };
}

function drawBadge(ctx: CanvasRenderingContext2D, tpl: StoryTemplateConfig) {
  const label = tpl.badge;
  if (!label) return;

  const { bg, fg, glow } = badgeColors(tpl);
  ctx.font = "900 30px system-ui,sans-serif";
  const tw = ctx.measureText(label).width;
  const bw = tw + 56;
  const bh = 58;
  const bx = PAD;
  const by = 40;

  withShadow(ctx, { blur: 24, y: 8, color: glow }, () => {
    ctx.fillStyle = bg;
    roundRect(ctx, bx, by, bw, bh, 14);
    ctx.fill();
  });

  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, bx + bw / 2, by + bh / 2 + 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

// ─── Logo compact (top-right) ───────────────────────────────────────────────

function drawLogo(
  ctx: CanvasRenderingContext2D,
  tpl: StoryTemplateConfig,
  logoImg: HTMLImageElement | null,
  shopName: string
) {
  if (!tpl.showLogo) return;

  const size = 64;
  const x = W - PAD - size;
  const y = 38;

  withShadow(ctx, { blur: 20, y: 6 }, () => {
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    roundRect(ctx, x, y, size, size, 16);
    ctx.fill();
  });

  if (logoImg) {
    ctx.save();
    roundRect(ctx, x, y, size, size, 16);
    ctx.clip();
    ctx.drawImage(logoImg, x, y, size, size);
    ctx.restore();
  } else {
    ctx.fillStyle = "#fff";
    ctx.font = "800 28px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(shopName.charAt(0).toUpperCase(), x + size / 2, y + size / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
}

// ─── Product hero (65–80 % height, dominant) ────────────────────────────────

function drawProductHero(
  ctx: CanvasRenderingContext2D,
  productImg: HTMLImageElement | null,
  tpl: StoryTemplateConfig
) {
  const x = PAD;
  const y = PRODUCT_Y;
  const w = W - PAD * 2;
  const h = PRODUCT_H;
  const r = 36;

  // Outer glow frame
  withShadow(ctx, { blur: 56, y: 28 }, () => {
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
  });

  // Card border (premium rim)
  ctx.strokeStyle =
    tpl.presetKey === "luxe-premium"
      ? "rgba(212,175,55,0.45)"
      : "rgba(255,255,255,0.12)";
  ctx.lineWidth = tpl.presetKey === "luxe-premium" ? 3 : 2;
  roundRect(ctx, x, y, w, h, r);
  ctx.stroke();

  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();

  if (productImg) {
    const scale = Math.max(w / productImg.width, h / productImg.height);
    const sw = productImg.width * scale;
    const sh = productImg.height * scale;
    ctx.drawImage(productImg, x + (w - sw) / 2, y + (h - sh) / 2, sw, sh);
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "72px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("📦", x + w / 2, y + h / 2 + 24);
    ctx.textAlign = "left";
  }

  // Bottom scrim for price + name legibility
  const scrimH = 320;
  const scrim = ctx.createLinearGradient(0, y + h - scrimH, 0, y + h);
  scrim.addColorStop(0, "transparent");
  scrim.addColorStop(0.35, "rgba(0,0,0,0.55)");
  scrim.addColorStop(1, "rgba(0,0,0,0.88)");
  ctx.fillStyle = scrim;
  ctx.fillRect(x, y + h - scrimH, w, scrimH);

  ctx.restore();

  return { x, y, w, h };
}

// ─── Price + name overlay ON product ────────────────────────────────────────

function drawProductInfo(
  ctx: CanvasRenderingContext2D,
  input: StoryInput,
  box: { x: number; y: number; w: number; h: number }
) {
  const tpl = input.template;
  const price = input.price;
  const name = shortName(input.productName);

  const baseY = box.y + box.h - 36;

  // Price — immédiatement visible, très gros
  const priceColor =
    tpl.presetKey === "luxe-premium"
      ? "#d4af37"
      : tpl.presetKey === "flash-sale"
        ? "#fca5a5"
        : "#ffffff";

  ctx.font = "900 96px system-ui,sans-serif";
  ctx.fillStyle = priceColor;
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  ctx.fillText(price, box.x + 32, baseY - 72);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Product name — court, lisible, au-dessus du prix
  ctx.font = "800 38px system-ui,sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  const nameY = baseY - 130;
  const maxW = box.w - 64;
  // single line truncate if too long
  let displayName = name;
  while (ctx.measureText(displayName).width > maxW && displayName.length > 4) {
    displayName = displayName.slice(0, -2);
  }
  if (displayName !== name && !displayName.endsWith("…")) displayName += "…";
  ctx.fillText(displayName, box.x + 32, nameY);

  // Promo pill on product
  if (tpl.showPromoCode && input.promoCode) {
    const code = input.promoCode.toUpperCase();
    ctx.font = "800 26px system-ui,sans-serif";
    const pw = ctx.measureText(code).width + 48;
    const px = box.x + box.w - pw - 28;
    const py = box.y + 28;
    ctx.fillStyle = tpl.presetKey === "flash-sale" ? "#ef4444" : tpl.primaryColor;
    roundRect(ctx, px, py, pw, 52, 12);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(code, px + pw / 2, py + 26);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
}

// ─── CTA — très gros ────────────────────────────────────────────────────────

function drawCTA(ctx: CanvasRenderingContext2D, tpl: StoryTemplateConfig) {
  const x = PAD;
  const y = CTA_Y;
  const w = W - PAD * 2;
  const h = CTA_H;
  const cta = tpl.ctaText.toUpperCase();

  withShadow(ctx, { blur: 40, y: 16, color: "rgba(0,0,0,0.45)" }, () => {
    const g = ctx.createLinearGradient(x, y, x + w, y);
    const key = tpl.presetKey ?? "";
    if (key === "flash-sale") {
      g.addColorStop(0, "#ef4444");
      g.addColorStop(1, "#dc2626");
    } else if (key === "nouveau-drop") {
      g.addColorStop(0, "#6366f1");
      g.addColorStop(1, "#4f46e5");
    } else if (key === "stock-limite") {
      g.addColorStop(0, "#f59e0b");
      g.addColorStop(1, "#d97706");
    } else if (key === "luxe-premium") {
      g.addColorStop(0, "#e8c547");
      g.addColorStop(0.5, "#d4af37");
      g.addColorStop(1, "#b8941f");
    } else {
      g.addColorStop(0, tpl.primaryColor);
      g.addColorStop(1, tpl.secondaryColor);
    }
    ctx.fillStyle = g;
    roundRect(ctx, x, y, w, h, 28);
    ctx.fill();
  });

  ctx.fillStyle = tpl.presetKey === "luxe-premium" ? "#0d0d0d" : "#ffffff";
  ctx.font = "900 42px system-ui,sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(cta, x + w / 2, y + h / 2 + 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

// ─── Accent strip between product and CTA ───────────────────────────────────

function drawAccentStrip(ctx: CanvasRenderingContext2D, tpl: StoryTemplateConfig) {
  const stripY = PRODUCT_Y + PRODUCT_H + 12;
  const stripH = CTA_Y - stripY - 12;
  if (stripH < 20) return;

  ctx.font = "700 24px system-ui,sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.textAlign = "center";
  ctx.fillText("↓ SWIPE UP · LIEN EN BIO ↓", W / 2, stripY + stripH / 2 + 8);
  ctx.textAlign = "left";
}

// ─── Main render ────────────────────────────────────────────────────────────

export async function renderStoryCanvas(input: StoryInput): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const tpl = input.template;

  let productImg: HTMLImageElement | null = null;
  if (input.imageUrl) {
    try {
      productImg = await loadImage(input.imageUrl);
    } catch {
      productImg = null;
    }
  }

  let logoImg: HTMLImageElement | null = null;
  if (input.logoUrl && tpl.showLogo) {
    try {
      logoImg = await loadImage(input.logoUrl);
    } catch {
      logoImg = null;
    }
  }

  drawBackground(ctx, tpl, productImg);
  drawBadge(ctx, tpl);
  drawLogo(ctx, tpl, logoImg, input.shopName);

  const box = drawProductHero(ctx, productImg, tpl);
  drawProductInfo(ctx, input, box);
  drawAccentStrip(ctx, tpl);
  drawCTA(ctx, tpl);

  return canvas;
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

export const STORY_PREVIEW_RATIO = "9 / 16";
