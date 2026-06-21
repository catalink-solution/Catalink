import { pwaIconImage } from "@/lib/pwa-icon";

export async function GET() {
  return pwaIconImage(192);
}
