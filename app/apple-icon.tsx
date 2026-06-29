import { catalinkAppIconImage } from "@/lib/catalink-app-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return catalinkAppIconImage(180);
}
