import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  typedRoutes: false,
  // Ẩn nút "N" (Next.js dev tools) ở góc màn — chỉ có ở dev, nhưng che nội dung và lọt
  // vào mọi ảnh chụp soát giao diện.
  devIndicators: false,
  // ~1.500 icon trong một barrel — chỉ nạp những icon thật sự import (ADR 013).
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
  },
};

export default nextConfig;
