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
        {/* 모바일 핀치 줌 및 과도한 확대 방지 스크립트 (즉시 실행) */}
        <Script id="prevent-mobile-zoom" strategy="beforeInteractive">
          {`
          (function() {
            'use strict';

            // 즉시 실행하여 최대한 이른 타이밍에 이벤트 리스너 등록
            function preventZoom(e) {
              // data-allow-zoom="true" 영역에서는 줌 허용
              const allowZoomTarget = (e.target as HTMLElement | null)?.closest?.('[data-allow-zoom="true"]');
              if (allowZoomTarget) {
                return;
              }
              e.preventDefault();
              e.stopImmediatePropagation();
              return false;
            }

            // 멀티터치 핀치 줌 방지 (강력한 우선순위)
            document.addEventListener('touchstart', function(e) {
              if (e.touches.length > 1) {
                preventZoom(e);
              }
            }, { passive: false, capture: true });

            // 핀치 제스처 방지 (iOS Safari 등)
            ['gesturestart', 'gesturechange', 'gestureend'].forEach(function(eventType) {
              document.addEventListener(eventType, preventZoom, { passive: false, capture: true });
            });

            // 추가 핀치 이벤트 (일부 브라우저)
            ['pinchstart', 'pinchchange', 'pinchend'].forEach(function(eventType) {
              document.addEventListener(eventType, preventZoom, { passive: false, capture: true });
            });

            // 트랙패드/휠 줌 방지
            document.addEventListener('wheel', function(e) {
              if (e.ctrlKey || e.metaKey) { // Ctrl+휠 또는 Cmd+휠 (줌)
                preventZoom(e);
              }
            }, { passive: false, capture: true });

            // 더블탭 줌 방지
            let lastTouchEnd = 0;
            let isDragging = false;

            document.addEventListener('touchstart', function(e) {
              const dragTarget = e.target.closest('[data-image-index], .image-manager-container');
              if (dragTarget && e.touches.length === 1) {
                setTimeout(function() {
                  isDragging = true;
                }, 400);
              }
            }, { passive: true, capture: true });

            document.addEventListener('touchmove', function(e) {
              if (e.target.closest('[data-image-index], .image-manager-container')) {
                isDragging = true;
              }
            }, { passive: true, capture: true });

            document.addEventListener('touchend', function(event) {
              const allowZoomTarget = (event.target as HTMLElement | null)?.closest?.('[data-allow-zoom="true"]');
              if (allowZoomTarget) {
                // 확대 허용 영역에서는 더블탭 방지하지 않음
                return;
              }

              const isDragContainer =
                event.target.closest('[data-image-index]') ||
                event.target.closest('.image-manager-container');

              // 드래그 영역이거나 드래그 중이면 더블탭 방지 안함
              if (!isDragContainer && !isDragging) {
                const now = Date.now();
                if (now - lastTouchEnd <= 300) {
                  event.preventDefault();
                  event.stopImmediatePropagation();
                }
                lastTouchEnd = now;
              }

              // 드래그 상태 리셋
              setTimeout(function() {
                isDragging = false;
              }, 100);
            }, { passive: false, capture: true });

            // 추가 안전장치: viewport 메타 태그 동적 수정 (필요시)
            const viewport = document.querySelector('meta[name=viewport]');
            if (viewport) {
              const content = viewport.getAttribute('content') || '';
              if (!content.includes('user-scalable=no')) {
                viewport.setAttribute('content', content + ', user-scalable=no');
              }
            }

            // CSS 주입으로 추가 방지
            const style = document.createElement('style');
            style.textContent = '* { touch-action: manipulation; } [data-allow-zoom="true"] { touch-action: auto; }';
            document.head.appendChild(style);

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
        {children}
      </body>
    </html>
  )
}




