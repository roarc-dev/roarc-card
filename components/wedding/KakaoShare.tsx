'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { PROXY_BASE_URL } from '@/lib/supabase'

const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js'
const KAKAO_APP_KEY =
    process.env.NEXT_PUBLIC_KAKAO_JS_KEY || 'db63a9b37174b5a425a21d797318dff8'

// Typography 폰트 스택 (typography.js에서 가져온 값들)
const FONT_STACKS = {
    pretendardVariable: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
    pretendard: 'Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
    p22: '"P22 Late November", "Pretendard", -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple SD Gothic Neo, Noto Sans KR, "Apple Color Emoji", "Segoe UI Emoji"',
    goldenbook: '"goldenbook", "Goldenbook", serif',
    sloopScriptPro: '"sloop-script-pro", "Sloop Script Pro", cursive, sans-serif',
}

interface PageSettings {
    page_url?: string
    groom_name_kr?: string
    bride_name_kr?: string
    kko_img?: string
    kko_title?: string
    kko_date?: string
    photo_section_image_url?: string
    wedding_date?: string
    wedding_hour?: string
    wedding_minute?: string
    kakao_template_id?: string | number
    template_id?: string | number
}

interface InviteData {
    groomName?: string
    brideName?: string
}

async function fetchPageSettings(pageId: string): Promise<PageSettings | null> {
    if (!pageId) return null
    try {
        const res = await fetch(
            `${PROXY_BASE_URL}/api/page-settings?pageId=${encodeURIComponent(pageId)}`
        )
        if (!res.ok) return null
        const json: unknown = await res.json()
        if (
            typeof json === 'object' &&
            json !== null &&
            'success' in json &&
            'data' in json
        ) {
            const typed = json as { success?: boolean; data?: PageSettings }
            if (typed?.success && typed?.data) return typed.data
        }
    } catch (error) {
        console.error('카카오 공유 설정 로딩 실패', error)
    }
    return null
}

async function fetchInviteData(pageId: string): Promise<InviteData | null> {
    if (!pageId) return null
    try {
        const res = await fetch(
            `${PROXY_BASE_URL}/api/invite?pageId=${encodeURIComponent(pageId)}`
        )
        if (!res.ok) return null
        const json: unknown = await res.json()
        if (
            typeof json === 'object' &&
            json !== null &&
            'success' in json &&
            'data' in json
        ) {
            const typed = json as {
                success?: boolean
                data?: { groom_name?: string; bride_name?: string }
            }
            if (typed?.success && typed?.data) {
                const data = typed.data
                return {
                    groomName: data.groom_name || '',
                    brideName: data.bride_name || '',
                }
            }
        }
    } catch (error) {
        console.error('초대장 데이터 로딩 실패', error)
    }
    return null
}

function formatWeddingDate(weddingDate?: string): string {
    if (!weddingDate) return ''
    try {
        // "2025-12-06" 형태를 "251206"으로 변환
        const date = new Date(weddingDate)
        const year = date.getFullYear().toString().slice(-2) // 마지막 2자리
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        return `${year}${month}${day}`
    } catch {
        return ''
    }
}

function formatWeddingDateTime(settings: PageSettings): string {
    const { wedding_date, wedding_hour, wedding_minute } = settings

    if (!wedding_date) return '결혼식 정보를 확인해 주세요'

    try {
        const date = new Date(wedding_date)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()

        // 요일 계산
        const dayNames = [
            '일요일',
            '월요일',
            '화요일',
            '수요일',
            '목요일',
            '금요일',
            '토요일',
        ]
        const dayOfWeek = dayNames[date.getDay()]

        // 시간 포맷팅 (12시간제)
        const hour = wedding_hour ? parseInt(wedding_hour) : null
        const minute = wedding_minute ? parseInt(wedding_minute) : null

        let timeText = ''
        if (hour !== null) {
            const period = hour >= 12 ? '오후' : '오전'
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
            timeText = `${period} ${displayHour}시`
            if (minute && minute > 0) {
                timeText += ` ${minute.toString().padStart(2, '0')}분`
            }
        }

        return `${year}년 ${month}월 ${day}일 ${dayOfWeek}${
            timeText ? ` ${timeText}` : ''
        }`.trim()
    } catch {
        return '결혼식 정보를 확인해 주세요'
    }
}

interface KakaoShareProps {
    pageId?: string
    userUrl?: string
    style?: React.CSSProperties
}

