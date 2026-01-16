import useSWR from 'swr'
import { PROXY_BASE_URL, PageSettings } from '@/lib/supabase'
import { fetcher } from '@/lib/swr-config'

/**
 * SWR을 사용하여 pageSettings를 가져오는 공통 훅
 * - 자동 중복 제거 (5초)
 * - 자동 캐싱
 * - 에러 재시도
 */
export function usePageSettings(pageId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean
    data: PageSettings
  }>(
    pageId ? `${PROXY_BASE_URL}/api/page-settings?pageId=${pageId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000,
    }
  )

  return {
    pageSettings: data?.success ? data.data : null,
    isLoading,
    isError: error,
    mutate, // 데이터 갱신용
  }
}

/**
 * 계좌 정보를 가져오는 SWR 훅
 */
export function useAccountInfo(pageId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean
    data: any
  }>(
    pageId
      ? `${PROXY_BASE_URL}/api/contacts?action=getByPageId&pageId=${pageId}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  return {
    accountInfo: data?.success ? data.data : null,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * 위치 정보를 가져오는 SWR 훅
 */
export function useLocationInfo(pageId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean
    data: any
  }>(
    pageId
      ? `${PROXY_BASE_URL}/api/locations?action=getByPageId&pageId=${pageId}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  return {
    locationInfo: data?.success ? data.data : null,
    isLoading,
    isError: error,
    mutate,
  }
}
