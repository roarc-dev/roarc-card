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
  const { slug } = resolvedParams // slug는 user_url 또는 page_id

  // user_url 우선 조회, 없으면 page_id로 폴백
  const pageSettings = await getPageSettingsByUserUrl(slug) 
    || await getPageSettingsByPageId(slug)

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

  // 날짜 형식 검증 (선택적 - 유효하지 않아도 계속 진행)
  const isoFromSegment = parseDateSegmentToIso(date)
  console.log('[app/[date]/[slug]] Date parsed:', isoFromSegment)

  // user_url 우선 조회, 없으면 page_id로 폴백
  let pageSettings: PageSettings | null = await getPageSettingsByUserUrl(slug)
  if (!pageSettings) {
    console.log('[app/[date]/[slug]] Not found by user_url, trying page_id')
    pageSettings = await getPageSettingsByPageId(slug)
  }

  console.log('[app/[date]/[slug]] Page settings result:', { 
    found: !!pageSettings, 
    pageId: pageSettings?.page_id,
    userUrl: pageSettings?.user_url
  })

  if (!pageSettings) {
    console.log('[app/[date]/[slug]] Page settings not found, calling notFound()')
    notFound()
  }

  console.log('[app/[date]/[slug]] Rendering WeddingPage')
  // redirect 로직 제거 - 단순히 페이지 렌더링만 수행
  return <WeddingPage pageSettings={pageSettings} />
}
