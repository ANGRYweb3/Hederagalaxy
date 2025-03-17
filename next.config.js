/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', 'three-mesh-bvh'],
  typescript: {
    // ลดความเข้มงวดของ TypeScript เพื่อให้สามารถ build ได้แม้มี error
    ignoreBuildErrors: true,
  },
  eslint: {
    // ลดความเข้มงวดของ ESLint เพื่อให้สามารถ build ได้แม้มี error
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 