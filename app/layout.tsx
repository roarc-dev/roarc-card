import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { SWRProvider } from '@/components/providers/SWRProvider'
import './globals.css'
import 'swiper/css'
import 'swiper/css/zoom'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'

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

// viewport에 user-scalable=no 추가
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* Resource Hints - 외부 리소스 미리 연결 */}
        <link rel="preconnect" href="https://cdn.roarc.kr" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://wedding-admin-proxy.vercel.app" />
        <link rel="dns-prefetch" href="https://cdn.roarc.kr" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="https://use.typekit.net" />

        {/* Typography 폰트 스크립트 - 전역 로드 */}
        <Script
          src="https://cdn.roarc.kr/fonts/typography.js"
          strategy="beforeInteractive"
        />
        {/* 모바일 핀치 줌 및 과도한 확대 방지 스크립트 (즉시 실행) */}
        <Script id="prevent-mobile-zoom" strategy="beforeInteractive">
          {`
          (function() {
            'use strict';

            // CSS 주입 (최우선)
            var style = document.createElement('style');
            style.textContent = '* { touch-action: manipulation; -webkit-user-select: none; } [data-allow-zoom="true"] { touch-action: auto; -webkit-user-select: auto; }';
            (document.head || document.documentElement).appendChild(style);

            function preventZoom(e) {
              var target = e.target;
              // Swiper 줌 컨테이너 또는 data-allow-zoom="true" 영역에서는 줌 허용
              while (target && target !== document) {
                if (target.getAttribute && target.getAttribute('data-allow-zoom') === 'true') {
                  return;
                }
                if (target.className && (
                    target.className.indexOf('swiper-zoom-container') !== -1 ||
                    target.className.indexOf('swiper-slide') !== -1 ||
                    target.className.indexOf('swiper') !== -1
                )) {
                  return;
                }
                target = target.parentNode;
              }
              e.preventDefault();
              e.stopImmediatePropagation();
              return false;
            }

            // DOMContentLoaded를 기다리지 않고 즉시 등록
            var events = ['touchstart', 'touchmove', 'touchend', 'gesturestart', 'gesturechange', 'gestureend'];
            
            events.forEach(function(eventType) {
              document.addEventListener(eventType, function(e) {
                if (eventType === 'touchstart' || eventType === 'touchmove') {
                  if (e.touches && e.touches.length > 1) {
                    preventZoom(e);
                  }
                } else if (eventType.indexOf('gesture') !== -1) {
                  preventZoom(e);
                }
              }, { passive: false, capture: true });
            });

            // 휠 줌 방지
            document.addEventListener('wheel', function(e) {
              if (e.ctrlKey || e.metaKey) {
                preventZoom(e);
              }
            }, { passive: false, capture: true });

            // 더블탭 줌 방지
            var lastTouchEnd = 0;
            var tapTimeout = null;
            
            document.addEventListener('touchend', function(event) {
              var target = event.target;
              
              // Swiper 또는 data-allow-zoom 체크
              while (target && target !== document) {
                if (target.getAttribute && target.getAttribute('data-allow-zoom') === 'true') {
                  return;
                }
                if (target.className && (
                    target.className.indexOf('swiper-zoom-container') !== -1 ||
                    target.className.indexOf('swiper-slide') !== -1 ||
                    target.className.indexOf('swiper') !== -1
                )) {
                  return;
                }
                if (target.getAttribute && (
                    target.getAttribute('data-image-index') !== null ||
                    target.className && target.className.indexOf('image-manager-container') !== -1
                )) {
                  return;
                }
                target = target.parentNode;
              }

              var now = Date.now();
              if (now - lastTouchEnd <= 300) {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (tapTimeout) {
                  clearTimeout(tapTimeout);
                }
              }
              lastTouchEnd = now;
              
              tapTimeout = setTimeout(function() {
                lastTouchEnd = 0;
              }, 300);
            }, { passive: false, capture: true });

          })();
        `}
        </Script>
      </head>
      <body>
        {/* 카카오 SDK 스크립트 - 단순 로드만 수행, 초기화는 컴포넌트에서 처리 */}
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          integrity="sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Hs90nka"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* 카카오 맵 SDK */}
        <Script
          src="//dapi.kakao.com/v2/maps/sdk.js?appkey=db63a9b37174b5a425a21d797318dff8"
          strategy="afterInteractive"
        />
        <SWRProvider>{children}</SWRProvider>
      </body>
    </html>
  )
}