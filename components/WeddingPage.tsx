'use client'

import React, { useMemo, useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import type { PageSettings } from '@/lib/supabase'
import { ComponentType, DEFAULT_COMPONENT_ORDER } from '@/lib/components-registry'
import { assignBackgroundColors, postProcessGalleryColors, getButtonColor, type BackgroundColor } from '@/lib/background-colors'
// @ts-ignore
import typography from "@/lib/typography.js"

// 즉시 필요한 컴포넌트들 (정적 import)
import BGM from '@/components/wedding/BGM'
import { PlaceholderComponent } from '@/components/wedding'

// 중간 크기 컴포넌트들 (Dynamic import)
const WeddingInvitationSection = dynamic(() => import('@/components/wedding/WeddingInvitationSection'), {
  loading: () => <div style={{ width: '100%', minHeight: '200px', background: '#fff' }} />,
  ssr: true
})

const CalendarSection = dynamic(() => import('@/components/wedding/CalendarSection'), {
  loading: () => <div style={{ width: '100%', minHeight: '300px', background: '#fafafa' }} />,
  ssr: true
})

const Info = dynamic(() => import('@/components/wedding/Info'), {
  loading: () => <div style={{ width: '100%', minHeight: '250px', background: '#f5f5f5' }} />,
  ssr: true
})

const KakaoShare = dynamic(() => import('@/components/wedding/KakaoShare'), {
  loading: () => <div style={{ width: '100%', minHeight: '150px', background: '#fff' }} />,
  ssr: false // 공유 기능은 클라이언트에서만 필요
})

// 무거운 컴포넌트들 (Dynamic import - 코드 스플리팅)
const MainSection = dynamic(() => import('@/components/wedding/MainSection'), {
  loading: () => <div style={{ width: '100%', height: '100vh', background: '#fff' }} />,
  ssr: true
})

const LocationUnified = dynamic(() => import('@/components/wedding/LocationUnified'), {
  loading: () => <div style={{ width: '100%', minHeight: '400px', background: '#fafafa' }} />,
  ssr: true
})

const UnifiedGalleryComplete = dynamic(() => import('@/components/wedding/UnifiedGalleryComplete'), {
  loading: () => <div style={{ width: '100%', minHeight: '300px', background: '#f5f5f5' }} />,
  ssr: false // 갤러리는 클라이언트에서만 렌더링
})

const CommentBoard = dynamic(() => import('@/components/wedding/CommentBoard'), {
  loading: () => <div style={{ width: '100%', minHeight: '400px', background: '#fff' }} />,
  ssr: false // 댓글은 클라이언트에서만 필요
})

const Account = dynamic(() => import('@/components/wedding/Account'), {
  loading: () => <div style={{ width: '100%', minHeight: '300px', background: '#f5f5f5' }} />,
  ssr: true
})

const RSVPClient = dynamic(() => import('@/components/wedding/RSVPClient'), {
  loading: () => <div style={{ width: '100%', minHeight: '350px', background: '#fafafa' }} />,
  ssr: false // RSVP 폼은 클라이언트에서만 필요
})

const MobileCoverAnimation = dynamic(() => import('@/components/wedding/mobileCover'), {
  loading: () => null,
  ssr: false // 애니메이션은 클라이언트에서만
})

// 정적 footer 스타일 (재사용)
const FOOTER_TEXT_STYLE = {
  fontSize: '12px',
  color: '#BABABA',
  letterSpacing: '0em',
  fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
  fontWeight: 400,
} as const

interface WeddingPageProps {
  pageSettings: PageSettings
}

/**
 * 청첩장 페이지 컴포넌트
 * 
 * - pageSettings에서 컴포넌트 순서를 읽어서 렌더링
 * - 각 컴포넌트에 pageId를 전달하여 API에서 데이터를 가져옴
 */
export default function WeddingPage({ pageSettings }: WeddingPageProps) {
  // 로컬 테스트용: "taehohoho"를 임시 pageId로 사용
  // 실제 운영 시에는 pageSettings.page_id를 사용
  const pageId =
    process.env.NODE_ENV === 'development' && pageSettings.page_id === 'taehohoho'
      ? 'taehohoho'
      : pageSettings.page_id

  // Typography 폰트 로딩 (페이지 레벨에서 한번만)
  useEffect(() => {
    try {
      if (typography && typeof typography.ensure === 'function') {
        typography.ensure()
      }
    } catch (error) {
      console.warn('[WeddingPage] Typography loading failed:', error)
    }
  }, [])

  // admin에서 저장한 ID를 실제 ComponentType으로 매핑
  // (backward compatibility를 위해 양쪽 ID 모두 지원)
  const normalizeComponentId = (id: string): ComponentType | null => {
    const mapping: Record<string, ComponentType> = {
      // admin에서 사용하는 소문자/간단한 ID → 실제 ComponentType
      'commentBoard': 'CommentBoard',
      'calendar': 'CalendarProxy',
      'transport': 'LocationUnified',
      'info': 'Info',
      'account': 'Account',
      'rsvp': 'RSVPClient',
      'gallery': 'UnifiedGalleryComplete',
      'location': 'LocationUnified',
      'invite': 'InviteName',
      'kakaoShare': 'KakaoShare',
    }

    // 1. mapping에 있으면 변환
    if (mapping[id]) {
      return mapping[id]
    }

    // 2. 이미 정확한 ComponentType이면 그대로 반환
    if (id === 'CommentBoard' || id === 'CalendarProxy' || id === 'LocationUnified' ||
        id === 'Info' || id === 'Account' || id === 'RSVPClient' || id === 'UnifiedGalleryComplete' ||
        id === 'InviteName' || id === 'KakaoShare' || id === 'MainSection' || id === 'bgm' ||
        id === 'CalendarAddBtn' || id === 'WeddingContact' || id === 'rsvpResult' ||
        id === 'NameSection' || id === 'PhotoSectionProxy') {
      return id as ComponentType
    }

    // 3. 알 수 없는 ID는 null 반환 (렌더링하지 않음)
    console.warn('[WeddingPage] Unknown component ID:', id)
    return null
  }

  // 컴포넌트 순서 결정 (설정에서 가져오거나 기본값 사용)
  // NameSection과 PhotoSectionProxy를 MainSection으로 통합
  const componentOrder = useMemo(() => {
    let order: ComponentType[]

    if (pageSettings.component_order && Array.isArray(pageSettings.component_order)) {
      // admin에서 저장한 ID들을 정확한 ComponentType으로 변환
      let customOrder = pageSettings.component_order
        .map((id: any) => normalizeComponentId(String(id)))
        .filter((id): id is ComponentType => id !== null)

      // CalendarProxy 바로 다음에 CalendarAddBtn 자동 추가
      // (admin에서는 calendar 하나로 관리하지만, 실제로는 두 컴포넌트가 함께 렌더링)
      const expandedOrder: ComponentType[] = []
      for (const comp of customOrder) {
        expandedOrder.push(comp)
        if (comp === 'CalendarProxy') {
          expandedOrder.push('CalendarAddBtn')
        }
      }
      customOrder = expandedOrder

      // 고정 컴포넌트 정의
      const fixedTop: ComponentType[] = ['bgm', 'MainSection', 'InviteName']
      const fixedBottom: ComponentType[] = ['KakaoShare']

      const customOrderSet = new Set(customOrder)
      const fixedSet = new Set([...fixedTop, ...fixedBottom])

      // customOrder에도 없고 고정 컴포넌트도 아닌 것들
      const remainingComponents = DEFAULT_COMPONENT_ORDER.filter(
        comp => !customOrderSet.has(comp) && !fixedSet.has(comp)
      )

      // 최종 순서: 고정 상단 + 사용자 지정 순서 + 나머지 + 고정 하단
      order = [
        ...fixedTop,
        ...customOrder,
        ...remainingComponents,
        ...fixedBottom,
      ]

      console.log('[WeddingPage] component_order (raw):', pageSettings.component_order)
      console.log('[WeddingPage] component_order (custom):', customOrder)
      console.log('[WeddingPage] component_order (remaining):', remainingComponents)
      console.log('[WeddingPage] component_order (merged):', order)
    } else {
      order = DEFAULT_COMPONENT_ORDER
    }

    // NameSection과 PhotoSectionProxy를 MainSection으로 통합
    const normalized: ComponentType[] = []
    let skipNextPhotoSection = false

    for (let i = 0; i < order.length; i++) {
      const current = order[i]

      if (skipNextPhotoSection && current === 'PhotoSectionProxy') {
        // 이전에 NameSection을 MainSection으로 변환했으므로 PhotoSectionProxy는 건너뛰기
        skipNextPhotoSection = false
        continue
      }

      if (current === 'NameSection') {
        // NameSection을 MainSection으로 대체
        normalized.push('MainSection' as ComponentType)
        // 다음 PhotoSectionProxy는 건너뛰기
        skipNextPhotoSection = true
      } else if (current === 'PhotoSectionProxy' && !skipNextPhotoSection) {
        // PhotoSectionProxy가 NameSection 없이 단독으로 나타나는 경우는 드물지만, MainSection으로 대체
        normalized.push('MainSection' as ComponentType)
      } else {
        normalized.push(current)
        skipNextPhotoSection = false
      }
    }

    console.log('[WeddingPage] component_order (final normalized):', normalized)
    return normalized
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pageSettings.component_order)])

  // 동적 배경색 관리
  const [componentBackgrounds, setComponentBackgrounds] = useState<Record<string, BackgroundColor>>({})

  // 갤러리 타입 추적 (안정적인 값으로 최적화)
  const galleryType = (pageSettings.gallery_type as 'slide' | 'thumbnail' | undefined) || 'thumbnail'

  // componentOrder 또는 galleryType 변경 시 배경색 재계산
  useEffect(() => {
    if (componentOrder.length > 0) {
      const backgrounds = assignBackgroundColors(componentOrder, galleryType)
      const finalBackgrounds = postProcessGalleryColors(componentOrder, backgrounds, galleryType)
      setComponentBackgrounds(finalBackgrounds)
      console.log('[WeddingPage] 배경색 할당 완료:', finalBackgrounds)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentOrder.join(','), galleryType])

  // 컴포넌트 렌더링 함수 (메모이제이션으로 불필요한 재생성 방지)
  const renderComponent = useCallback((type: ComponentType, index: number) => {
    // 동적 배경색 가져오기
    const backgroundColor = componentBackgrounds[type]
    // 배경색에 따른 버튼 색상 계산
    const buttonColor = backgroundColor ? getButtonColor(backgroundColor) : undefined

    // 디버깅: KakaoShare 렌더링 확인
    if (type === 'KakaoShare') {
      console.error('🔴 [WeddingPage] KakaoShare 렌더링 시작, pageId:', pageId)
    }
    switch (type) {
      // 연결된 컴포넌트
      case 'bgm':
        return (
          <BGM
            key={`${type}-${index}`}
            pageId={pageId}
          />
        )
      case 'MainSection':
        return (
          <MainSection
            key={`${type}-${index}`}
            pageId={pageId}
          />
        )
      case 'InviteName':
        return (
          <WeddingInvitationSection
            key={`${type}-${index}`}
            pageId={pageId}
            contactEnabled={pageSettings.contact !== 'off'}
          />
        )
      case 'CalendarProxy':
        return (
          <CalendarSection
            key={`${type}-${index}`}
            pageId={pageId}
            style={backgroundColor ? { backgroundColor } : undefined}
          />
        )
      case 'LocationUnified':
        return (
          <LocationUnified
            key={`${type}-${index}`}
            pageId={pageId}
            style={backgroundColor ? { width: '100%', backgroundColor } : { width: '100%' }}
          />
        )
      case 'UnifiedGalleryComplete':
        return (
          <UnifiedGalleryComplete
            key={`${type}-${index}`}
            pageId={pageId}
            style={backgroundColor ? { backgroundColor } : undefined}
          />
        )
      case 'CommentBoard':
        return (
          <CommentBoard
            key={`${type}-${index}`}
            pageId={pageId}
            backgroundColor={backgroundColor}
            buttonColor={buttonColor}
          />
        )
      case 'Account':
        return (
          <Account
            key={`${type}-${index}`}
            pageId={pageId}
            style={backgroundColor ? { backgroundColor } : undefined}
            buttonColor={buttonColor}
          />
        )
      case 'Info':
        return (
          <Info
            key={`${type}-${index}`}
            pageId={pageId}
            style={backgroundColor ? { backgroundColor } : undefined}
          />
        )
      case 'RSVPClient':
        return (
          <RSVPClient
            key={`${type}-${index}`}
            pageId={pageId}
            backgroundColor={backgroundColor}
          />
        )
      case 'KakaoShare':
        console.error('🔴 [WeddingPage] KakaoShare case 실행됨')
        return (
          <KakaoShare
            key={`${type}-${index}`}
            pageId={pageId}
            userUrl={pageSettings.user_url || ''}
            style={backgroundColor ? { backgroundColor } : undefined}
          />
        )

      // 아직 연결되지 않은 컴포넌트 - Placeholder로 표시
      case 'CalendarAddBtn':
      case 'rsvpResult':
      // 'KakaoShare'는 위에서 이미 처리되므로 여기서 제외
      // 'bgm'은 위에서 이미 처리되므로 여기서 제외
      case 'EternalDateVenue':
      case 'EternalMainPhoto':
      case 'EternalNameSection':
      case 'FioreDateVenue':
      case 'FioreNameSection':
      case 'P22TextComplete':
      case 'GoldenbookTextComplete':
      case 'PretendardBtnTxt':
        return (
          <PlaceholderComponent
            key={`${type}-${index}`}
            name={type}
            pageId={pageId}
          />
        )
      default:
        return null
    }
  }, [componentBackgrounds, pageId, pageSettings.user_url, pageSettings.contact])

  // 개발 모드에서 URL 쿼리 파라미터로 type 오버라이드 (클라이언트 사이드에서만)
  const [devTypeOverride, setDevTypeOverride] = useState<'papillon' | 'eternal' | 'fiore' | 'mobile' | null>(null)
  
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
      return
    }
    try {
      const params = new URLSearchParams(window.location.search)
      const overrideType = params.get('type')
      if (overrideType === 'papillon' || overrideType === 'eternal' || overrideType === 'fiore' || overrideType === 'mobile') {
        console.log('[WeddingPage] 개발 모드: type 오버라이드:', overrideType)
        setDevTypeOverride(overrideType)
      }
    } catch (error) {
      console.warn('[WeddingPage] 쿼리 파라미터 읽기 실패:', error)
    }
  }, [])

  // pageSettings의 type 확인 (papillon일 때만 mobileCover 표시)
  const pageType = devTypeOverride || pageSettings.type || 'papillon'
  const shouldShowMobileCover = pageType === 'papillon'

  return (
    <div className="mcard-container" style={{ position: 'relative' }}>
      {/* 모바일 커버 오버레이 (papillon 타입일 때만 표시) */}
      {shouldShowMobileCover && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            width: '100%',
            height: '1600px',
            pointerEvents: 'none',
          }}
        >
          <MobileCoverAnimation width={430} height={1600} />
        </div>
      )}

      {/* 컴포넌트들을 순서대로 렌더링 */}
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {componentOrder.map((type, index) => renderComponent(type, index))}
      </main>

      {/* 푸터 */}
      <footer style={{
        width: '100%',
        padding: '40px 30px',
        textAlign: 'center',
        background: componentBackgrounds['KakaoShare'] || '#F5F5F5',
      }}>
        <div style={{ marginBottom: '10px', opacity: 0.3 }}>
          <Image
            src="https://cdn.roarc.kr/framer/logo/roarc_logotype.svg"
            alt="roarc"
            width={60}
            height={10}
            loading="lazy"
            style={{ width: 'auto', height: '10px' }}
          />
        </div>
        <div style={FOOTER_TEXT_STYLE}>
          © roarc. all rights reseved.
        </div>
      </footer>
    </div>
  )
}

