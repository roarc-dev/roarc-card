import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPageSettingsByUserUrl, getPageSettingsByPageId, PageSettings } from '@/lib/supabase'
import WeddingPage from '@/components/WeddingPage'

interface PageProps {
  params: { slug: string[] }
}

/**
 * 동적 메타데이터 생성
 * - SEO 및 카카오톡 공유 시 미리보기에 사용
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slugArray = params.slug || []
  
  // 날짜 형식이 포함된 경로는 app/[date]/[slug]/page.tsx에서 처리되어야 함
  if (slugArray.length >= 2 && /^\d{6}$/.test(slugArray[0])) {
    // 날짜 형식이 포함된 경로는 여기서 처리하지 않음
    return {
      title: 'roarc mobile card',
      description: 'We make Romantic Art Creations',
    }
  }
  
  // 단일 slug만 처리
  const slug = slugArray[0] || ''

  // 로컬 개발 환경에서 "taehohoho"는 더미 데이터를 사용
  if (process.env.NODE_ENV === 'development' && slug === 'taehohoho') {
    const dummyPageSettings: PageSettings = {
      id: 'dummy-dev-id',
      page_id: 'taehohoho',
      user_url: 'taehohoho',
      groom_name: 'Taeho',
      bride_name: 'boreum',
      wedding_date: '2025-12-14',
      wedding_time: '14:00',
      venue_name: 'roarc wedding',
      venue_address: '서울특별시 강남구',
      component_order: [
        'bgm',
        'NameSection',
        'PhotoSectionProxy',
        'InviteName',
        'CalendarProxy',
        'LocationUnified',
        'CommentBoard',
        'Account',
        'Info',
        'RSVPClient',
        'KakaoShare'
      ]
    }

    const groomName = dummyPageSettings.groom_name || dummyPageSettings.groom_name_en || ''
    const brideName = dummyPageSettings.bride_name || dummyPageSettings.bride_name_en || ''
    const title = groomName && brideName
      ? `${groomName} ♥ ${brideName} 결혼합니다`
      : 'roarc mobile card'

    const description = dummyPageSettings.venue_name
      ? `${dummyPageSettings.wedding_date || ''} ${dummyPageSettings.venue_name}`
      : 'We make Romantic Art Creations'

    const image = dummyPageSettings.main_photo_url || 'https://cdn.roarc.kr/data/roarc_SEO_basic.jpg'

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [image],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    }
  }

  // user_url로 먼저 조회, 없으면 page_id로 조회
  let pageSettings = await getPageSettingsByUserUrl(slug)
  if (!pageSettings) {
    pageSettings = await getPageSettingsByPageId(slug)
  }
  
  if (!pageSettings) {
    return {
      title: 'roarc mobile card',
      description: 'We make Romantic Art Creations',
    }
  }

  const groomName = pageSettings.groom_name || pageSettings.groom_name_en || ''
  const brideName = pageSettings.bride_name || pageSettings.bride_name_en || ''
  const title = groomName && brideName 
    ? `${groomName} ♥ ${brideName} 결혼합니다`
    : 'roarc mobile card'
  
  const description = pageSettings.venue_name 
    ? `${pageSettings.wedding_date || ''} ${pageSettings.venue_name}`
    : 'We make Romantic Art Creations'
  
  const image = pageSettings.main_photo_url || 'https://cdn.roarc.kr/data/roarc_SEO_basic.jpg'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

/**
 * 동적 라우팅 페이지
 * 
 * URL: /[...slug]
 * - 단일 slug만 처리: ['slug'] 형식
 * - 날짜가 포함된 경로(/YYMMDD/slug)는 app/[date]/[slug]/page.tsx에서 처리됨
 * - slug는 user_url (사용자 지정 URL) 또는 page_id (UUID)
 * - user_url을 먼저 조회하고, 없으면 page_id로 조회
 */
export default async function Page({ params }: PageProps) {
  const slugArray = params.slug || []
  
  // 디버깅 로그
  console.log('[app/[...slug]] Processing:', { slugArray })
  
  // 날짜 형식이 포함된 경로는 app/[date]/[slug]/page.tsx에서 처리되어야 함
  // 여기서는 단일 slug만 처리
  if (slugArray.length >= 2 && /^\d{6}$/.test(slugArray[0])) {
    // 날짜 형식이 포함된 경로는 여기서 처리하지 않음 (app/[date]/[slug]로 위임)
    console.log('[app/[...slug]] Date format detected, delegating to app/[date]/[slug]')
    notFound()
  }
  
  // 단일 slug만 처리
  const slug = slugArray[0] || ''

  // 유효성 검사
  if (!slug || slug.length < 1) {
    notFound()
  }

  // 로컬 개발 환경에서 "taehohoho"는 더미 데이터를 사용
  if (process.env.NODE_ENV === 'development' && slug === 'taehohoho') {
    const dummyPageSettings: PageSettings = {
      id: 'dummy-dev-id',
      page_id: 'taehohoho',
      user_url: 'taehohoho',
      groom_name: 'Taeho',
      bride_name: 'boreum',
      wedding_date: '2025-12-14',
      wedding_time: '14:00',
      venue_name: 'roarc wedding',
      venue_address: '서울특별시 강남구',
      component_order: [
        'bgm',
        'NameSection',
        'PhotoSectionProxy',
        'InviteName',
        'CalendarProxy',
        'LocationUnified',
        'CommentBoard',
        'Account',
        'Info',
        'RSVPClient',
        'KakaoShare'
      ]
    }
    return <WeddingPage pageSettings={dummyPageSettings} />
  }

  // 페이지 설정 조회
  // 1. user_url로 먼저 시도 (사용자 친화적 URL)
  let pageSettings: PageSettings | null = await getPageSettingsByUserUrl(slug)

  // 2. user_url로 찾지 못하면 page_id로 시도 (UUID)
  if (!pageSettings) {
    pageSettings = await getPageSettingsByPageId(slug)
  }

  // 페이지를 찾지 못한 경우
  if (!pageSettings) {
    notFound()
  }

  return <WeddingPage pageSettings={pageSettings} />
}

