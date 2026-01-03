'use client'

import React, { useEffect, useState } from 'react'
import { PROXY_BASE_URL } from '@/lib/supabase'
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

export default function MainSection(props: MainSectionProps) {
  const { pageId, style } = props
  const [pageType, setPageType] = useState<'papillon' | 'eternal' | 'fiore' | 'mobile' | null>(null)
  const [pageSettings, setPageSettings] = useState<PageSettings | null>(null)

  // 페이지 설정 로드 및 type 조회
  useEffect(() => {
    let mounted = true
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
        // type이 없으면 기본값 'papillon' 사용
        setPageType(data.type || 'papillon')
      } else {
        // 데이터가 없으면 기본값 'papillon' 사용
        setPageType('papillon')
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [pageId])

  // type에 따라 적절한 컴포넌트 렌더링
  if (!pageType) {
    // 로딩 중이거나 pageId가 없는 경우 기본 papillon 렌더링
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
      return (
        <div style={style}>
          <EternalNameSection
            groomName={pageSettings?.groom_name_en}
            brideName={pageSettings?.bride_name_en}
            pageId={pageId}
            style={{ width: '100%', maxWidth: '439px' }}
          />
          <EternalMainPhoto pageId={pageId} />
          <EternalDateVenue pageId={pageId} />
        </div>
      )

    case 'fiore':
      return (
        <div style={style}>
          <FioreNameSection
            pageId={pageId}
            style={{ width: '100%', maxWidth: '439px' }}
          />
          <EternalMainPhoto pageId={pageId} />
          <FioreDateVenue pageId={pageId} />
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

