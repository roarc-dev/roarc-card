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
        {/* 카카오 SDK 스크립트 - 카카오 개발자 문서에 따른 올바른 로드 방식 */}
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          integrity="sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Hs90nka"
          crossOrigin="anonymous"
          strategy="afterInteractive"
          onLoad={() => {
            console.log('[layout.tsx] 카카오 SDK 스크립트 로드 완료')
            // SDK 로드 후 약간의 지연을 두고 초기화 (SDK가 완전히 준비될 때까지 대기)
            setTimeout(() => {
              if (typeof window !== 'undefined' && (window as any).Kakao) {
                console.log('[layout.tsx] window.Kakao 존재 확인')
                const kakao = (window as any).Kakao
                try {
                  if (typeof kakao.isInitialized === 'function' && !kakao.isInitialized()) {
                    console.log('[layout.tsx] 카카오 SDK 초기화 시작')
                    kakao.init('db63a9b37174b5a425a21d797318dff8')
                    console.log('[layout.tsx] 카카오 SDK 초기화 완료, isInitialized:', kakao.isInitialized())
                  } else if (kakao.isInitialized && kakao.isInitialized()) {
                    console.log('[layout.tsx] 카카오 SDK 이미 초기화됨')
                  } else {
                    // isInitialized 함수가 없는 경우 강제 초기화
                    console.log('[layout.tsx] isInitialized 함수 없음, 강제 초기화')
                    kakao.init('db63a9b37174b5a425a21d797318dff8')
                  }
                } catch (error) {
                  console.error('[layout.tsx] 카카오 SDK 초기화 중 오류:', error)
                }
              } else {
                console.error('[layout.tsx] window.Kakao를 찾을 수 없음')
              }
            }, 100) // 100ms 지연으로 SDK 완전 로드 대기
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




