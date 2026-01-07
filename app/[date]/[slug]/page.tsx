import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getPageSettingsByPageId,
  getPageSettingsByUserUrl,
  PageSettings,
  parseDateSegmentToIso,
} from '@/lib/supabase'
import WeddingPage from '@/components/WeddingPage'

interface PageProps {
  params: Promise<{ date: string; slug: string }> | { date: string; slug: string } // slug는 user_url 또는 page_id
}

/**
 * 동적 메타데이터 생성
 * - SEO 및 카카오톡 공유 시 미리보기에 사용
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Next.js 15+에서는 params가 Promise일 수 있음
  const resolvedParams = await Promise.resolve(params)
  const { date, slug } = resolvedParams // slug는 user_url 또는 page_id

  // 날짜 형식 검증
  const isoFromSegment = parseDateSegmentToIso(date || '')
  if (!isoFromSegment) {
    return {
      title: 'roarc mobile card',
      description: 'We make Romantic Art Creations',
    }
  }

  // user_url 우선 조회 (date 파라미터 포함하여 wedding_date 검증)
  let pageSettings = await getPageSettingsByUserUrl(slug, date)
  
  // user_url로 조회 성공했지만 실제 DB의 user_url과 일치하지 않으면 기본 메타데이터 반환
  if (pageSettings && pageSettings.user_url && pageSettings.user_url !== slug) {
    return {
      title: 'roarc mobile card',
      description: 'We make Romantic Art Creations',
    }
  }
  
  // user_url 조회 실패 시에만 page_id로 폴백
  if (!pageSettings) {
    pageSettings = await getPageSettingsByPageId(slug)
    
    // page_id로 조회한 경우에도 wedding_date 검증
    if (pageSettings && pageSettings.wedding_date) {
      const actualIso = pageSettings.wedding_date.trim()
      if (isoFromSegment !== actualIso) {
        return {
          title: 'roarc mobile card',
          description: 'We make Romantic Art Creations',
        }
      }
    }
  }

  if (!pageSettings) {
    return {
      title: 'roarc mobile card',
      description: 'We make Romantic Art Creations',
    }
  }

  // page_settings 테이블의 kko_title과 kko_date 사용
  const title = pageSettings.kko_title?.trim() || 'roarc mobile card'
  const description = pageSettings.kko_date?.trim() || 'We make Romantic Art Creations'

  // tag_image 우선 사용, 없으면 main_photo_url, 둘 다 없으면 기본 이미지
  const image = pageSettings.tag_image || pageSettings.main_photo_url || 'https://cdn.roarc.kr/data/roarc_SEO_basic.jpg'

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
 * URL: /[date]/[slug]
 * - date: YYMMDD 형식 (예: 251011)
 * - slug: page_settings 테이블의 user_url 또는 page_id
 * - user_url 우선 조회, 없으면 page_id로 폴백
 */
export default async function Page({ params }: PageProps) {
  // Next.js 15+에서는 params가 Promise일 수 있음
  const resolvedParams = await Promise.resolve(params)
  const { date, slug } = resolvedParams // slug는 user_url 또는 page_id

  console.log('[app/[date]/[slug]] Page called with:', { date, slug, rawParams: params })

  // 유효성 검사
  if (!slug || slug.length < 1) {
    console.log('[app/[date]/[slug]] Invalid slug')
    notFound()
  }
  if (!date || date.length < 1) {
    console.log('[app/[date]/[slug]] Invalid date')
    notFound()
  }

  // 날짜 형식 검증
  const isoFromSegment = parseDateSegmentToIso(date)
  if (!isoFromSegment) {
    console.log('[app/[date]/[slug]] Invalid date format:', date)
    notFound()
  }
  console.log('[app/[date]/[slug]] Date parsed:', isoFromSegment)

  // user_url 우선 조회 (date 파라미터 포함하여 wedding_date 검증)
  let pageSettings: PageSettings | null = await getPageSettingsByUserUrl(slug, date)
  
  // user_url로 조회 성공했지만 실제 DB의 user_url과 일치하지 않으면 notFound
  // (이전 user_url로 접근하는 것을 방지)
  if (pageSettings && pageSettings.user_url && pageSettings.user_url !== slug) {
    console.log('[app/[date]/[slug]] user_url mismatch - requested slug does not match DB user_url:', {
      requested: slug,
      actual: pageSettings.user_url,
    })
    notFound()
  }
  
  // user_url 조회 실패 시에만 page_id로 폴백
  if (!pageSettings) {
    console.log('[app/[date]/[slug]] Not found by user_url, trying page_id')
    pageSettings = await getPageSettingsByPageId(slug)
    
    // page_id로 조회한 경우에도 wedding_date 검증
    if (pageSettings && pageSettings.wedding_date) {
      const actualIso = pageSettings.wedding_date.trim()
      if (isoFromSegment !== actualIso) {
        console.log('[app/[date]/[slug]] wedding_date mismatch (page_id lookup):', {
          requested: isoFromSegment,
          actual: actualIso,
          dateSegment: date,
        })
        notFound()
      }
    }
  }

  console.log('[app/[date]/[slug]] Page settings result:', { 
    found: !!pageSettings, 
    pageId: pageSettings?.page_id,
    userUrl: pageSettings?.user_url,
    requestedSlug: slug,
  })

  if (!pageSettings) {
    console.log('[app/[date]/[slug]] Page settings not found, calling notFound()')
    notFound()
  }
  
  // page_id로 조회한 경우, 실제 user_url이 있으면 해당 URL로 리다이렉트해야 함
  // 하지만 현재는 page_id로도 접근 가능하도록 허용 (하위 호환)
  // 향후 user_url만 허용하려면 아래 주석을 해제
  /*
  if (pageSettings.user_url && pageSettings.user_url !== slug) {
    // 실제 user_url이 있으면 해당 URL로 리다이렉트
    const formattedDate = formatWeddingDateToSegment(pageSettings.wedding_date || '')
    if (formattedDate) {
      redirect(`/${formattedDate}/${pageSettings.user_url}`)
    }
  }
  */

  console.log('[app/[date]/[slug]] Rendering WeddingPage')
  // redirect 로직 제거 - 단순히 페이지 렌더링만 수행
  return <WeddingPage pageSettings={pageSettings} />
}
