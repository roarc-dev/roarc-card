/**
 * SWR 전역 설정
 * - 자동 요청 중복 제거
 * - 캐싱 및 재검증 설정
 */

import { SWRConfiguration } from 'swr'

export const swrConfig: SWRConfiguration = {
  // 포커스 시 자동 재검증 비활성화 (모바일 카드는 불필요)
  revalidateOnFocus: false,

  // 재연결 시 자동 재검증 비활성화
  revalidateOnReconnect: false,

  // 중복 요청 제거 간격 (5초)
  // 동일한 키로 5초 이내 재요청 시 자동 중복 제거
  dedupingInterval: 5000,

  // 에러 재시도 횟수
  errorRetryCount: 3,

  // 에러 재시도 간격 (5초)
  errorRetryInterval: 5000,

  // 로딩 중 이전 데이터 유지
  keepPreviousData: true,
}

/**
 * 공통 fetcher 함수
 */
export const fetcher = async (url: string) => {
  const res = await fetch(url)

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    // @ts-ignore
    error.info = await res.json()
    // @ts-ignore
    error.status = res.status
    throw error
  }

  return res.json()
}
