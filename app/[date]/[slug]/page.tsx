import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getPageSettingsByPageId,
  PageSettings,
  parseDateSegmentToIso,
} from '@/lib/supabase'
import WeddingPage from '@/components/WeddingPage'

interface PageProps {
  params: Promise<{ date: string; slug: string }> | { date: string; slug: string } // slug는 실제로 pageId
}

/**
 * 동적 메타데이터 생성
 * - SEO 및 카카오톡 공유 시 미리보기에 사용
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Next.js 15+에서는 params가 Promise일 수 있음
  const resolvedParams = await Promise.resolve(params)
  const { slug } = resolvedParams // slug는 pageId

  // pageId로만 조회
  const pageSettings = await getPageSettingsByPageId(slug)

  if (!pageSettings) {
    return {
      title: 'roarc mobile card',
      description: 'We make Romantic Art Creations',
    }
  }

  // page_settings 테이블의 kko_title과 kko_date 사용
  const title = pageSettings.kko_title?.trim() || 'roarc mobile card'
  const description = pageSettings.kko_date?.trim() || 'We make Romantic Art Creations'

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
 * URL: /[date]/[pageId]
 * - date: YYMMDD 형식 (예: 251011)
 * - pageId: page_settings 테이블의 page_id
 * - 단순히 pageId로 조회하여 페이지 렌더링 (redirect 없음)
 */
export default async function Page({ params }: PageProps) {
  // Next.js 15+에서는 params가 Promise일 수 있음
  const resolvedParams = await Promise.resolve(params)
  const { date, slug } = resolvedParams // slug는 실제로 pageId

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

  // 날짜 형식 검증 (선택적 - 유효하지 않아도 계속 진행)
  const isoFromSegment = parseDateSegmentToIso(date)
  console.log('[app/[date]/[slug]] Date parsed:', isoFromSegment)

  // pageId로만 조회 (단순화)
  const pageSettings: PageSettings | null = await getPageSettingsByPageId(slug)

  console.log('[app/[date]/[slug]] Page settings result:', { 
    found: !!pageSettings, 
    pageId: pageSettings?.page_id 
  })

  if (!pageSettings) {
    console.log('[app/[date]/[slug]] Page settings not found, calling notFound()')
    notFound()
  }

  console.log('[app/[date]/[slug]] Rendering WeddingPage')
  // redirect 로직 제거 - 단순히 페이지 렌더링만 수행
  return <WeddingPage pageSettings={pageSettings} />
}
