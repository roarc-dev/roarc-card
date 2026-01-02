/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 환경 변수 설정 (서버와 클라이언트 모두에서 접근 가능하도록)
  env: {
    NEXT_PUBLIC_PROXY_URL: process.env.NEXT_PUBLIC_PROXY_URL || process.env.PROXY_URL || 'https://wedding-admin-proxy.vercel.app',
    PROXY_URL: process.env.PROXY_URL || process.env.NEXT_PUBLIC_PROXY_URL || 'https://wedding-admin-proxy.vercel.app',
  },
  // 외부 이미지 도메인 허용
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.roarc.kr',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'yjlzizakdjghpfduxcki.supabase.co',
      },
    ],
  },
  // 트랜스파일할 외부 패키지
  transpilePackages: ['framer-motion'],
  // Turbopack 설정 - alias 포함
  turbopack: {
    resolveAlias: {
      // framer 패키지를 mock으로 대체
      framer: './lib/framer-mock.ts',
    },
    // workspace root 추론 이슈 방지 (monorepo/다중 lockfile)
    root: __dirname,
  },
}

module.exports = nextConfig




