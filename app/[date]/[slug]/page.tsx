import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import {
  formatWeddingDateToSegment,
  getPageSettingsByUserUrl,
  getPageSettingsByPageId,
  PageSettings,
  parseDateSegmentToIso,
} from '@/lib/supabase'
import WeddingPage from '@/components/WeddingPage'

interface PageProps {
  params: { date: string; slug: string }
}

/**
 * 동적 메타데이터 생성
 * - SEO 및 카카오톡 공유 시 미리보기에 사용
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params

  // user_url로 먼저 시도, 없으면 page_id로 시도
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
  const title = groomName && brideName ? `${groomName} ♥ ${brideName} 결혼합니다` : 'roarc mobile card'

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
 * URL: /[YYMMDD]/[slug]
 * - 예: /261221/minjunseoyun 또는 /261221/page-id-uuid
 * - slug는 user_url 또는 page_id 모두 가능
 * - date 세그먼트는 wedding_date(YYYY-MM-DD)에서 파생된 YYMMDD와 일치해야 함
 */
export default async function Page({ params }: PageProps) {
  const { date, slug } = params

  if (!slug || slug.length < 1) notFound()
  if (!date || date.length < 1) notFound()

  const isoFromSegment = parseDateSegmentToIso(date)
  if (!isoFromSegment) notFound()

  // user_url로 먼저 시도, 없으면 page_id로 시도
  let pageSettings: PageSettings | null = await getPageSettingsByUserUrl(slug)
  if (!pageSettings) {
    pageSettings = await getPageSettingsByPageId(slug)
  }

  if (!pageSettings) notFound()

  // user_url이 있고 현재 slug가 user_url이면 그대로 사용
  // user_url이 있지만 현재 slug가 page_id면 user_url로 redirect
  if (pageSettings.user_url && pageSettings.user_url !== slug) {
    redirect(`/${date}/${encodeURIComponent(pageSettings.user_url)}`)
  }

  // wedding_date가 있으면 date 세그먼트와 일치 검증 (불일치 시 canonical URL로 정규화)
  const expectedSegment = pageSettings.wedding_date
    ? formatWeddingDateToSegment(pageSettings.wedding_date)
    : null

  if (expectedSegment && expectedSegment !== date) {
    const redirectSlug = pageSettings.user_url || slug
    redirect(`/${expectedSegment}/${encodeURIComponent(redirectSlug)}`)
  }

  void isoFromSegment

  return <WeddingPage pageSettings={pageSettings} />
}
