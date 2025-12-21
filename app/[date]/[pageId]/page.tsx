import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import {
  formatWeddingDateToSegment,
  getPageSettingsByPageId,
  PageSettings,
  parseDateSegmentToIso,
} from '@/lib/supabase'
import WeddingPage from '@/components/WeddingPage'

interface PageProps {
  params: { date: string; pageId: string }
}

/**
 * 동적 메타데이터 생성
 * - SEO 및 카카오톡 공유 시 미리보기에 사용
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pageId } = params

  // page_id로 조회 (proxy 기준)
  const pageSettings = await getPageSettingsByPageId(pageId)

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
 * URL: /[YYMMDD]/[pageId]
 * - 예: /261221/minjunseoyun
 * - pageId는 page_settings.page_id에 매칭되는 값
 * - date 세그먼트는 wedding_date(YYYY-MM-DD)에서 파생된 YYMMDD와 일치해야 함 (불일치 시 canonical로 redirect)
 */
export default async function Page({ params }: PageProps) {
  const { date, pageId } = params

  if (!pageId || pageId.length < 1) notFound()
  if (!date || date.length < 1) notFound()

  const isoFromSegment = parseDateSegmentToIso(date)
  if (!isoFromSegment) notFound()

  const pageSettings: PageSettings | null = await getPageSettingsByPageId(pageId)
  if (!pageSettings) notFound()

  // 신규 canonical: /YYMMDD/userurl
  // - page_settings 응답에 user_url이 있으면 새 경로로 정규화
  if (pageSettings.user_url) {
    redirect(`/${date}/${encodeURIComponent(pageSettings.user_url)}`)
  }

  // wedding_date가 있으면 date 세그먼트와 일치 검증 (불일치 시 canonical URL로 정규화)
  const expectedSegment = pageSettings.wedding_date
    ? formatWeddingDateToSegment(pageSettings.wedding_date)
    : null

  if (expectedSegment && expectedSegment !== date) {
    redirect(`/${expectedSegment}/${pageId}`)
  }

  // wedding_date가 없더라도, URL date는 유효한 날짜로만 허용 (위에서 검증)
  // isoFromSegment는 현재 로직상 직접 사용되진 않지만, 잘못된 날짜(예: 991332)를 차단하는 역할을 함
  void isoFromSegment

  return <WeddingPage pageSettings={pageSettings} />
}


