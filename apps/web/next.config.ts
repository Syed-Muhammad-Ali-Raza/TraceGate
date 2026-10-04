import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { NextConfig } from 'next';

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * `output: 'standalone'` is for Docker images. On Windows, Next's standalone
 * copy step needs symlink privileges and fails with EPERM in many local setups.
 */
const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD === '1' ? 'standalone' : undefined,
  outputFileTracingRoot: monorepoRoot,
  reactStrictMode: true,
  transpilePackages: ['@llm-gateway/shared'],
};

export default nextConfig;