declare global {
    interface Window {
        Kakao?: {
            init: (key: string) => void
            isInitialized?: () => boolean
            Share?: {
                sendCustom: (options: {
                    templateId: number
                    templateArgs: Record<string, string>
                }) => void
            }
        }
    }
}

export default function KakaoShare(props: KakaoShareProps) {
    const { pageId = '', userUrl = '', style } = props

    // 즉시 로그 출력 (렌더링 시점 - 클라이언트 사이드에서만)
    if (typeof window !== 'undefined') {
        console.error('🔴 [KakaoShare] 컴포넌트 렌더링 시작 (클라이언트)')
        console.warn('🟡 [KakaoShare] props:', { pageId, userUrl })
    }

    const [settings, setSettings] = useState<PageSettings | null>(null)
    const [inviteData, setInviteData] = useState<InviteData | null>(null)
    const [kakaoReady, setKakaoReady] = useState(false)
    const [kakaoClient, setKakaoClient] = useState<Window['Kakao']>()

    // Typography 폰트 로딩 - 페이지 레벨에서 처리됨

    // 폰트 패밀리 설정 (typography.js에서 가져온 폰트 스택 사용)
    const pretendardFontFamily = FONT_STACKS.pretendardVariable

    // 컴포넌트 마운트 확인
    useEffect(() => {
        console.log('🔵 [KakaoShare] ===== useEffect 실행됨 =====')
        console.error('🔴 [KakaoShare] ERROR 레벨 - useEffect 실행')
        console.warn('🟡 [KakaoShare] WARN 레벨 - props:', { pageId, userUrl })
        console.log('[KakaoShare] window.Kakao 존재:', typeof window !== 'undefined' && !!(window as any).Kakao)
        if (typeof window !== 'undefined' && (window as any).Kakao) {
            const kakao = (window as any).Kakao
            console.log('[KakaoShare] Kakao 객체:', kakao)
            console.log('[KakaoShare] Kakao.isInitialized 함수:', typeof kakao.isInitialized)
            if (typeof kakao.isInitialized === 'function') {
                console.log('[KakaoShare] Kakao.isInitialized() 결과:', kakao.isInitialized())
            }
        }
    }, [])

    useEffect(() => {
        console.log('[KakaoShare] 데이터 로딩 시작, pageId:', pageId)
        if (!pageId) {
            console.warn('[KakaoShare] pageId가 없어서 데이터 로딩 중단')
            setSettings(null)
            setInviteData(null)
            return
        }
        let cancelled = false

        // page-settings 데이터 가져오기
        void fetchPageSettings(pageId).then((data) => {
            console.log('[KakaoShare] page-settings 로드 완료:', data ? '성공' : '실패', data)
            if (!cancelled) setSettings(data)
        }).catch((error) => {
            console.error('[KakaoShare] page-settings 로드 실패:', error)
        })

        // invite 데이터 가져오기
        void fetchInviteData(pageId).then((data) => {
            console.log('[KakaoShare] invite 데이터 로드 완료:', data ? '성공' : '실패', data)
            if (!cancelled) setInviteData(data)
        }).catch((error) => {
            console.error('[KakaoShare] invite 데이터 로드 실패:', error)
        })

        return () => {
            cancelled = true
        }
    }, [pageId])

    // 카카오 SDK 로드 및 초기화
    useEffect(() => {
        if (typeof window === 'undefined') return

        const prepareClient = () => {
            const kakao = window.Kakao
            if (!kakao) {
                console.log('[KakaoShare] window.Kakao 없음')
                return false
            }
            try {
                if (typeof kakao.isInitialized === 'function') {
                    if (!kakao.isInitialized()) {
                        kakao.init(KAKAO_APP_KEY)
                    }
                } else if (typeof kakao.init === 'function') {
                    kakao.init(KAKAO_APP_KEY)
                }
                if (!kakao.Share) {
                    console.warn('[KakaoShare] Kakao.Share 미탑재')
                    return false
                }
                setKakaoClient(kakao)
                setKakaoReady(true)
                return true
            } catch (error) {
                console.error('[KakaoShare] Kakao SDK 초기화 실패:', error)
                setKakaoReady(false)
                return false
            }
        }

        if (prepareClient()) {
            return
        }

        const scriptSelector = `script[src="${KAKAO_SDK_URL}"]`
        let script = document.querySelector<HTMLScriptElement>(scriptSelector)
        const handleLoad = () => {
            console.log('[KakaoShare] Kakao SDK 로드 완료, 초기화 재시도')
            prepareClient()
        }
        const handleError = (event: Event) => {
            console.error('[KakaoShare] Kakao SDK 로드 실패', event)
            setKakaoReady(false)
        }

        if (!script) {
            script = document.createElement('script')
            script.src = KAKAO_SDK_URL
            script.async = true
            script.crossOrigin = 'anonymous'
            script.integrity =
                'sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Hs90nka'
            document.head.appendChild(script)
        }

        script.addEventListener('load', handleLoad)
        script.addEventListener('error', handleError)

        return () => {
            script?.removeEventListener('load', handleLoad)
            script?.removeEventListener('error', handleError)
        }
    }, [])

    const templateArgs = useMemo(() => {
        console.log('[KakaoShare] templateArgs 계산 시작, settings:', settings)
        if (!settings) {
            console.log('[KakaoShare] templateArgs: settings가 없어서 null 반환')
            return null
        }

        // 신랑/신부 이름: inviteData 우선, 없으면 page_settings에서 가져옴
        const groomName =
            inviteData?.groomName?.trim() || settings.groom_name_kr?.trim() || ''
        const brideName =
            inviteData?.brideName?.trim() || settings.bride_name_kr?.trim() || ''

        // Admin.tsx에서 이미 포맷팅된 정보를 그대로 사용
        const customTitle =
            settings.kko_title?.trim() || `${groomName} ♥ ${brideName} 결혼합니다`

        const customBody =
            settings.kko_date?.trim() || formatWeddingDateTime(settings)

        // 이미지 URL: kko_img 우선, 없으면 메인 사진 사용
        // 주의: photo_section_image_url은 AVIF일 수 있어 카카오톡에서 미지원
        // AVIF URL 감지하여 경고 로그 출력
        let imageUrl = settings.kko_img?.trim() || ''
        if (!imageUrl && settings.photo_section_image_url) {
            const photoUrl = settings.photo_section_image_url
            if (photoUrl.includes('.avif') || photoUrl.includes('/avif')) {
                console.warn(
                    '[KakaoShare] 카카오톡 공유용 이미지를 별도로 업로드해주세요.'
                )
            }
            imageUrl = photoUrl
        }

        // 카카오 템플릿에서 ${REGI_WEB_DOMAIN}/${WEDDING_URL} 형태로 사용
        // REGI_WEB_DOMAIN: "https://mcard.roarc.kr/"
        // WEDDING_URL: 날짜/page_id 형태 (예: "251206/wedding-demo")
        const formattedDate = formatWeddingDate(settings.wedding_date)
        const publicSlug = (userUrl || pageId).trim()
        const pathWithDate = formattedDate ? `${formattedDate}/${publicSlug}` : publicSlug

        const args = {
            WEDDING_IMAGE: imageUrl,
            CUSTOM_TITLE: customTitle,
            CUSTOM_BODY: customBody,
            WEDDING_URL: pathWithDate, // 날짜/page_id 형태 전달
        }
        console.log('[KakaoShare] templateArgs 계산 완료:', args)
        return args
    }, [settings, inviteData, pageId, userUrl])

    // 템플릿 ID 고정값
    const templateId = "124666"

    const kakao = kakaoClient

    // isReadyToShare 조건 완화: Share 모듈이 있으면 활성화
    const isReadyToShare = useMemo(() => {
        const hasTemplateId = !!templateId
        const hasPageId = !!pageId
        const hasTemplateArgs = !!templateArgs
        const hasKakao = !!kakao
        const hasShare = !!(kakao?.Share)
        const isInit = typeof kakao?.isInitialized === 'function' ? kakao.isInitialized() : hasShare
        
        const ready = hasTemplateId && hasPageId && hasTemplateArgs && hasKakao && hasShare && (kakaoReady || isInit)
        
        if (typeof window !== 'undefined') {
            console.error('🔴 [KakaoShare] isReadyToShare 계산:', {
                hasTemplateId,
                hasPageId,
                hasTemplateArgs,
                hasKakao,
                hasShare,
                kakaoReady,
                isInit,
                ready,
            })
        }
        
        return ready
    }, [templateId, pageId, templateArgs, kakao, kakaoReady])

    // 디버깅: 상태 변경 추적
    useEffect(() => {
        if (typeof window !== 'undefined') {
            console.error('🔴 [KakaoShare] 상태 변경:', {
                templateId: !!templateId,
                pageId: !!pageId,
                hasTemplateArgs: !!templateArgs,
                hasKakao: !!kakao,
                hasShare: !!(kakao?.Share),
                kakaoReady,
                isReadyToShare,
            })
        }
    }, [templateId, pageId, templateArgs, kakao, kakaoReady, isReadyToShare])

    const handleShare = () => {
        console.error('🔴 [KakaoShare] 버튼 클릭됨!')
        console.log('[KakaoShare] handleShare 호출, isReadyToShare:', isReadyToShare)
        console.log('[KakaoShare] templateArgs:', templateArgs)
        console.log('[KakaoShare] kakao:', kakao)
        
        // 카카오 SDK 재확인
        const currentKakao =
            kakaoClient ||
            (typeof window !== 'undefined' ? (window as Window).Kakao : undefined)
        if (!currentKakao) {
            console.error('🔴 [KakaoShare] window.Kakao를 찾을 수 없음')
            alert('카카오 SDK가 로드되지 않았습니다. 페이지를 새로고침해주세요.')
            return
        }

        if (!currentKakao.Share) {
            console.error('🔴 [KakaoShare] Kakao.Share 모듈을 찾을 수 없음')
            alert('카카오톡 공유 모듈을 찾을 수 없습니다. 페이지를 새로고침해주세요.')
            return
        }

        if (!templateArgs) {
            console.error('🔴 [KakaoShare] templateArgs가 없음')
            alert('공유할 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
            return
        }

        // isInitialized 확인 및 재초기화 시도
        if (typeof currentKakao.isInitialized === 'function' && !currentKakao.isInitialized()) {
            console.log('[KakaoShare] SDK 미초기화, 재초기화 시도')
            try {
                currentKakao.init(KAKAO_APP_KEY)
            } catch (error) {
                console.error('[KakaoShare] 재초기화 실패:', error)
            }
        }

        try {
            console.log('[KakaoShare] 카카오톡 공유 시도')
            console.log('[KakaoShare] templateId:', templateId)
            console.log('[KakaoShare] templateArgs:', templateArgs)
            
            // 카카오 개발자 문서에 따른 sendCustom 사용
            // https://developers.kakao.com/docs/latest/ko/kakaotalk-share/js-link
            currentKakao.Share.sendCustom({
                templateId: Number(templateId),
                templateArgs: templateArgs,
            })
            console.log('[KakaoShare] 카카오톡 공유 성공')
        } catch (error) {
            console.error('🔴 [KakaoShare] 카카오톡 공유 실패', error)
            if (error instanceof Error) {
                console.error('[KakaoShare] 에러 메시지:', error.message)
                console.error('[KakaoShare] 에러 스택:', error.stack)
            }
            alert(`카카오톡 공유 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        }
    }

    // 렌더링 시점 로그 (클라이언트 사이드에서만)
    if (typeof window !== 'undefined') {
        console.error('🔴 [KakaoShare] 렌더링 중 (클라이언트)', {
            isReadyToShare,
            hasPageId: !!pageId,
            hasSettings: !!settings,
            hasTemplateArgs: !!templateArgs,
            hasKakao: !!kakao,
            hasShare: !!(kakao?.Share),
            kakaoReady,
        })
    }

    // 항상 렌더링 (버튼은 항상 보이도록)
    return (
        <div 
            style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                color: 'rgba(245, 245, 245, 1)',
                backgroundColor: '#FAFAFA',
                paddingTop: 40,
                paddingBottom: 40,
                ...(style || {})
            }}
            onMouseEnter={() => console.log('[KakaoShare] 컨테이너 마우스 오버')}
        >
            <button
                type="button"
                onClick={handleShare}
                disabled={!isReadyToShare}
                onMouseEnter={() => {
                    console.error('🔴 [KakaoShare] 버튼 마우스 오버')
                    console.log('[KakaoShare] 버튼 상태:', { isReadyToShare, disabled: !isReadyToShare })
                }}
                style={{
                    width: '60%',
                    minWidth: 160,
                    height: 54,
                    border: 'none',
                    backgroundColor: isReadyToShare ? '#FEE500' : '#e0e0e0',
                    color: isReadyToShare ? '#000' : '#999',
                    fontFamily: pretendardFontFamily,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: isReadyToShare ? 'pointer' : 'not-allowed',
                    opacity: isReadyToShare ? 1 : 0.6,
                    transition: 'all 0.2s ease',
                }}
            >
                {isReadyToShare ? '카카오톡으로 공유하기' : '카카오톡으로 공유하기 (준비 중...)'}
            </button>
        </div>
    )
}
