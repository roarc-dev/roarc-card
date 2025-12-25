'use client'

import { notFound, redirect, useParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import {
  formatWeddingDateToSegment,
  getPageSettingsByPageId,
  getPageSettingsByUserUrl,
  PageSettings,
  parseDateSegmentToIso,
} from '@/lib/supabase'
import WeddingPage from '@/components/WeddingPage'

interface PageProps {
  params: { date: string; userurl: string }
}

export default function Page() {
  const params = useParams()
  const { date, userurl } = params as { date: string; userurl: string }

  const [pageSettings, setPageSettings] = useState<PageSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPageSettings() {
      if (!userurl || userurl.length < 1) {
        notFound()
        return
      }
      if (!date || date.length < 1) {
        notFound()
        return
      }

      const isoFromSegment = parseDateSegmentToIso(date)
      if (!isoFromSegment) {
        notFound()
        return
      }

      try {
        // 1) date+userurl 우선
        let settings: PageSettings | null = await getPageSettingsByUserUrl(userurl, date)

        // 2) 폴백: userurl이 사실 page_id인 레거시 링크
        if (!settings) {
          settings = await getPageSettingsByPageId(userurl)
          if (!settings) {
            notFound()
            return
          }

          // user_url이 있으면 canonical로 리다이렉트
          if (settings.user_url) {
            redirect(`/${encodeURIComponent(date)}/${encodeURIComponent(settings.user_url)}`)
            return
          }
        }

        const expectedSegment = settings.wedding_date
          ? formatWeddingDateToSegment(settings.wedding_date)
          : null

        if (expectedSegment && expectedSegment !== date) {
          redirect(`/${expectedSegment}/${encodeURIComponent(userurl)}`)
          return
        }

        setPageSettings(settings)
      } catch (err) {
        console.error('Failed to load page settings:', err)
        setError('페이지를 불러올 수 없습니다')
      } finally {
        setLoading(false)
      }
    }

    loadPageSettings()
  }, [date, userurl])

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>로딩 중...</div>
  }

  if (error || !pageSettings) {
    notFound()
    return null
  }

  return <WeddingPage pageSettings={pageSettings} />
}


