/** True when pathname is a customer order tracking page (accessible even if shop suspended). */
export function isOrderTrackingPath(pathname: string, slug: string): boolean {
  const normalized = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  const prefix = `/${slug}/order`;
  return normalized === prefix || normalized.startsWith(`${prefix}/`);
}
