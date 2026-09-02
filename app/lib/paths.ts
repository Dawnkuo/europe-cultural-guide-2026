export function withBasePath(path: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');

  if (!path.startsWith('/')) return path;
  if (path === '/') return `${basePath}/`;
  return `${basePath}${path}`;
}
