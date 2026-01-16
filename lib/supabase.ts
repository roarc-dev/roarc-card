import { cache } from 'react'

// 프록시 서버 URL (기존 API와 연동) - Supabase 직접 연결 대신 PROXY 사용
// 서버와 클라이언트 모두에서 접근 가능하도록 next.config.js의 env 설정 사용
const defaultUrl = 'https://wedding-admin-proxy.vercel.app'

// 환경 변수 확인 (서버와 클라이언트 모두)
const envProxyUrl = 
  process.env.NEXT_PUBLIC_PROXY_URL || 
  process.env.PROXY_URL || 
  defaultUrl

// URL 유효성 검증 및 정규화
let PROXY_BASE_URL = envProxyUrl.trim()
if (!PROXY_BASE_URL.startsWith('http://') && !PROXY_BASE_URL.startsWith('https://')) {
  console.warn('[supabase.ts] Invalid PROXY_BASE_URL format, using default:', PROXY_BASE_URL)
  PROXY_BASE_URL = defaultUrl
}

// 마지막 슬래시 제거
PROXY_BASE_URL = PROXY_BASE_URL.replace(/\/$/, '')

export { PROXY_BASE_URL }

// 디버깅 로그 (서버와 클라이언트 모두)
console.log('[supabase.ts] PROXY_BASE_URL:', PROXY_BASE_URL)
console.log('[supabase.ts] NEXT_PUBLIC_PROXY_URL:', process.env.NEXT_PUBLIC_PROXY_URL || 'NOT SET')
console.log('[supabase.ts] PROXY_URL:', process.env.PROXY_URL || 'NOT SET')

/**
 * 페이지 설정 데이터 타입
 */
export interface PageSettings {
  id: string
  page_id: string
  // NOTE: proxy(`wedding-admin-proxy`) 기준으로는 user_url이 없거나 userUrl 조회가 지원되지 않을 수 있어 optional 처리
  user_url?: string
  groom_name?: string
  bride_name?: string
  groom_name_en?: string
  bride_name_en?: string
  wedding_date?: string
  wedding_time?: string
  venue_name?: string
  venue_address?: string
  venue_lat?: number
  venue_lng?: number
  main_photo_url?: string
  tag_image?: string // OG 태그 이미지 (링크 공유 썸네일)
  component_order?: string[] // 컴포넌트 순서 배열
  contact?: string // 연락처 섹션 on/off ('on' | 'off')
  theme?: string
  type?: 'papillon' | 'eternal' | 'fiore' | 'mobile' // 페이지 타입
  gallery_type?: 'slide' | 'thumbnail' // 갤러리 타입
  kko_title?: string // 카카오톡 공유 제목
  kko_date?: string // 카카오톡 공유 날짜
  account_text?: string // 계좌 안내 문구
  created_at?: string
  updated_at?: string
}

/**
 * user_url로 페이지 설정 조회
 *
 * - user_url과 wedding_date가 모두 일치해야만 조회 성공
 * - 보안: dateSegment 필수 (같은 user_url을 가진 다른 사용자의 페이지 접근 방지)
 * - React.cache()로 감싸져 동일 요청 렌더링 중 자동 중복 제거
 *
 * @param userUrl - user_url 또는 page_id
 * @param dateSegment - YYMMDD 형식의 날짜 세그먼트 (필수, wedding_date 검증에 사용)
 */
