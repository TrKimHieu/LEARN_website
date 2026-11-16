import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  typedRoutes: false,
  // Ẩn nút "N" (Next.js dev tools) ở góc màn — chỉ có ở dev, nhưng che nội dung và lọt
  // vào mọi ảnh chụp soát giao diện.
  devIndicators: false,
  // Lint chạy riêng bằng `npm run lint` (flat config, không dùng plugin Next); bỏ lượt lint trùng khi
  // build, vốn chỉ in cảnh báo "Next.js plugin was not detected".
  eslint: { ignoreDuringBuilds: true },
  // ~1.500 icon trong một barrel — chỉ nạp những icon thật sự import (ADR 013).
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
  },
};

export default nextConfig;
