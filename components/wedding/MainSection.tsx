'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { PROXY_BASE_URL } from '@/lib/supabase'
// @ts-ignore
import typography from "@/lib/typography.js"
import NameSection from './NameSection'
import PhotoSectionProxy from './PhotoSectionProxy'
import EternalNameSection from './EternalNameSection'
import EternalMainPhoto from './EternalMainPhoto'
import EternalDateVenue from './EternalDateVenue'
import FioreNameSection from './FioreNameSection'
import FioreDateVenue from './FioreDateVenue'

interface PageSettings {
  page_id: string
  type?: 'papillon' | 'eternal' | 'fiore' | 'mobile'
  groom_name?: string
  bride_name?: string
  groom_name_en?: string
  bride_name_en?: string
}

async function getPageSettingsByPageId(pageId: string): Promise<PageSettings | null> {
  try {
    const response = await fetch(
      `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    )
    if (!response.ok) {
      return null
    }
    const result = await response.json()
    if (result.success && result.data) {
      return result.data as PageSettings
    }
    return null
  } catch (error) {
    console.error('[MainSection] 페이지 설정 조회 실패:', error)
    return null
  }
}

interface MainSectionProps {
  pageId?: string
  style?: React.CSSProperties
}

// Eternal 타입 인터랙션 래퍼 컴포넌트
function EternalInteractionWrapper({
  pageId,
  pageSettings,
  goldenbookFontFamily,
  style,
}: {
  pageId?: string
  pageSettings: PageSettings | null
  goldenbookFontFamily: string
  style?: React.CSSProperties
}) {
  const [isScrolled, setIsScrolled] = useState(false)

  // Sloop Script Pro 폰트 스택 가져오기
  const sloopScriptProFontFamily = useMemo(() => {
    try {
      return (
        typography?.helpers?.stacks?.sloopScriptPro ||
        '"sloop-script-pro", "Sloop Script Pro", cursive, sans-serif'
      )
    } catch {
      return '"sloop-script-pro", "Sloop Script Pro", cursive, sans-serif'
    }
  }, [])

  // 스크롤 트리거 감지
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop
      if (currentScrollY > 0 && !isScrolled) {
        setIsScrolled(true)
      } else if (currentScrollY === 0 && isScrolled) {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isScrolled])

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '430px',
        position: 'relative',
        ...style,
      }}
    >
      {/* 실제 컨텐츠 레이어 */}
      <div
        style={{
          paddingTop: '60px',
          paddingBottom: '60px',
          paddingLeft: 0,
          paddingRight: 0,
          width: '100%',
          maxWidth: '100vw', // 뷰포트 너비를 넘지 않도록
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px',
          position: 'relative',
          overflowX: 'hidden', // 가로 스크롤 방지
          boxSizing: 'border-box',
        }}
      >
        <EternalNameSection
          groomName={pageSettings?.groom_name_en}
          brideName={pageSettings?.bride_name_en}
          pageId={pageId}
          style={{ width: '100%', maxWidth: '439px' }}
        />
        {/* EternalMainPhoto와 텍스트를 하나의 div로 묶기 */}
        <div
          style={{
            width: '319px',
            height: 'fit-content',
            display: 'flex',
            flexDirection: 'column',
            gap: '60px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              height: 'fit-content',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              alignItems: 'center',
            }}
          >
            <EternalMainPhoto
              pageId={pageId}
              style={{
                width: '70%',
                height: '223px',
              }}
            />
            <div
              style={{
                width: '100%',
                textAlign: 'center',
                fontFamily: goldenbookFontFamily,
                fontSize: '12px',
                lineHeight: '1.5',
                color: '#000000',
              }}
            >
              REQUEST THE HONOR OF YOUR PRESENCE
              <br />
              AS WE EXCHANGE OUR VOWS AND UNITE IN MARRIAGE.
            </div>
          </div>
          <EternalDateVenue pageId={pageId} />
        </div>
      </div>

      {/* 인터랙션 레이어 (컨텐츠와 같은 높이) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 0,
          pointerEvents: 'none',
          zIndex: 1, // 컨텐츠보다 낮게 설정
        }}
      >
        
        {/* 좌측 인터랙션 div */}
        <motion.div
          initial={{ rotateY: 0, x: 0 }}
          animate={isScrolled ? { rotateY: 90, x: -110 } : { rotateY: 0, x: 0 }}
          style={{
            width: '50%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            overflow: 'hidden',
          }}
          transition={{
            type: 'spring',
            duration: 1,
            bounce: 0,
          }}
        >
          <img
            src="/images/eternalInteraction.webp"
            alt="Eternal interaction left"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
          {/* 텍스트 레이어 */}
          <div
            style={{
              position: 'absolute',
              top: '570px',
              left: '80px',
              transform: 'translate(0, -50%)',
              fontFamily: sloopScriptProFontFamily,
              fontSize: '30px',
              lineHeight: '1.4',
              color: '#000000',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            The Beginning of our Forever
          </div>
          {/* 로고 이미지 레이어 */}
          <img
            src="/images/roarc-logo.webp"
            alt="Roarc logo"
            style={{
              position: 'absolute',
              top: '200px',
              right: '-25px',
              transform: 'translate(0, -50%)',
              height: '50px',
              width: 'auto',
              pointerEvents: 'none',
            }}
          />
        </motion.div>

        {/* 우측 인터랙션 div (좌우 반전) */}
        <motion.div
          initial={{ rotateY: 0, x: 0 }}
          animate={isScrolled ? { rotateY: 90, x: 110 } : { rotateY: 0, x: 0 }}
          style={{
            width: '50%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            overflow: 'hidden',
          }}
          transition={{
            type: 'spring',
            duration: 1,
            bounce: 0,
          }}
        >
          <img
            src="/images/eternalInteraction.webp"
            alt="Eternal interaction right"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              transform: 'scaleX(-1)', // 좌우 반전
            }}
          />
          {/* 텍스트 레이어 */}
          <div
            style={{
              position: 'absolute',
              top: '570px',
              right: '87px',
              transform: 'translate(0, -50%)',
              fontFamily: sloopScriptProFontFamily,
              fontSize: '30px',
              lineHeight: '1.4',
              color: '#000000',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            The Beginning of our Forever
          </div>
          {/* 로고 이미지 레이어 */}
          <img
            src="/images/roarc-logo.webp"
            alt="Roarc logo"
            style={{
              position: 'absolute',
              top: '200px',
              left: '-25px',
              transform: 'translate(0, -50%)',
              height: '50px',
              width: 'auto',
              pointerEvents: 'none',
            }}
          />
        </motion.div>
      </div>
    </div>
  )
}

export default function MainSection(props: MainSectionProps) {
  const { pageId, style } = props
  const [pageType, setPageType] = useState<'papillon' | 'eternal' | 'fiore' | 'mobile' | null>(null)
  const [pageSettings, setPageSettings] = useState<PageSettings | null>(null)

  // Goldenbook 폰트 스택 가져오기
  const goldenbookFontFamily = useMemo(() => {
    try {
      return typography?.helpers?.stacks?.goldenbook || '"goldenbook", "Goldenbook", serif'
    } catch {
      return '"goldenbook", "Goldenbook", serif'
    }
  }, [])

  // 페이지 설정 로드 및 type 조회
  useEffect(() => {
    let mounted = true
    
    // 개발 모드에서 URL 쿼리 파라미터로 type 오버라이드 (클라이언트 사이드에서만)
    const getDevTypeOverride = (): 'papillon' | 'eternal' | 'fiore' | 'mobile' | null => {
      if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
        return null
      }
      try {
        const params = new URLSearchParams(window.location.search)
        const overrideType = params.get('type')
        if (overrideType === 'papillon' || overrideType === 'eternal' || overrideType === 'fiore' || overrideType === 'mobile') {
          console.log('[MainSection] 개발 모드: type 오버라이드:', overrideType)
          return overrideType
        }
      } catch (error) {
        console.warn('[MainSection] 쿼리 파라미터 읽기 실패:', error)
      }
      return null
    }
    
    async function load() {
      if (!pageId) {
        setPageType(null)
        setPageSettings(null)
        return
      }
      const data = await getPageSettingsByPageId(pageId)
      if (!mounted) return
      if (data) {
        setPageSettings(data)
        // 개발 모드에서 쿼리 파라미터로 type 오버라이드
        const devOverride = getDevTypeOverride()
        const finalType = devOverride || data.type || 'papillon'
        setPageType(finalType)
      } else {
        // 데이터가 없으면 개발 모드 오버라이드 또는 기본값 'papillon' 사용
        const devOverride = getDevTypeOverride()
        setPageType(devOverride || 'papillon')
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [pageId])

  // type에 따라 적절한 컴포넌트 렌더링
  if (!pageType) {
    // 로딩 중이거나 pageId가 없는 경우 로딩 텍스트만 표시
    return (
      <div
        style={{
          width: '100%',
          height: '800px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px 0',
          ...style,
        }}
      >
        <div
          style={{
            color: '#999999',
            fontSize: '14px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          }}
        >
          불러오는 중..
        </div>
      </div>
    )
  }

  switch (pageType) {
    case 'papillon':
      return (
        <div style={style}>
          <NameSection
            groomName={pageSettings?.groom_name}
            brideName={pageSettings?.bride_name}
            pageId={pageId}
            style={{ width: '88%' }}
          />
          <PhotoSectionProxy pageId={pageId} />
        </div>
      )

    case 'eternal':
      return <EternalInteractionWrapper pageId={pageId} pageSettings={pageSettings} goldenbookFontFamily={goldenbookFontFamily} style={style} />

    case 'fiore':
      return (
        <div
          style={{
            paddingTop: '40px',
            paddingBottom: '80px',
            paddingLeft: 0,
            paddingRight: 0,
            ...style,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <FioreNameSection
            pageId={pageId}
            style={{ width: '100%', maxWidth: '439px', marginBottom: '40px' }}
          />
          {/* EternalMainPhoto와 FioreDateVenue를 하나의 div로 묶기 */}
          <div
            style={{
              width: '100%',
              height: 'fit-content',
              display: 'flex',
              flexDirection: 'column',
              gap: '40px',
            }}
          >
            {/* EternalMainPhoto 부모 div (가로 100%) */}
            <div
              style={{
                width: '100%',
                height: 'fit-content',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <EternalMainPhoto
                pageId={pageId}
                style={{
                  width: '70%',
                  height: '302px',
                }}
              />
            </div>
            <FioreDateVenue pageId={pageId} />
          </div>
        </div>
      )

    default:
      // 'mobile' 또는 알 수 없는 type인 경우 papillon으로 폴백
      return (
        <div style={style}>
          <NameSection
            groomName={pageSettings?.groom_name}
            brideName={pageSettings?.bride_name}
            pageId={pageId}
            style={{ width: '88%' }}
          />
          <PhotoSectionProxy pageId={pageId} />
        </div>
      )
  }
}

