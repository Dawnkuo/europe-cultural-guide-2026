import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const repository =
  process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'europe-cultural-guide-2026';
const basePath = isGitHubPages ? `/${repository}` : '';

const nextConfig: NextConfig = {
  ...(isGitHubPages ? { output: 'export' } : {}),
  assetPrefix: basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
