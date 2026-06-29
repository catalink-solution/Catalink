import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import toIco from "to-ico";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const masterPath = join(root, "public/icons/catalink-app-icon-master.png");
const publicDir = join(root, "public");
const iconsDir = join(publicDir, "icons");

/** Maskable safe zone — logo at 85% inside a 512² canvas (≈15% margin). */
const MASKABLE_INNER_RATIO = 0.85;

async function resizePng(size, outputPath) {
  await sharp(masterPath)
    .resize(size, size, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);
}

async function writeMaskable512(outputPath) {
  const canvas = 512;
  const inner = Math.round(canvas * MASKABLE_INNER_RATIO);
  const resized = await sharp(masterPath)
    .resize(inner, inner, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  const { data, info } = await sharp(resized).raw().toBuffer({ resolveWithObject: true });
  const offset = Math.round((canvas - info.width) / 2);

  await sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: info.channels,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite([{ input: data, raw: info, left: offset, top: offset }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);
}

async function writeFaviconIco(outputPath) {
  const [png16, png32] = await Promise.all([
    sharp(masterPath).resize(16, 16, { fit: "fill", kernel: sharp.kernel.lanczos3 }).png().toBuffer(),
    sharp(masterPath).resize(32, 32, { fit: "fill", kernel: sharp.kernel.lanczos3 }).png().toBuffer(),
  ]);
  const ico = await toIco([png16, png32]);
  await writeFile(outputPath, ico);
}

async function main() {
  await mkdir(iconsDir, { recursive: true });

  const outputs = [
    { path: join(iconsDir, "favicon-16x16.png"), size: 16 },
    { path: join(iconsDir, "favicon-32x32.png"), size: 32 },
    { path: join(iconsDir, "apple-touch-icon.png"), size: 180 },
    { path: join(iconsDir, "icon-192.png"), size: 192 },
    { path: join(iconsDir, "icon-512.png"), size: 512 },
  ];

  for (const { path, size } of outputs) {
    await resizePng(size, path);
    console.log(`✓ ${path.replace(root + "\\", "").replace(root + "/", "")}`);
  }

  await writeMaskable512(join(iconsDir, "icon-512-maskable.png"));
  console.log("✓ public/icons/icon-512-maskable.png");

  await writeFaviconIco(join(publicDir, "favicon.ico"));
  console.log("✓ public/favicon.ico");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
