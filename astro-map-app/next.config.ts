import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Modo standalone para deploy com servidor Node.js
  output: 'standalone',
  
  // Desabilita otimização de imagens (não precisamos)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
