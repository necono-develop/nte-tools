export function assetPath(path: string | undefined): string {
  if (!path) return "";
  return `/${path.replace(/^\/+/, "")}`;
}
