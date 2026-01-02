import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

// 기본 메타데이터
export const metadata: Metadata = {
  title: 'roarc mobile card',
  description: 'We make Romantic Art Creations',
  icons: {
    icon: 'https://cdn.roarc.kr/data/roarc_pavicon_B.png',
  },
  openGraph: {
    title: 'roarc mobile card',
    description: 'We make Romantic Art Creations',
    images: ['https://cdn.roarc.kr/data/roarc_SEO_basic.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'roarc mobile card',
    description: 'We make Romantic Art Creations',
    images: ['https://cdn.roarc.kr/data/roarc_SEO_basic.jpg'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* Typography 폰트 스크립트 - 전역 로드 */}
        <Script
          src="https://cdn.roarc.kr/fonts/typography.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        {/* 카카오 SDK 스크립트 */}
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          integrity="sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Hs90nka"
          crossOrigin="anonymous"
          strategy="afterInteractive"
          onLoad={() => {
            console.log('[layout.tsx] 카카오 SDK 스크립트 로드 완료')
            if (typeof window !== 'undefined' && (window as any).Kakao) {
              console.log('[layout.tsx] window.Kakao 존재 확인')
              const kakao = (window as any).Kakao
              if (kakao.isInitialized && !kakao.isInitialized()) {
                console.log('[layout.tsx] 카카오 SDK 초기화 시작')
                kakao.init('db63a9b37174b5a425a21d797318dff8')
                console.log('[layout.tsx] 카카오 SDK 초기화 완료')
              } else {
                console.log('[layout.tsx] 카카오 SDK 이미 초기화됨')
              }
            } else {
              console.error('[layout.tsx] window.Kakao를 찾을 수 없음')
            }
          }}
          onError={(error) => {
            console.error('[layout.tsx] 카카오 SDK 스크립트 로드 실패:', error)
          }}
        />
        {/* 카카오 맵 SDK */}
        <Script
          src="//dapi.kakao.com/v2/maps/sdk.js?appkey=db63a9b37174b5a425a21d797318dff8"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  )
}