export const getPageSettingsByUserUrl = cache(async function(
  userUrl: string,
  dateSegment: string
): Promise<PageSettings | null> {
  const normalized = userUrl?.trim()
  if (!normalized) return null
  
  // dateSegment 필수 검증
  const normalizedDate = dateSegment?.trim()
  if (!normalizedDate) {
    console.warn('[getPageSettingsByUserUrl] dateSegment is required')
    return null
  }
  
  // dateSegment 형식 검증 (YYMMDD: 6자리 숫자)
  if (!/^\d{6}$/.test(normalizedDate)) {
    console.warn('[getPageSettingsByUserUrl] Invalid dateSegment format:', normalizedDate)
    return null
  }
  
  try {
    // dateSegment를 쿼리 파라미터에 포함 (API에서 필수로 요구)
    const response = await fetch(
      `${PROXY_BASE_URL}/api/page-settings?userUrl=${encodeURIComponent(normalized)}&date=${encodeURIComponent(normalizedDate)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // user_url 변경 시 즉시 반영되도록 캐시 비활성화
        next: { revalidate: 0 },
      }
    )
    if (!response.ok) {
      // userUrl 지원이 없을 수 있으므로 null 반환 (호출자가 pageId로 폴백)
      return null
    }
    const result = await response.json()
    if (result.success && result.data) {
      const pageSettings = result.data as PageSettings
      // 조회된 user_url과 요청한 userUrl이 일치하는지 확인
      // 이전 user_url로 접근하는 것을 방지
      if (pageSettings.user_url && pageSettings.user_url !== normalized) {
        console.log('[getPageSettingsByUserUrl] user_url mismatch:', {
          requested: normalized,
          actual: pageSettings.user_url,
        })
        return null
      }
      
      // 조회된 wedding_date와 일치하는지 검증 (이중 안전장치)
      if (pageSettings.wedding_date) {
        const requestedIso = parseDateSegmentToIso(normalizedDate)
        const actualIso = pageSettings.wedding_date.trim()
        
        if (requestedIso && requestedIso !== actualIso) {
          console.log('[getPageSettingsByUserUrl] wedding_date mismatch:', {
            requested: requestedIso,
            actual: actualIso,
            dateSegment: normalizedDate,
          })
          return null
        }
      }
      
      return pageSettings
    }
    return null
  } catch (error) {
    console.error('[getPageSettingsByUserUrl] Error:', error)
    return null
  }
})

/**
 * page_id로 페이지 설정 조회
 * - React.cache()로 감싸져 동일 요청 렌더링 중 자동 중복 제거
 */
export const getPageSettingsByPageId = cache(async function(pageId: string): Promise<PageSettings | null> {
  const url = `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`
  
  // 디버깅 로그
  console.log('[getPageSettingsByPageId] Requesting:', { pageId, url, proxyBaseUrl: PROXY_BASE_URL })
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 },
    })

    console.log('[getPageSettingsByPageId] Response status:', response.status)

    if (!response.ok) {
      console.error(`[getPageSettingsByPageId] HTTP ${response.status} for pageId: ${pageId}`)
      const text = await response.text()
      console.error('[getPageSettingsByPageId] Response body:', text.substring(0, 200))
      return null
    }

    const result = await response.json()
    console.log('[getPageSettingsByPageId] Response data:', { 
      success: result.success, 
      hasData: !!result.data,
      pageId: result.data?.page_id 
    })
    
    if (result.success && result.data) {
      return result.data as PageSettings
    }
    
    console.log('[getPageSettingsByPageId] No data in response:', result)
    return null
  } catch (error) {
    console.error('[getPageSettingsByPageId] Error:', error)
    if (error instanceof Error) {
      console.error('[getPageSettingsByPageId] Error message:', error.message)
      console.error('[getPageSettingsByPageId] Error stack:', error.stack)
    }
    return null
  }
})

/**
 * wedding_date("YYYY-MM-DD") -> "YYMMDD" (예: "2026-12-21" => "261221")
 */
export function formatWeddingDateToSegment(isoDate: string): string | null {
  if (!isoDate) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim())
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const yy = String(year % 100).padStart(2, '0')
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${yy}${mm}${dd}`
}

/**
 * "YYMMDD" -> "YYYY-MM-DD"
 * - "261221" => "2026-12-21"
 */
export function parseDateSegmentToIso(dateSegment: string): string | null {
  const raw = dateSegment.trim()
  if (!/^\d{6}$/.test(raw)) return null
  const yy = Number(raw.slice(0, 2))
  const mm = Number(raw.slice(2, 4))
  const dd = Number(raw.slice(4, 6))
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null
  const yyyy = 2000 + yy
  const date = new Date(yyyy, mm - 1, dd)
  // 유효하지 않은 날짜(예: 02/31) 방지
  if (date.getFullYear() !== yyyy || date.getMonth() !== mm - 1 || date.getDate() !== dd) {
    return null
  }
  return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
}




